# import json
import boto3
import logging
import traceback
import sys 
sys.path.append('vendor')

import simplejson as json

from lambda_decorators import cors_headers
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
tenants_table = dynamodb.Table('Tenants')
users_table = dynamodb.Table('Users')
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_claims(event):
    claims =  event['requestContext']['authorizer']['claims']
    return json.loads(claims)

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
def get_settings(event, context):
    user = get_user(event)

    if (not user):
        logger.error('user not found')
        return {
            "statusCode": 403,
            "body": "You must be logged in to get settings"
        }
    

    try:
        print('getting tenant')
        tenant_id = get_tenant(event)
        print(tenant_id)

        response = tenants_table.get_item(Key={'tenant_id': tenant_id})
        settings = response['Item']
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(settings)
        }

@cors_headers
def get_tenant_settings(event, context):
    try:
        site_name = event['pathParameters'].get('site_name')
        tenant_id = event['pathParameters'].get('tenant_id')
        if not (site_name or tenant_id):
            return {
                "statusCode": 404,
                "body": "Site not found"
            }
        if site_name:
            response = tenants_table.query(
                IndexName='site_name-index',
                KeyConditionExpression=Key('site_name').eq(site_name),
                FilterExpression=Attr('registration_status').ne('CREATING_RESOURCES')
            )
            settings = response['Items'][0]
        else:
            response = tenants_table.get_item(Key={'tenant_id': tenant_id})
            settings = response['Item']
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        raise e
    except:
        traceback.print_exc()
        return {
            "statusCode": 404,
            "body": "Site not found"
        }
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(settings)
        }

@cors_headers
def get_platform_settings(event, context):
    try:
        settings = {
            'identity_pool_id': 'us-west-2:49b61753-4fc3-4693-adba-9b927add24aa',
            'appclient_id': 'ga6ni73qsfq2pr7aj5kbraveq',
            'user_pool_id': 'us-west-2_lPSGbjTAX'
        }
    except:
        traceback.print_exc()
        return {
            "statusCode": 404,
            "body": "Site not found"
        }
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(settings)
        }

