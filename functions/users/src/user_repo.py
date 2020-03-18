from datetime import datetime
import traceback
from enum import Enum
from user import Role
import json
import uuid
import boto3
import os
from config import config
from dynamodb_repo import DynamoDbRepo

queue_url = os.environ['userSignupQueue']
sqs = boto3.client('sqs')

class UserRepo():
    table_name = "Users"

    def __init__(self, aws_session):
        self.cognitoClient = aws_session.client('cognito-idp')
        self.dynamoDbRepo = DynamoDbRepo(aws_session)

    def save(self, user):
        try:
            query = {
                'UserPoolId': user.user_pool_id,
                'Username': user.username,
                'UserAttributes': [
                    {
                        'Name': 'email',
                        'Value': user.email
                    },
                    {
                        'Name': 'email_verified',
                        'Value': 'True'
                    },
                    {
                        'Name': 'custom:tenantid',
                        'Value': user.tenant_id
                    }
                ],
                'DesiredDeliveryMediums': ['EMAIL']
            }
            if user.temp_password:
                query['TemporaryPassword'] = user.temp_password
            user_response = self.cognitoClient.admin_create_user(**query)
            created_user = user_response['User']

            user_pool_id=user.user_pool_id
            username = created_user['Username']

            self.__add_to_user_table__(user.tenant_id, user.user_pool_id, username)
            if user.role == Role.SITE_ADMIN:
                admin_group = config['userRole']['tenantAdmin']
                member_group = config['userRole']['tenantMember']
                self.__add_user_to_group__(user_pool_id, username, admin_group)
                self.__add_user_to_group__(user_pool_id, username, member_group)
            elif user.role == Role.SITE_MEMBER:
                member_group = config['userRole']['tenantMember']
                self.__add_user_to_group__(user_pool_id, username, member_group)
            elif user.role == Role.USER:
                user_group = config['userRole']['tenantUser']
                self.__add_user_to_group__(user_pool_id, username, user_group)

            return user
        except (self.cognitoClient.exceptions.AliasExistsException, self.cognitoClient.exceptions.UsernameExistsException) as e:
            print('username already exists')
            raise e
        except Exception as e:
            print('an error occurred while creating the admin user')
            traceback.print_exc()
            raise e

    def __add_to_user_table__(self, tenant_id, user_pool_id, username):
        user = {
            'tenant_id': tenant_id,
            'user_pool_id': user_pool_id,
            'user_id': username
        }
        response =  self.dynamoDbRepo.save(UserRepo.table_name, user)
        self.notify_new_user(user)
        return response

    def __add_user_to_group__(self, user_pool_id, username, group_name):
        print(f'adding user {username} to group {group_name}' )
        self.cognitoClient.admin_add_user_to_group( 
            UserPoolId=user_pool_id,
            Username=username,
            GroupName=group_name )
    
    def get_user(self, tenant, username):
        response = self.cognitoClient.admin_get_user(
            UserPoolId=tenant.user_pool_id,
            Username=username
        )
        return response

    def delete(self, tenant, user):
        username = user['Username']
        print(f'deleting user {username} from tenant {tenant.tenant_id}' )
        self.cognitoClient.admin_delete_user( 
            UserPoolId=tenant.user_pool_id,
            Username=username)
        self.dynamoDbRepo.delete(UserRepo.table_name, {
            'tenant_id': tenant.tenant_id,
            'user_id': username
        })

    def add_user_to_site(self, tenant, username):
        user_group = config['userRole']['tenantUser']
        # create an entry in the user table
        self.__add_to_user_table__(tenant.tenant_id, tenant.user_pool_id, username)
        # add user to the correct group
        self.__add_user_to_group__(tenant.user_pool_id, username, user_group)
        # notify that a user was added
    
    def notify_new_user(self, user):
        response = sqs.send_message_batch(
            QueueUrl=queue_url,
            Entries=[
                {
                    'Id': user['user_id'],
                    'MessageBody': json.dumps(user, default=str),
                }
            ]
        )
        return response