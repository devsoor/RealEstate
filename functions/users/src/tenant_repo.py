from datetime import datetime
from user_object import UserObject
from dynamodb_repo import DynamoDbRepo
from user import User, Role
from user_repo import UserRepo
from tenant import s3bucket, Tenant, RegistrationStatus, ProfileStatus
from role_manager import RoleManager
from tenant_resources_stack import TenantStack
import os
import uuid
import boto3
import json
from config import config

editable_fields = ["site_name", "agent_name", "agent_title", "agent_email", "agent_phone", "office_name", "office_email",
    "office_address_street", "office_address_city", "office_address_state", "office_address_zip", "logo_caption" ]

class TenantRepo():
    table_name = "Tenants"
    dynamoDbRepo = None

    def __init__(self, aws_session):
        """Constructor"""
        self.dynamoDbRepo = DynamoDbRepo(aws_session)
        self.cognitoClient = aws_session.client('cognito-idp')
        self.identityClient = aws_session.client('cognito-identity')
        self.lambdaClient = aws_session.client('lambda')
        self.s3Client = aws_session.resource('s3')
        self.role_manager = RoleManager(aws_session)
        self.session = aws_session

    def get_tenant(self, tenant_id):
        tenant_dict = self.dynamoDbRepo.get_object(TenantRepo.table_name, tenant_id)
        tenant = Tenant(tenant_dict)
        return tenant

    def get_tenants(self, page_size, last_key):
        tenants = self.dynamoDbRepo.get_all_objects(TenantRepo.table_name, page_size, last_key)
        return tenants["Items"]

    def update(self, tenant):
        return self.__save__(tenant)

    def __save__(self, tenant):
        return self.dynamoDbRepo.save(TenantRepo.table_name, tenant)

    def register(self, tenant):
        tenant.set_status(RegistrationStatus.NEW)
        tenant.created_at = datetime.now().isoformat()
        payload = {
            'tenant_id': tenant.tenant_id
        }
        response = self.lambdaClient.invoke(
            FunctionName=f'users-{os.environ["stage"]}-createTenantResources',
            InvocationType='Event',
            Payload=json.dumps(payload)
        )
        print(response)
        return self.__save__(tenant)

    def create_tenant_resources(self, tenant_id):
        tenant_dict = self.dynamoDbRepo.get_object(TenantRepo.table_name, tenant_id)
        tenant = Tenant(tenant_dict)

        # save info to DynamoDb
        tenant.set_status(RegistrationStatus.CREATING_RESOURCES)
        self.__save__(tenant)

        stack = TenantStack(tenant, self.session, self.role_manager)
        outputs = stack.create_or_update_stack()
        if outputs:
            for output in outputs:
                key = output['OutputKey']
                val = output['OutputValue']
                if key == 'UserPoolId':
                    tenant.user_pool_id = val
                elif key == 'ClientId':
                    tenant.appclient_id = val 
                elif key == 'IdentityPoolId':
                    tenant.identity_pool_id = val
        if tenant.get_profile_status() == ProfileStatus.COMPLETE:
            tenant.set_status(RegistrationStatus.ACTIVE)
        else:
            tenant.set_status(RegistrationStatus.WAITING_FOR_PROFILE)

        self.__save__(tenant)
        return tenant

    def delete(self, tenant):
        """ 
            Delete Tenant and all associated resources 
            Delete images from S3 bucket
            Delete User pool
            Delete entry from Dynamo DB
        """
        stack = TenantStack(tenant, self.session, self.role_manager)
        stack.delete_stack()

        ### delete from S3 bucket:  Amazon S3realpeek-sites/public
        self.__delete_tenant_data__(tenant)
        
        ### delete from Tenants table
        return self.dynamoDbRepo.delete(TenantRepo.table_name, {"tenant_id": tenant.tenant_id})

    def get_users_for_tenant(self, tenant_id, page_size=60, last_key=None):
        tenant = self.get_tenant(tenant_id)
        request = {
            'UserPoolId': tenant.user_pool_id,
            'GroupName': config['userRole']['tenantUser'],
            'Limit': page_size
        }
        if last_key:
            request['NextToken'] = last_key
        response = self.cognitoClient.list_users_in_group(**request)
        for u in response["Users"]:
            for a in u["Attributes"]:
                u[a["Name"]] = a["Value"]
            del u["Attributes"]
            user_id = u["Username"]
            user_object = self.dynamoDbRepo.get_object_by_key(UserRepo.table_name, {"tenant_id": tenant_id, "user_id": user_id})
            if user_object:
                last_activity = user_object.get('last_activity_utc')
            u["LastActivity"] = last_activity

            
        return response


    def get_admins_for_tenant(self, tenant_id, page_size=60, last_key=None):
        tenant = self.get_tenant(tenant_id)
        request = {
            'UserPoolId': tenant.user_pool_id,
            'GroupName': config['userRole']['tenantAdmin'],
            'Limit': page_size
        }
        if last_key:
            request['NextToken'] = last_key
        response = self.cognitoClient.list_users_in_group(**request)
        for u in response["Users"]:
            for a in u["Attributes"]:
                u[a["Name"]] = a["Value"]
            del u["Attributes"]
            
        return response["Users"]

    def get_members_for_tenant(self, tenant_id, page_size=60, last_key=None):
        tenant = self.get_tenant(tenant_id)
        request = {
            'UserPoolId': tenant.user_pool_id,
            'GroupName': config['userRole']['tenantMember'],
            'Limit': page_size
        }
        if last_key:
            request['NextToken'] = last_key
        response = self.cognitoClient.list_users_in_group(**request)
        for u in response["Users"]:
            for a in u["Attributes"]:
                u[a["Name"]] = a["Value"]
            del u["Attributes"]
            
        return response

    def __delete_tenant_data__(self, tenant):
        """
        Delete Tenant data from s3 
        """
        if tenant.tenant_id:
            objects_to_delete = self.s3Client.meta.client.list_objects(Bucket=s3bucket, Prefix="public/" + tenant.tenant_id)
            delete_keys = {'Objects' : []}
            delete_keys['Objects'] = [{'Key' : k} for k in [obj['Key'] for obj in objects_to_delete.get('Contents', [])]]
            print(delete_keys)
            if delete_keys['Objects']:
                self.s3Client.meta.client.delete_objects(Bucket=s3bucket, Delete=delete_keys)