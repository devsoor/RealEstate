# import json
import boto3
import logging
import traceback
import sys
import boto3
sys.path.append('vendor')
sys.path.append('src')

import simplejson as json
from dynamodb_json import json_util as dynamodb_json
from lambda_decorators import cors_headers
from botocore.exceptions import ClientError
from tenant_repo import TenantRepo
from user_repo import UserRepo
from tenant import Tenant
from tenant_resources_stack import TenantStack
from user import User, Role
from role_manager import RoleManager
from admin_notifications import Notifications
from exceptions import Error, NotAuthorizedError, BillingPlanError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cognito = boto3.client('cognito-idp')

def get_claims(event):
    claims =  event['requestContext']['authorizer']['claims']
    return json.loads(claims)

def aws_session(role_arn=None, session_name='session'):
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
        role = claims.get('cognito:preferred_role')
        print(role)
        return aws_session(role, 'session')
    except:
        traceback.print_exc()
        return boto3.Session()

def get_user(event):
    try:
        claims =  get_claims(event)
        user = claims['cognito:username']
        print(claims)
        return user
    except:
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

def user_is_site_admin(event, editing_tenant_id):
    try:
        claims =  get_claims(event)
        groups = claims['cognito:groups']
        tenant_id = claims['custom:tenantid']
        return "site_admin" in groups and (editing_tenant_id == tenant_id)
    except KeyError:
        traceback.print_exc()
        return None

def user_is_site_member(event, editing_tenant_id):
    try:
        claims =  get_claims(event)
        groups = claims['cognito:groups']
        tenant_id = claims['custom:tenantid']
        return "site_member" in groups and (editing_tenant_id == tenant_id)
    except KeyError:
        traceback.print_exc()
        return None

@cors_headers
def get_tenants(event, context):
    user = get_user(event)
    session = get_session(event)
    is_authorized = user_is_admin(event)
    
    if (not user or not is_authorized):
        logger.error('user not authorized')
        return {
            "statusCode": 403,
            "body": "User not authorized"
        }
    try:
        repo = TenantRepo(session)
        tenants = repo.get_tenants(20, None)
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        return {
            "statusCode": 502,
            "body": "Error occurred getting tenants"
        }
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(tenants)
        }

@cors_headers
def create_tenant(event, context):
    user = get_user(event)
    session = get_session(event)

    is_authorized = user_is_admin(event)
    if ("body" in event):
        tenant_data = json.loads(event["body"])
    else:
        raise ValueError("No Event Body")
        
    if (not user or not is_authorized):
        logger.error('user not authorized')
        return {
            "statusCode": 403,
            "body": "User not authorized"
        }
    
    try:
        tenantRepo = TenantRepo(session)

        print('creating tenant ' + tenant_data['agent_name'])
        tenant = Tenant.from_dict(tenant_data)
        tenantRepo.register(tenant)
        print('finished creating tenant: ' + tenant.tenant_id)
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        raise e
    except ValueError as e:
        return {
            "statusCode": 400,
            "body": {
                "error": str(e)
            }
        }
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(tenant.__dict__)
        }

def create_tenant_resources(event, context):
    tenant_id = event['tenant_id']
    admin_role_arn = 'arn:aws:iam::450322736372:role/Cognito_realpeek_admin_role'
    session = aws_session(admin_role_arn)
    tenantRepo = TenantRepo(session)
    userRepo = UserRepo(session)

    # create all the tenant resources
    tenant = tenantRepo.create_tenant_resources(tenant_id)

    # if an admin username is provided, create a user account
    admin_email = tenant.admin_email
    if (admin_email):
        print('creating admin user: ' + admin_email)
        admin_user_data = {
            "email": admin_email
        }
        admin_user = tenant.create_member(admin_user_data, Role.SITE_ADMIN)
        created_user = userRepo.save(admin_user)
        tenantRepo.update(tenant)
        print('created admin user')
        print(created_user)
        

@cors_headers
def update_tenant(event, context):
    if ("body" in event):
        tenant_data = json.loads(event["body"])
        tenant_id = event['pathParameters']['tenant_id']
    else:
        raise ValueError("No Event Body")

    user = get_user(event)
    session = get_session(event)
    # user is authorized if they are a sys_admin or an admin of the tenant being edited
    is_authorized = user_is_admin(event) or user_is_site_admin(event, tenant_id)
    
    if (not user or not is_authorized):
        logger.error('user not authorized')
        return {
            "statusCode": 403,
            "body": "User not authorized"
        }
    
    try:
        print('editing tenant ' + tenant_id)
        repo = TenantRepo(session)
        tenant = repo.get_tenant(tenant_id)
        tenant.update_from_dict(tenant_data)
        if user_is_admin(event):
            if tenant_data.get('site_name'):
                tenant.update_site_name(tenant_data.get('site_name'))
            if tenant_data.get('max_members'):
                tenant.update_max_members(int(tenant_data.get('max_members')))
        repo.update(tenant)
        print('finished editing tenant: ' + tenant.tenant_id)
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        raise e
    except BillingPlanError as e:
        logger.error('billing plan error')
        logger.error(e.Message)
        return {
            "statusCode": 400,
            "body": e.Message
        }
    except ValueError as e:
        return {
            "statusCode": 400,
            "body": {
                "error": str(e)
            }
        }
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(tenant.__dict__)
        }

