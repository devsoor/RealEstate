import sys  
sys.path.append('vendor')
sys.path.append('src')

from random import randint
from datetime import datetime
import uuid
import boto3
import os
import json
import ast
import traceback
from lambda_decorators import cors_headers
from aws_requests_auth.aws_auth import AWSRequestsAuth
from elasticsearch import Elasticsearch, RequestsHttpConnection, NotFoundError
from elasticsearch_dsl import connections
from concurrent.futures import ThreadPoolExecutor, as_completed


from portfolio import PortFolio
from analyze import FolioAnalyze
from cma import CmaCalculator

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

@cors_headers
def create_folio_property(event, context):
    print("DSDSDS<><><> CORS create_folio_property: event = ", event)
    try:
        if ("body" in event):
            folio_property_data = json.loads(event["body"])
            print("DSDSDS<><><> CORS create_folio_property:  folio_property_data = ", json.dumps(folio_property_data))
        else:
            raise ValueError("No Event Body")
        
        user = get_user(event)
        print("DSDSDSD<><><> create_folio_property: user = ", user)

        folio_property = PortFolio.create_property(user, folio_property_data)
        print("DSDSDSD<><><> create_folio_property: folio_property = ", folio_property)
        
        folio_property_save_debug = folio_property.save()
        print(folio_property_save_debug)

        response = {
            "statusCode": 200,
            "body": json.dumps(folio_property.__dict__, default=str)
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
            "statusCode": 500,
            "body": json.dumps(body)
        }
    return response

@cors_headers
def update_folio_property(event, context):
    print("DSDSDSDS<><><><> CORS update_folio_property: event = ", event)
    new_settings = {}
    user = get_user(event)
    if ("body" in event):
        new_settings = json.loads(event["body"])
        print("DSDSDSDS<><><><> CORS update_folio_property: in BODY new_settings = ", new_settings)
    else:
        raise ValueError("No Event Body")

    try:
        folio_property_id = event['pathParameters']['id']
        print("UPDATE PORTFOLIO PROPERTY  user:" +user+  " id:" + folio_property_id )
        
        folio_property = PortFolio.get_folio_property(user, folio_property_id)
        print("DSDSDSDS<><><><> CORS update_folio_property: GOT folio_property = ", folio_property)
        print("DSDSDSDS<><><><> CORS update_folio_property: calling update_Settings with new_settings = ", new_settings)
        folio_property.update_settings(folio_property_id, user, new_settings)
        folio_property.save()
        response = {
            "statusCode": 200,
            "body": json.dumps(folio_property.__dict__, default=str)
        }

        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 404,
            "body": "Saved Search not found"
        }
        return response



@cors_headers
def get_folio_property(event, context):
    user = get_user(event)
    if (not user):
        response = {
            "statusCode": 403,
            "body": "Authorized user not found"
        }
        return response
    
    try:
        folio_property_id = event['pathParameters']['id']
        print("GET PORTFOLIO PROPERTY  user:" +user+  " id:" + folio_property_id )
        folio_property = PortFolio.get_folio_property(user, folio_property_id)
        response = {
            "statusCode": 200,
            "body": json.dumps(folio_property.__dict__, default=str)
        }

        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 404,
            "body": "Portfolio Property not found"
        }
        return response
    

@cors_headers
def get_folio_properties(event, context):
    user = get_user(event)
    if (not user):
        response = {
            "statusCode": 403,
            "body": "Authorized user not found"
        }
        return response

    folio_properties = PortFolio.get_folio_properties_for_user(user)
    print(json.dumps(folio_properties, default=str))

    response = {
        "statusCode": 200,
        "body": json.dumps(folio_properties, default=str)
    }

    return response

@cors_headers
def delete_folio_property(event, context):
    user = get_user(event)

    try:
        id = event['pathParameters']['id']
        print("DELETE PORTFOLIO PROPERTY  user:" +user+  " id:" + id )
        PortFolio.delete_folio_property(user, id)
        response = {
            "statusCode": 200
        }

        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 404,
            "body": "Portfolio Property not found"
        }
        return response

@cors_headers
def analyze_folio(event, context):
    print("analyze_folio event: ", event)

    try:
        if ("body" in event):
            data = json.loads(event["body"])
            print("DSDSDSDSD<><><><><><> analyze_folio data: ", data)

        site_id = get_tenant(event)
        user_id = get_user(event)
        response = FolioAnalyze(site_id, user_id).analyze(event, data)
        print("DSDSDSDSD<><><><><><> analyze_folio response: ", response)

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

def cma_calculation_folio(event, context):
    print("cma_calculation_folio: event = ", event)
    try:
        payload = event['pload']
        site_id = payload['site_id']
        user_id = payload['user_id']
        property_ids = payload['property_ids']
        assumptions = payload['assumptions']
        session = get_session(event['event'])

        cma_calculator = CmaCalculator(session, "", site_id, user_id, assumptions)

        results = []
        for p_id in property_ids:
            cma_result = cma_calculator.calculate(p_id, True)
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

@cors_headers
def cma_calculation_http_folio(event, context):
    try:
        site_id = get_tenant(event)

        session = get_session(event)
    except KeyError:
        raise Exception('id not provided')

    try:
        if ("body" in event):
            data = json.loads(event["body"])
        
        # request_params = data["parameters"]
        # request_options = data["options"]
        prop = data["property"]

        cma_calculator = CmaCalculator(session, "", site_id, request_params, request_options)
        cma_result = cma_calculator.calculate_analyze(prop, True)
        
        response = {
            "statusCode": 200,
            "body": json.dumps(cma_result, default=str)
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