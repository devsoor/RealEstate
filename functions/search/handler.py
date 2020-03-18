import sys  
sys.path.append('vendor')
sys.path.append('src')

import os
import json
import ast
import traceback
import logging
import boto3
from lambda_decorators import cors_headers
from aws_requests_auth.aws_auth import AWSRequestsAuth
from elasticsearch import Elasticsearch, RequestsHttpConnection, NotFoundError
from mlsproperty import Property
from rp_database import RpDatabase
from search import PropertySearch, CmaMode
from search_bulk import PropertySearchBulk
from analyze import PropertyAnalyze
from search_options import SearchOptions
from cma.cma import CmaCalculator
from elasticsearch_dsl import connections
from assumptions.assumptions_repo import AssumptionsRepo
from assumptions.assumptions import Assumptions
from concurrent.futures import ThreadPoolExecutor, as_completed

es_host = 'search-realpeek-ypx5g2cg5c6yx775cdfhhez5qi.us-west-2.es.amazonaws.com'
awsauth = None
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

logger = logging.getLogger()
try:
    database = RpDatabase()
except:
    logger.error("error connecting to database")
    print("Unexpected error:", sys.exc_info()[0])
    traceback.print_exc()

def get_claims(event):
    claims =  event['requestContext']['authorizer']['claims']
    return json.loads(claims)

def aws_session(token, role_arn=None, session_name='session'):
    """
    If role_arn is given assumes a role and returns boto3 session
    otherwise return a regular session with the current IAM user/role
    """
    if role_arn:
        client = boto3.client('sts')
        response = client.assume_role(RoleArn=role_arn, RoleSessionName=session_name)

        session = boto3.Session(
            aws_access_key_id=response['Credentials']['AccessKeyId'],
            aws_secret_access_key=response['Credentials']['SecretAccessKey'],
            aws_session_token=response['Credentials']['SessionToken'])
        return session
    else:
        return boto3.Session()

def get_session(event):
    try:
        claims =  get_claims(event)
        role = claims['cognito:preferred_role']
        token = event['headers']['Authorization']
        session = aws_session(token, role, 'session')
        return session
    except:
        traceback.print_exc()
        return boto3.Session()

def get_user(event):
    try:
        claims =  get_claims(event)
        user = claims['cognito:username']
        return user
    except KeyError:
        traceback.print_exc()
        return None

def get_tenant(event):
    try:
        claims =  get_claims(event)
        tenant_id = claims['custom:tenantid']
        return tenant_id
    except KeyError:
        traceback.print_exc()
        return None

def user_is_admin(event):
    try:
        claims =  get_claims(event)
        groups = claims['cognito:groups']
        return "administrators" in groups
    except KeyError:
        traceback.print_exc()
        return None

def publish_property_change(event, context):
    # create the mappings in elasticsearch
    try:
        Property.init()
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

    try:
        # # instantiate the document
        print(event)
        prop = Property.from_dict(event)
    
        # save the document into the cluster
        prop.save()
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

    body = {
        "message": "Your function executed successfully!",
        "input": event
    }
    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }

    return response

def update_image_paths(event, context):
    if (event.get('LN')):
        id = 'nwmls-' + str(event.get('LN'))
    else:
        raise Exception('LN not provided')
    
    try:
        active_count = event['active_count']
        availability = event['availability']

        prop = Property.get(id=id)
        prop.add_image_paths(int(active_count), availability)
        prop.save()
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

    body = {
        "message": "Your function executed successfully!",
        "input": event
    }
    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }
    return response

@cors_headers
def get_property(event, context):
    try:
        propId = event['pathParameters']['id']
        prop = Property.get(id=propId)
        
        prop_details = database.get_property(propId, prop.property_type)
        prop_dict = prop.to_dict()
        prop_dict['details'] = prop_details
        if (prop):
            response = {
                "statusCode": 200,
                "body": json.dumps(prop_dict, default=str)
            }
            return response
    except KeyError:
        raise Exception('id not provided')
    except NotFoundError:
        response = {
            "statusCode": 404,
            "body": "Property not found"
        }
        return response