@cors_headers
def delete_tenant(event, context):
    user = get_user(event)
    session = get_session(event)
    tenant_id = event['pathParameters']['tenant_id']
    # user is authorized if they are a sys_admin or an admin of the tenant being edited
    is_authorized = user_is_admin(event)
    
    if (not user or not is_authorized):
        logger.error('user not authorized')
        return {
            "statusCode": 403,
            "body": "User not authorized"
        }
    
    try:
        print('deleting tenant ' + tenant_id)
        repo = TenantRepo(session)
        tenant = repo.get_tenant(tenant_id)
        repo.delete(tenant)
        print('finished deleting tenant: ' + tenant.tenant_id)
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        raise e
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }
    else:
        return {
            "statusCode": 200,
            "body": {}
        }

@cors_headers
def get_users(event, context):
    user = get_user(event)
    session = get_session(event)

    tenant_id = event['pathParameters']['tenant_id']
    pagination_key = event['pathParameters'].get('p')
    # user is authorized if they are a sys_admin or an admin of the specified tenant
    is_authorized = user_is_admin(event) or user_is_site_member(event, tenant_id)
    
    if (not user or not is_authorized):
        logger.error('user not authorized')
        return {
            "statusCode": 403,
            "body": "User not authorized"
        }

    try:
        repo = TenantRepo(session)
        users = repo.get_users_for_tenant(tenant_id, 20, pagination_key)
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        return {
            "statusCode": 502,
            "body": "Error occurred getting users"
        }
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(users, default=str)
        }

@cors_headers
def user_sign_up(event, context):
    tenant_id = event['pathParameters']['tenant_id']
    if ("body" in event):
        user_data = json.loads(event["body"])
    else:
        raise ValueError("No Event Body")
    
    try:
        username = user_data.get('username')
        if username:
            session = get_session(event)
            tenantRepo = TenantRepo(session)
            userRepo = UserRepo(session)

            tenant = tenantRepo.get_tenant(tenant_id)
            user = userRepo.get_user(tenant, username)
            if not user:
                raise "User does not exist"
            userRepo.add_user_to_site(tenant, username)
            return {
                "statusCode": 200
            }
        else:
            raise "Username is required"
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }

@cors_headers
def create_user(event, context):
    user = get_user(event)
    session = get_session(event)
    tenant_id = event['pathParameters']['tenant_id']
    
    # user is authorized if they are a sys_admin or an admin of the tenant being edited
    is_authorized = user_is_admin(event) or user_is_site_member(event, tenant_id)
    
    if (not user or not is_authorized):
        logger.error('user not authorized')
        return {
            "statusCode": 403,
            "body": "User not authorized"
        }
    if ("body" in event):
        user_data = json.loads(event["body"])
    else:
        raise ValueError("No Event Body")
    try:
        tenantRepo = TenantRepo(session)
        userRepo = UserRepo(session)

        tenant = tenantRepo.get_tenant(tenant_id)
        user = tenant.create_user(user_data, Role.USER)
        print('creating user: ')
        print(user.__dict__)
        created_user = userRepo.save(user)
        print('created user')
        print(created_user)
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        return {
            "statusCode": 400,
            "body": e.response['Error']['Message']
        }
    except (cognito.exceptions.AliasExistsException, cognito.exceptions.UsernameExistsException) as e:
        logger.error(e.response['Error']['Message'])
        return {
            "statusCode": 400,
            "body": e.response['Error']['Message']
        }
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(created_user, default=str)
        }

@cors_headers
def delete_user(event, context):
    session = get_session(event)
    tenant_id = event['pathParameters']['tenant_id']
    email = event['pathParameters']['email']

    # user is authorized if they are a sys_admin or an admin of the tenant being edited
    is_authorized = user_is_admin(event) or user_is_site_admin(event, tenant_id)

    if not is_authorized:
        logger.error('user not authorized')
        return {
            "statusCode": 403,
            "body": "User not authorized"
        }

    try:
        tenantRepo = TenantRepo(session)
        userRepo = UserRepo(session)

        tenant = tenantRepo.get_tenant(tenant_id)
        member = userRepo.get_user(tenant, email)
        
        userRepo.delete(tenant, member)
        return {
            "statusCode": 200
        }
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }

