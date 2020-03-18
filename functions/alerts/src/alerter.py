import time
import os
import logging
import sys
import traceback
import simplejson as json
from datetime import datetime, timedelta
from elasticsearch import Elasticsearch, RequestsHttpConnection, NotFoundError, ElasticsearchException
from elasticsearch_dsl import connections, Search
from elasticsearch_dsl.query import Term, Bool
from aws_requests_auth.aws_auth import AWSRequestsAuth
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

from utils import ts_now, dt_to_ts, weekday_pst
from rule_config import RuleConfig, EmailFrequency
from rule_run import RuleRun
from email_alerter import EmailAlerter

sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
saved_searches = dynamodb.Table("SavedSearches")

es_host = 'search-realpeek-ypx5g2cg5c6yx775cdfhhez5qi.us-west-2.es.amazonaws.com'
awsauth = None
property_index = 'property'
if ('AWS_ACCESS_KEY_ID' in os.environ):
    awsauth = AWSRequestsAuth(
        aws_access_key=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        aws_token=os.environ['AWS_SESSION_TOKEN'],
        aws_host=es_host,
        aws_region=os.environ['AWS_REGION'],
        aws_service='es'
    )

# define the global elasticsearch connection
connections.create_connection(hosts=['https://' + es_host + '/'], 
    timeout=20, verify_certs=True, use_ssl=True, http_auth=awsauth, connection_class=RequestsHttpConnection)

es_client = Elasticsearch(hosts=['https://' + es_host + '/'], 
    timeout=20, verify_certs=True, use_ssl=True, http_auth=awsauth, connection_class=RequestsHttpConnection)

queue_url = os.environ['ruleQueue']