@cors_headers
def suggest(event, context):
    try:
        queryStringParams = event["queryStringParameters"]
        term = queryStringParams.get('t')
        suggestions = []
        if (len(term) > 1):
            site_id = get_tenant(event)
            suggestions = PropertySearch(site_id).suggest(term)
        response = {
            "statusCode": 200,
            "body": json.dumps(suggestions)
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

# for searching without an http request
def search_internal(event, context):
    print(event)
    try:
        query = {
            'from': event.get('from', 0),
            'size': event.get('size', 10),
            'searchAfter': event.get('searchAfter')
        }
        response = PropertySearch(None).scan(query)
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

@cors_headers
def search(event, context):
    print(event)
    try:
        if ("body" in event):
            data = json.loads(event["body"])
        
        cma_mode = CmaMode.NONE
        queryStringParams = event["queryStringParameters"]
        if (queryStringParams):
            try:
                cma_mode = CmaMode(int(queryStringParams.get('include_cma')))
            except:
                cma_mode = CmaMode.NONE

        site_id = get_tenant(event)
        response = PropertySearch(site_id).search(event, data, cma_mode)

        response = {
            "statusCode": 200,
            # "body": json.dumps(response)
            "body": json.dumps(response)
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        body = {
            "message": "Your function encountered an error",
            "input": event
        }
        response = {
            "statusCode": 200,
            "body": json.dumps(body)
        }

        return response
# end search function

@cors_headers
def search_bulk(event, context):
    print(event)
    try:
        if ("body" in event):
            data = json.loads(event["body"])
        
        cma_mode = CmaMode.NONE
        queryStringParams = event["queryStringParameters"]
        if (queryStringParams):
            try:
                cma_mode = CmaMode(int(queryStringParams.get('include_cma')))
            except:
                cma_mode = CmaMode.NONE

        site_id = get_tenant(event)
        response = PropertySearchBulk(site_id).search_bulk(event, data, cma_mode)

        response = {
            "statusCode": 200,
            # "body": json.dumps(response)
            "body": json.dumps(response)
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        body = {
            "message": "Your function encountered an error",
            "input": event
        }
        response = {
            "statusCode": 200,
            "body": json.dumps(body)
        }

        return response
# end search function

@cors_headers
def analyze(event, context):
    print("cors_analyze event: ", event)

    try:
        if ("body" in event):
            data = json.loads(event["body"])

        site_id = get_tenant(event)
        response = PropertyAnalyze(site_id).analyze(event, data)

        response = {
            "statusCode": 200,
            "body": json.dumps(response)
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        body = {
            "message": "Your function encountered an error",
            "input": event
        }
        response = {
            "statusCode": 200,
            "body": json.dumps(body)
        }

        return response
# end analyze function

def cma_calculation(event, context):
    print("cma_calculation: event = ", event)
    try:
        payload = event['pload']
        site_id = payload['site_id']
        ids = payload['id']
        session = get_session(event['event'])
        if type(ids) is not list:
            ids = [ids]

        request_params = payload["parameters"]
        request_options = payload["options"]

        cma_calculator = CmaCalculator(session, database, site_id, request_params, request_options)

        results = []
        for listingId in ids:
            print('calculating CMA for listing id ' + listingId)
            cma_result = cma_calculator.calculate(listingId, '', 'nwmls', True)
            results.append(cma_result)

        # with ThreadPoolExecutor(max_workers=40) as executor:
        #     futs = []
        #     for listingId in ids:
        #         print('calculating CMA for listing id ' + listingId)
        #         futs.append(executor.submit(cma_calculator.calculate, listingId, '', 'nwmls', True))
        #     print("DSDSDSDS cma_calculation: futs ARRAY", futs)
        #     # for future in as_completed(futs):
        #     for index in enumerate(ids):
        #         future = futs[index]
        #         print("DSDSDSDS cma_calculation: future", future)
        #         try:
        #             cma_result = future.result()
        #             print("DSDSDSDS cma_calculation: cma_result", cma_result)
        #             results.append(cma_result)
        #         except ValueError as e:
        #             print('cma_calculation: saw error "{}" when accessing result'.format(e))                  
    
        # with ThreadPoolExecutor(max_workers=40) as executor:
        #     for listingId in ids:
        #         print('calculating CMA for listing id ' + listingId)
        #         future = executor.submit(cma_calculator.calculate, listingId, '', 'nwmls', True)
        #         error = future.exception()
        #         print('cma_calculation: error: {}'.format(error))
        #         try:
        #             cma_result = future.result()
        #             results.append(cma_result)
        #         except ValueError as e:
        #             print('main: saw error "{}" when accessing result'.format(e)) 


        response = {
            "statusCode": 200,
            "body": json.dumps(results, default=str)
        }
        return response
    except KeyError:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()
        raise Exception('id not provided')
    except NotFoundError:
        response = {
            "statusCode": 404,
            "body": "Property not found"
        }
        return response

def cma_calculation_analyze(event, context):
    print("cma_calculation_analyze: event = ", event)
    try:
        payload = event['pload']
        site_id = payload['site_id']
        properties = payload['properties']
        session = get_session(event['event'])

        request_params = payload["parameters"]
        request_options = payload["options"]

        print("cma_calculation_analyze: calling CmaCalculator = ")

        cma_calculator = CmaCalculator(session, "", site_id, request_params, request_options)

        results = []
        for prop in properties:
            cma_result = cma_calculator.calculate_analyze(prop, True)
            results.append(cma_result)
        
        response = {
            "statusCode": 200,
            "body": json.dumps(results, default=str)
        }
        return response
    except KeyError:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()
        raise Exception('id not provided')
    except NotFoundError:
        response = {
            "statusCode": 404,
            "body": "Property not found"
        }
        return response


@cors_headers
def cma_calculation_http(event, context):
    try:
        site_id = get_tenant(event)
        listingId = event['pathParameters']['id']
        session = get_session(event)
    except KeyError:
        raise Exception('id not provided')

    try:
        if ("body" in event):
            data = json.loads(event["body"])
        
        request_params = data["parameters"]
        request_options = data["options"]

        cma_calculator = CmaCalculator(session, database, site_id, request_params, request_options)
        cma_result = cma_calculator.calculate(listingId, '', 'nwmls', True)
        
        response = {
            "statusCode": 200,
            "body": json.dumps(cma_result, default=str)
        }
        return response
    except NotFoundError:
        response = {
            "statusCode": 404,
            "body": "Property not found"
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()
        response = {
            "statusCode": 500,
            "body": "An unexpected error occurred"
        }
        return response

@cors_headers
def cma_calculation_analyze_http(event, context):
    try:
        site_id = get_tenant(event)

        session = get_session(event)
    except KeyError:
        raise Exception('id not provided')

    try:
        if ("body" in event):
            data = json.loads(event["body"])
        
        request_params = data["parameters"]
        request_options = data["options"]
        prop = data["property"]

        cma_calculator = CmaCalculator(session, "", site_id, request_params, request_options)
        cma_result = cma_calculator.calculate_analyze(prop, True)
        
        response = {
            "statusCode": 200,
            "body": json.dumps(cma_result, default=str)
        }
        return response
    except NotFoundError:
        response = {
            "statusCode": 404,
            "body": "Property not found"
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()
        response = {
            "statusCode": 500,
            "body": "An unexpected error occurred"
        }
        return response

@cors_headers
def get_search_options(event, context):
    try:
        s = SearchOptions()
        response = {
            "statusCode": 200,
            "body": json.dumps(s.__dict__, default=str)
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 500,
            "body": "Search Options not found"
        }
        return response

@cors_headers
def get_total_actives(event, context):
    print("get_total_actives CORS: event = ", event)
    try:
        site_id = get_tenant(event)
        s = PropertySearch(site_id).total_actives()
        response = {
            "statusCode": 200,
            "body": json.dumps(s, default=int)
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 500,
            "body": "Total active properties not found"
        }
        return response

@cors_headers
def get_assumptions(event, context):
    try:
        user = get_user(event)
        session = get_session(event)
        if (not user):
            response = {
                "statusCode": 403,
                "body": "You must be logged in to get assumptions"
            }
            return response

        site_id = event['pathParameters']['id']
        is_admin = user_is_admin(event)
        if (site_id == "default" and is_admin):
            site_id = "__DEFAULT__"
        if site_id == "0":
            site_id = get_tenant(event)
        repo = AssumptionsRepo(session)
        assumptions = repo.get_assumptions(user, site_id, is_admin)
        
        response = {
            "statusCode": 200,
            "body": json.dumps(assumptions, default=str)
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 500,
            "body": "Assumptions not found"
        }
        return response

@cors_headers
def update_assumptions(event, context):
    try:
        user = get_user(event)
        session = get_session(event)
        if (not user):
            response = {
                "statusCode": 403,
                "body": "You must be logged in to get assumptions"
            }
            return response
        if ("body" in event):
            assumptions_data = json.loads(event["body"])
            site_id = event['pathParameters']['id']
            is_admin = user_is_admin(event)
            if (site_id == "default" and is_admin):
                site_id = "__DEFAULT__"
            if not site_id:
                site_id = get_tenant(event)
        else:
            raise ValueError("No Event Body")
        repo = AssumptionsRepo(session)
        a = Assumptions(user, site_id, assumptions_data)
        print(a)
        if site_id == "__DEFAULT__":
            repo.save_platform_assumptions(a)
        elif event['pathParameters']['id'] != "0":
            repo.save_site_assumptions(a)
        else:
            repo.save_user_assumptions(a)
        a = repo.get_assumptions(user, site_id, is_admin)
        response = {
            "statusCode": 200,
            "body": json.dumps(a, default=str)
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 500,
            "body": "Assumptions not found"
        }
        return response