@cors_headers
def create_member(event, context):
    user = get_user(event)
    session = get_session(event)
    tenant_id = event['pathParameters']['tenant_id']

    # user is authorized if they are a sys_admin or an admin of the tenant being edited
    is_authorized = user_is_admin(event) or user_is_site_admin(event, tenant_id)

    if not is_authorized:
        logger.error('user not authorized')
        return {
            "statusCode": 403,
            "body": "User not authorized"
        }

    if ("body" in event):
        user_data = json.loads(event["body"])
    else:
        raise ValueError("No Event Body")
    try:
        tenantRepo = TenantRepo(session)
        userRepo = UserRepo(session)

        tenant = tenantRepo.get_tenant(tenant_id)
        member = tenant.create_member(user_data, Role.SITE_MEMBER)
        created_user = userRepo.save(member)
        tenantRepo.update(tenant)

        return {
            "statusCode": 200,
            "body": json.dumps(created_user, default=str)
        }
    except (ClientError, cognito.exceptions.AliasExistsException, cognito.exceptions.UsernameExistsException) as e:
        logger.error(e.response['Error']['Message'])
        return {
            "statusCode": 400,
            "body": e.response['Error']['Message']
        }
    except BillingPlanError as e:
        logger.error('billing plan error')
        logger.error(e.Message)
        return {
            "statusCode": 400,
            "body": e.Message
        }
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }

@cors_headers
def delete_member(event, context):
    session = get_session(event)
    tenant_id = event['pathParameters']['tenant_id']
    email = event['pathParameters']['email']

    # user is authorized if they are a sys_admin or an admin of the tenant being edited
    is_authorized = user_is_admin(event) or user_is_site_admin(event, tenant_id)

    if not is_authorized:
        logger.error('user not authorized')
        return {
            "statusCode": 403,
            "body": "User not authorized"
        }

    try:
        tenantRepo = TenantRepo(session)
        userRepo = UserRepo(session)

        tenant = tenantRepo.get_tenant(tenant_id)
        member = userRepo.get_user(tenant, email)
        tenant.delete_member(member)
        
        userRepo.delete(tenant, member)
        tenantRepo.update(tenant)
        
        return {
            "statusCode": 200
        }
    except (ClientError, cognito.exceptions.AliasExistsException, cognito.exceptions.UsernameExistsException) as e:
        logger.error(e.response['Error']['Message'])
        return {
            "statusCode": 400,
            "body": e.response['Error']['Message']
        }
    except BillingPlanError as e:
        logger.error('billing plan error')
        logger.error(e.Message)
        return {
            "statusCode": 400,
            "body": e.Message
        }
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }


@cors_headers
def get_members(event, context):
    session = get_session(event)

    tenant_id = event['pathParameters']['tenant_id']
    pagination_key = event['pathParameters'].get('p')

    try:
        repo = TenantRepo(session)
        users = repo.get_members_for_tenant(tenant_id, 20, pagination_key)
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred getting members"
        }
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(users, default=str)
        }

def notify_on_signup(event, context):
    session = get_session(event)
    notifier = Notifications(session)
    print(event)
    for record in event['Records']:
        try:
            new_user_str = record['body']
            new_user_json = json.loads(new_user_str)
            notifier.on_user_signup(new_user_json)
        except:
            logging.error('An error occurred whild sending a new user alert')
            logging.error(record)
            traceback.print_exc()

def delete_tenant_test(event, context):
    tenant_id = event
    session = get_session(event)
    print('deleting tenant ' + tenant_id)
    repo = TenantRepo(session)
    tenant = repo.get_tenant(tenant_id)
    repo.delete(tenant)
    print('finished deleting tenant: ' + tenant.tenant_id)
    
    return True

def create_tenant_test(event, context):
    print(sys.version)
    print(event)
    tenant_data = event
    session = get_session(event)

    ##########################################################################################
    ##############ANY CHANGES MADE HERE NEED TO BE MIRRORED UP TO THE ACTUAL CREATE_TENANT FUCTION
    ##########################################################################################

    try:
        tenantRepo = TenantRepo(session)
        userRepo = UserRepo(session)

        print('creating tenant ' + tenant_data['agent_name'])
        tenant = Tenant.from_dict(tenant_data)
        tenantRepo.register(tenant)
        print('finished creating tenant: ' + tenant.tenant_id)

        # if an admin username is provided, create a user account
        admin_email = tenant_data.get('admin_email')
        if (admin_email):
            print('creating admin user: ' + admin_email)
            admin_user = User(tenant.tenant_id, tenant.user_pool_id,tenant_data.get('admin_email'), Role.SITE_ADMIN, tenant_data.get('temp_password'))
            created_user = userRepo.save(admin_user)
            print('created admin user')
            print(created_user)

    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        raise e
    except ValueError as e:
        return {
            "statusCode": 400,
            "body": {
                "error": str(e)
            }
        }
    except:
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "An error has occurred"
        }
    else:
        return {
            "statusCode": 200,
            "body": json.dumps(tenant.__dict__)
        }

def cf_test(event, context):
    session = get_session(event)
    repo = TenantRepo(session)
    tenant = repo.get_tenant('20e6ddddfd234d6693dbf71b56c0ac92')
    role_manager = RoleManager(session)
    stack = TenantStack(tenant, session, role_manager)
    outputs = stack.create_or_update_stack()
    for output in outputs:
        key = output['OutputKey']
        val = output['OutputValue']
        if key == 'UserPoolId':
            tenant.user_pool_id = val
        elif key == 'ClientId':
            tenant.appclient_id = val 
        elif key == 'IdentityPoolId':
            tenant.identity_pool_id = val
    # stack.delete_stack()