class Alerter():
    def __init__(self):
        self.es_client = es_client
        self.write_index = 'alerts'
        self.total_hits = 0
        self.max_query_size = 10

    def save_rule(self, rule:dict):
        rule = RuleConfig.from_dict(**rule)
        rule.save()
        return rule

    def delete_rule(self, rule_id):
        rule = RuleConfig.get(id=rule_id, ignore=404)
        if rule is not None:
            rule.delete()

    def load_rules(self):
        '''
        Loads all the saved searches from DynamoDB and indexes them for easy searching
        '''
        print('loading rules')
        try:
            # create the mappings in elasticsearch
            RuleConfig.init()
            RuleRun.init()
        except:
            print('error creating index', sys.exc_info()[0])
            traceback.print_exc()
            raise
            

        try:    
            response = saved_searches.scan()
            for i in response['Items']:
                self.save_rule(i)
            while 'LastEvaluatedKey' in response:
                response = saved_searches.scan()
                for i in response['Items']:
                    self.save_rule(i)
        except:
            print('error saving rule to ES')
            traceback.print_exc()
            raise
    

    def run_all_rules(self, frequency=None, weekday=None):
        filters = []
        filters.append(Term(enabled=True))
        current_day = weekday_pst()
        if weekday:
            current_day = weekday

        if frequency.upper() == EmailFrequency.INSTANTLY.name:
            filters.append(Term(frequency=frequency))
        else:
            filters.append(Term(schedule_days=current_day))

        search = RuleConfig.search()
        search = search.query("bool", filter=filters)

        print(search.to_dict())
        results = search.scan()

        for hit in results:
            rule = hit.to_dict()
            
            print(rule['name'])
            print(rule.get('schedule_days'))

            response = sqs.send_message_batch(
                QueueUrl=queue_url,
                Entries=[
                    {
                        'Id': rule['id'],
                        'MessageBody': json.dumps(rule, default=str),
                    }
                ]
            )
            num_success = len(response.get('Successful', []))
            num_failed = len(response.get('Failed', []))
            print(f'Successful messages: {num_success}')
            print(f'Failed messages: {num_failed}')
            if num_failed:
                logging.error('Failed messages')
                logging.error(response['Failed'])
            

    def get_last_run(self, rule_id):
        """ Get the most recent run for this rule_id
        """

        s = RuleRun.search()
        s = s.filter('term', rule_id=rule_id).sort('-timestamp')
        s = s[:1]
        response = s.execute()
        if response.hits.total > 0:
            return response[0]
        else:
            return None

    def run_rule(self, rule:RuleConfig, endtime=None, starttime=None):
        """ Run a rule for a given time period.
        :param rule: The rule object.
        :param endtime: The latest timestamp to query.
        :param starttime: The earliest timestamp to query.
        :return: The number of matches that the rule produced.
        """
        last_run = self.get_last_run(rule.id)
        print('LAST RUN')
        print(last_run)
        current_run = RuleRun(rule_id=rule.id, rule_name=rule.name)
        current_run.start()

        if not endtime:
            # Mark this endtime for next run's start
            current_run.endtime = ts_now()
        if not starttime:
            if last_run:
                # Start from end of last run if it's available
                print('setting start time to end of last run ' + str(last_run.endtime))
                current_run.starttime = last_run.endtime
            else:
                # if there hasn't been a last run, start from when the rule was created
                current_run.starttime = rule.get_default_starttime()                
        else:
            current_run.starttime = starttime
        
        # Run the rule
        data = self.run_query(rule, current_run.starttime, current_run.endtime)
        current_run.add_data(data)
    
        num_matches = len(data)
        if num_matches:
            self.send_alert(data, rule)
        else:
            logging.info('No matches found')

        current_run.stop()
        # Write to ES that we've run this rule against this time period
        current_run.save()
        return num_matches

    def run_query(self, rule:RuleConfig, starttime=None, endtime=None, scroll=False):
        """ Query Elasticsearch for the given rule and return the results.
        :param rule: The rule configuration.
        :param start: The earliest time to query.
        :param end: The latest time to query.
        Returns True on success and False on failure.
        """
        if starttime is None:
            return False
        if endtime is None:
            endtime = ts_now()

        try:
            response = rule.execute_query(starttime, endtime, True, True)

            res = response.to_dict()
            # print(res)
            self.total_hits = int(res['hits']['total'])
            print(self.total_hits)

            logging.debug(str(res))
        except ElasticsearchException as e:
            # Elasticsearch sometimes gives us GIGANTIC error messages
            # (so big that they will fill the entire terminal buffer)
            traceback.print_exc()
            if len(str(e)) > 1024:
                e = str(e)[:1024] + '... (%d characters removed)' % (len(str(e)) - 1024)
            self.handle_error('Error running query: %s' % (e), {'rule': rule.name, 'query': query})
            return None

        hits = res['hits']['hits']
        num_hits = len(hits)
        status = f"Ran rule {rule.name} from {starttime} to {endtime}: Returned {num_hits} / {self.total_hits} hits"
        logging.info(status)

        return hits

    def send_alert(self, matches, rule:RuleConfig, alert_time=None, retried=False):
        logging.info('send email')
        email_alerter = EmailAlerter(rule)

        alert_sent = False
        alert_error = None
        try:
            email_alerter.alert(matches)
        except Exception as e:
            traceback.print_exc()
            self.handle_error(f'Error while sending alert for rule {rule.name}')
            alert_error = str(e)
        else:
            alert_sent = True

        ids = [m['_id'] for m in matches]
        alert_body = {
            'rule_name': rule.name,
            'matches': str(ids),
            'sent': alert_sent,
            'alert_time': ts_now()
        }
        print(alert_body)
        if not alert_sent:
            alert_body['error'] = alert_error
        
        self.writeback('email_alert', alert_body)

    def handle_error(self, message, data=None):
        ''' Logs message at error level and writes message, data and traceback to Elasticsearch. '''
        logging.error(message)
        body = {'message': message}
        tb = traceback.format_exc()
        body['traceback'] = tb.strip().split('\n')
        if data:
            body['data'] = data
        self.writeback('elastalert_error', body)

    def writeback(self, doc_type, body):
        write_index = self.get_index(doc_type)

        for key in body.keys():
            # Convert any datetime objects to timestamps
            if isinstance(body[key], datetime):
                body[key] = dt_to_ts(body[key])

        body['@timestamp'] = dt_to_ts(ts_now())

        try:
            res = self.es_client.index(index=write_index,
                                          doc_type=doc_type, body=body)
            return res
        except ElasticsearchException as e:
            logging.exception("Error writing alert info to Elasticsearch: %s" % (e))

    def get_index(self, doc_type):
        """ Get index name based on doc_type """
        write_index = self.write_index
        if doc_type == 'email_alert':
            write_index += '_alerts'
        elif doc_type == 'past_elastalert':
            write_index += '_past'
        elif doc_type == 'elastalert_error':
            write_index += '_error'
        return write_index