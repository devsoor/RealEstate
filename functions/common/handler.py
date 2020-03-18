import json
import urllib
import time
import sys  
import traceback
import boto3
import os
from datetime import datetime

sys.path.append('vendor')
import pytz
from jose import jwk, jwt

lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
tenant_table = dynamodb.Table("Tenants")
user_table = dynamodb.Table("Users")

stage = os.environ.get('stage')

# add main user pool to tenants list
tenants = {
    'platform': {
        'user_pool_id': 'us-west-2_lPSGbjTAX',
        'appclient_id': 'ga6ni73qsfq2pr7aj5kbraveq'
    }
}

def authorizer(event, context):
    auth_token = event['authorizationToken']
    methodArn = event['methodArn']
    print(methodArn)
    # Raise 401 Unauthorized response if there is no token
    if not auth_token:
        raise Exception('Unauthorized') 

    try:
        claims = jwt.get_unverified_claims(auth_token)
        print(claims)
        header = jwt.get_unverified_header(auth_token)
        if claims:
            iss = claims['iss']
            tenant_id = claims['custom:tenantid']
            user_id = claims['sub']
            kid = header.get('kid')

            if iss == 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_lPSGbjTAX':
                tenant_id = 'platform'
                
            tenant = get_tenant(tenant_id)
            print(tenant)
            if not tenant:
                print('Invalid issuer')
                raise Exception('Invalid issuer')

            pem = get_certificate(iss, kid)
            if not pem:
                print('Invalid access token')
                raise Exception('Invalid access token')
            
            [prefix, slash, userpool] = iss.rpartition('/')
            tenant_issuer = prefix + slash + tenant["user_pool_id"]
            intended_audience = tenant["appclient_id"]

            verified_claims = jwt.decode(auth_token, pem, 
                algorithms='RS256', 
                issuer=tenant_issuer,
                audience=intended_audience)
            if not verified_claims:
                raise Exception('Invalid token')
            policy = generate_policy(claims, 'Allow', methodArn)

            try:
                u = {
                    'tenant_id': tenant_id, 'user_id': user_id
                }
                lambda_client.invoke(
                    FunctionName   = f"common-{stage}-log_activity",
                    InvocationType = "Event",
                    Payload        = bytes(json.dumps(u), 'utf8')
                )
            except:
                print('error logging user activity')
                traceback.print_exc()
            return policy
        else:
            raise Exception('Invalid token')
    except Exception as e:
        traceback.print_exc()
        print(f'Exception encountered: {e}')
        raise Exception('Unauthorized')


def get_tenant(tenant_id):
    try:
        if tenant_id not in tenants:
            response = tenant_table.get_item(Key={'tenant_id': tenant_id})
            tenant = response['Item']
            tenants[tenant_id] = tenant
        return tenants[tenant_id]
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise Exception('Unauthorized')


def get_certificate(iss, kid):
    # cache for certificates
    certificates = {}

    '''helper function to load certificate of issuer'''
    if certificates.get(iss):
        # return cached certificate, if exists
        return certificates.get(iss).get(kid)

    keys_url = f'{iss}/.well-known/jwks.json'
    response = urllib.request.urlopen(keys_url)
    keys = json.loads(response.read())['keys']
    pems = {}
    for k in keys:
        pems[k["kid"]] = k # jwk.construct(k)
    certificates[iss] = pems
    return pems[kid]

def generate_policy(payload, effect, resource):
    '''
    Helper function to generate an IAM policy
    '''
    tenant = payload.get('custom:tenantid')
    # if not tenant:
    #     raise Exception("Unknown tenant")
    authResponse = {}

    authResponse["principalId"] = payload['sub']
    if effect and resource:
        authResponse["policyDocument"] = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "execute-api:Invoke",
                "Effect": effect,
                "Resource": resource
            }]
        }

    # extract tenant id from iss
    payload["tenant"] = tenant

    authResponse["context"] = { 
        'claims': json.dumps(payload, default=str) 
    }

    return authResponse

def log_user_activity(event, context):
    tenant_id = event['tenant_id']
    user_id = event['user_id']
    
    response = user_table.update_item(
        Key={
            'tenant_id': tenant_id,
            'user_id': user_id
        },
        UpdateExpression="set last_activity_utc = :t",
        ExpressionAttributeValues={
            ':t': utcnow().isoformat()
        },
        ReturnValues="UPDATED_NEW"
    )
    return response

def utcnow():
    return datetime.now(tz=pytz.utc)