import sys
sys.path.append('vendor')
sys.path.append('src')
import datetime
import logging
import simplejson as json
from dynamodb_json import json_util as dynamodb_json
from rule_config import RuleConfig
from alerter import Alerter

def load_rules(event, context):
    alerter = Alerter()
    alerter.load_rules()

def update_rule(event, context):
    print(event)
    alerter = Alerter()
    for record in event['Records']:
        event_type = record['eventName']
        if event_type in ['INSERT', 'MODIFY']:
            new_rule_stream = record['dynamodb']['NewImage']
            new_rule_json = dynamodb_json.loads(new_rule_stream)
            logging.info('saving rule ' + new_rule_json['id'])
            alerter.save_rule(new_rule_json)
        elif event_type == 'REMOVE':
            deleted_rule_stream = record['dynamodb']['Keys']
            new_rule_key = dynamodb_json.loads(deleted_rule_stream)
            new_rule_id = new_rule_key['id']
            logging.info('deleting rule ' + new_rule_id)
            alerter.delete_rule(new_rule_id)
        else:
            logging.error('unknown event type ')
            raise Exception('Unknown event type ' + event_type)


def run_all_rules(event, context):
    print(event)
    frequency = event.get('frequency')
    weekday = event.get('weekday')
    # time_of_day = event.get('time_of_day')

    alerter = Alerter()
    alerter.run_all_rules(frequency, weekday)


def run_rule_batch(event, context):
    messages = event['Records']

    alerter = Alerter()

    for message in messages:
        body = json.loads(message['body'])
        print(body)
        rule = RuleConfig(**body)
        alerter.run_rule(rule)
