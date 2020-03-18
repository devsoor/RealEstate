from datetime import datetime
from user_object import UserObject
from dynamodb_repo import DynamoDbRepo
from user import User, Role
from tenant import s3bucket, Tenant
import uuid
import json
import boto3
from config import config

class RoleManager():
    def __init__(self, aws_session):
        """Constructor"""
        self.iam = aws_session.client('iam', api_version='2010-05-08')

    def create_policy(self, policy_params:dict):
        '''
        Create a policy using the provided configuration parameters.

        :param dict policy_params: The policy configuration
        :param dict: Results of the created policy
        '''
        policy_doc = json.dumps(policy_params['policyDocument'])

        params = {
            'PolicyName': policy_params['policyName'],
            'PolicyDocument': policy_doc,
            'Description': policy_params['policyName']
        }

        created_policy = self.iam.create_policy(**params)
        return created_policy['Policy']

    def delete_policy(self, policy_arn:str):
        '''
        Delete a policy using the provided configuration parameters.

        :param str policy_arn: The policy arn
        '''
        params = {
            'PolicyArn': policy_arn
        }
        response = self.iam.list_policy_versions(**params)
        versions = response['Versions']
        for version in versions:
            if not version['IsDefaultVersion']:
                self.iam.delete_policy_version(PolicyArn=policy_arn, VersionId=version['VersionId'])

        return self.iam.delete_policy(**params)

    def create_role(self, role_params:dict):
        '''
        Create a role from the supplied params.

        :param dict role_params: The role configuration
        :param dict: Results of the created role
        '''

        policy_doc = json.dumps(role_params['policyDocument'])
        params = {
            'AssumeRolePolicyDocument': policy_doc,
            'RoleName': role_params['roleName']
        }

        created_role = self.iam.create_role(**params)
        return created_role['Role']

    def delete_role(self, role_name:str):
        '''
        Delete a role from the supplied params.

        :param str role_name: The role name
        '''
        params = {
            'RoleName': role_name
        }

        return self.iam.delete_role(**params)

    def add_policy_to_role(self, policy_role_params):
        '''
        Add a created policy to a role
        :param dict policy_role_params: The policy and role to be configured
        :returns: The results of the policy assignment to the role
        '''
        params = {
            'PolicyArn': policy_role_params['PolicyArn'],
            'RoleName': policy_role_params['RoleName']
        }

        self.iam.attach_role_policy(**params)
        return

    def detach_role_policy(self, policy_arn, role_name):
        '''
        Detach a role policy using the provided configuration parameters
        :param str policy_arn:  The policy arn
        :param str role_name:  The role name
        '''
        params = {
            'PolicyArn': policy_arn,
            'RoleName': role_name
        }

        return self.iam.detach_role_policy(**params)

    def get_trust_policy(self, trust_policy:str):
        '''
        Get the trust policy template populated with the supplied trust policy.
        :param str trust_policy: The policy to use for this template
        :returns The populated template
        '''
        trust_policy_template = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{config['account_id']}:root"
                },
                "Action": "sts:AssumeRole"
                # "Condition": {
                #     "StringEquals": {
                #         "cognito-identity.amazonaws.com:aud": trustPolicy
                #     },
                #     "ForAnyValue:StringLike": {
                #         "cognito-identity.amazonaws.com:amr": "authenticated"
                #     }
                # }
            }]
        }
        return trust_policy_template

    def get_policy_template(self, policy_type:str, policy_config:str):
        '''
        Generate a policy based on the specified type and configuration.

        :param str policy_type: The type of policy to be created (system admin, system user, tenant admin, tenant user)
        :param str policy_config: The parameters used to populate the template
        :returns str: The populated template
        '''
        policy_template = {}

        # create the ARN prefixes for policies
        arn_prefix = f"arn:aws:dynamodb:{policy_config['region']}:{policy_config['account_id']}:table/"
        database_arn_prefix = f"arn:aws:dynamodb:{policy_config['region']}:{policy_config['account_id']}:table/"
        # cognito_arn = f"arn:aws:cognito-idp:{policy_config['region']}:{policy_config['account_id']}:userpool/{policy_config['user_pool_id']}"
        cognito_arn = policy_config['user_pool_id']
        roles_arn = f"arn:aws:iam::{policy_config['account_id']}:role/*"
        # populate database params
        # setup params for templates
        policy_params = {
            'tenant_id': policy_config['tenant_id'],
            'arn_prefix': arn_prefix,
            'cognito_arn': cognito_arn,
            'roles_arn': roles_arn,
            'tenant_table_arn': database_arn_prefix + policy_config['tenant_table_name'],
            'user_table_arn': database_arn_prefix + policy_config['user_table_name'],
            'cma_table_arn': database_arn_prefix + policy_config['cma_table_name'],
            'assumptions_table_arn': database_arn_prefix + policy_config['assumptions_table_name'],
        }

        if (policy_type == config['userRole']['systemAdmin']):
            policy_template = {}
           #  policy_template = getSystemAdminPolicy(policy_params)
        elif (policy_type == config['userRole']['systemUser']):
            policy_template = {}
            # policy_template = getSystemUserPolicy(policy_params)
        elif (policy_type == config['userRole']['tenantAdmin']):
            policy_template = self.__get_tenant_admin_policy__(policy_params)
        elif (policy_type == config['userRole']['tenantMember']):
            policy_template = self.__get_tenant_member_policy__(policy_params)
        elif (policy_type == config['userRole']['tenantUser']):
            policy_template = self.__get_tenant_user_policy__(policy_params)

        return policy_template

    def __get_tenant_admin_policy__(self, policy_params:str):
        '''
        Get the IAM policies for a Tenant Admin user.
        :param str policyParams: Dictionary with configuration parameters
        :returns str: The populated system admin policy template
        '''

        tenant_condition = {
            "ForAllValues:StringEquals": {
                "dynamodb:LeadingKeys": [policy_params['tenant_id']]
            }
        }
        template = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PassRole",
                    "Effect": "Allow",
                    "Action": [
                        "iam:PassRole"
                    ],
                    "Resource": [
                        policy_params['roles_arn']
                    ]
                },
                 {
                    "Sid": "TenantTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:PutItem"
                    ],
                    "Resource": [
                        policy_params['tenant_table_arn'], 
                        policy_params['tenant_table_arn'] + '/*'],
                    "Condition": tenant_condition
                },
                {
                    "Sid": "TenantAdminUserTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:BatchGetItem",
                        "dynamodb:Query",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:BatchWriteItem",
                        "dynamodb:DescribeTable",
                        "dynamodb:CreateTable"
                    ],
                    "Resource": [
                        policy_params['user_table_arn'], 
                        policy_params['user_table_arn'] + '/*'],
                    "Condition": tenant_condition
                },
                {
                    "Sid": "TenantReadAssumptionsTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem"
                    ],
                    "Resource": [
                        policy_params['assumptions_table_arn'],
                        policy_params['cma_table_arn']
                    ],
                    "Condition": {
                        "ForAllValues:StringEquals": {
                            "dynamodb:LeadingKeys": ['__DEFAULT__']
                        }
                    }
                },
                {
                    "Sid": "TenantReadWriteAssumptionsTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem"
                    ],
                    "Resource": [policy_params['assumptions_table_arn']],
                    # "Condition": {
                    #     "ForAllValues:StringEquals": {
                    #         "dynamodb:LeadingKeys": [policy_params['tenant_id'], '${cognito-identity.amazonaws.com:sub}']
                    #     }
                    # }
                },
                {
                    "Sid": "TenantAdminCmaCriteriaTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem"
                    ],
                    "Resource": [policy_params['cma_table_arn']],
                    "Condition": tenant_condition
                },
                {
                    "Sid": "TenantCognitoAccess",
                    "Effect": "Allow",
                    "Action": [
                        "cognito-idp:AdminCreateUser",
                        "cognito-idp:AdminDeleteUser",
                        "cognito-idp:AdminDisableUser",
                        "cognito-idp:AdminEnableUser",
                        "cognito-idp:AdminGetUser",
                        "cognito-idp:AdminAddUserToGroup",
                        "cognito-idp:ListUsers",
                        "cognito-idp:ListUsersInGroup",
                        "cognito-idp:AdminUpdateUserAttributes"
                    ],
                    "Resource": [policy_params['cognito_arn']]
                }
            ]
        }
        return template

    def __get_tenant_member_policy__(self, policy_params:str):
        '''
        Get the IAM policies for a Tenant Admin user.
        :param str policyParams: Dictionary with configuration parameters
        :returns str: The populated system admin policy template
        '''

        tenant_condition = {
            "ForAllValues:StringEquals": {
                "dynamodb:LeadingKeys": [policy_params['tenant_id']]
            }
        }
        template = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PassRole",
                    "Effect": "Allow",
                    "Action": [
                        "iam:PassRole"
                    ],
                    "Resource": [
                        policy_params['roles_arn']
                    ]
                },
                 {
                    "Sid": "TenantTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:PutItem"
                    ],
                    "Resource": [
                        policy_params['tenant_table_arn'], 
                        policy_params['tenant_table_arn'] + '/*'],
                    "Condition": tenant_condition
                },
                {
                    "Sid": "TenantAdminUserTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:BatchGetItem",
                        "dynamodb:Query"
                    ],
                    "Resource": [
                        policy_params['user_table_arn'], 
                        policy_params['user_table_arn'] + '/*'],
                    "Condition": tenant_condition
                },
                {
                    "Sid": "TenantReadAssumptionsTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem"
                    ],
                    "Resource": [
                        policy_params['assumptions_table_arn'],
                        policy_params['cma_table_arn']
                    ],
                    "Condition": {
                        "ForAllValues:StringEquals": {
                            "dynamodb:LeadingKeys": ['__DEFAULT__']
                        }
                    }
                },
                {
                    "Sid": "TenantReadWriteAssumptionsTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem"
                    ],
                    "Resource": [policy_params['assumptions_table_arn']],
                    # "Condition": {
                    #     "ForAllValues:StringEquals": {
                    #         "dynamodb:LeadingKeys": [policy_params['tenant_id'], '${cognito-identity.amazonaws.com:sub}']
                    #     }
                    # }
                },
                {
                    "Sid": "TenantAdminCmaCriteriaTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem"
                    ],
                    "Resource": [policy_params['cma_table_arn']],
                    "Condition": tenant_condition
                },
                {
                    "Sid": "TenantCognitoAccess",
                    "Effect": "Allow",
                    "Action": [
                        "cognito-idp:AdminCreateUser",
                        "cognito-idp:AdminDeleteUser",
                        "cognito-idp:AdminDisableUser",
                        "cognito-idp:AdminEnableUser",
                        "cognito-idp:AdminGetUser",
                        "cognito-idp:AdminAddUserToGroup",
                        "cognito-idp:ListUsers",
                        "cognito-idp:ListUsersInGroup",
                        "cognito-idp:AdminUpdateUserAttributes"
                    ],
                    "Resource": [policy_params['cognito_arn']]
                }
            ]
        }
        return template

    def __get_tenant_user_policy__(self, policy_params:str):
        '''
        Get the IAM policies for a Tenant Admin user.
        :param str policyParams: Dictionary with configuration parameters
        :returns str: The populated system admin policy template
        '''

        tenant_condition = {
            "ForAllValues:StringEquals": {
                "dynamodb:LeadingKeys": [policy_params['tenant_id']]
            }
        }
        template = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PassRole",
                    "Effect": "Allow",
                    "Action": [
                        "iam:PassRole"
                    ],
                    "Resource": [
                        policy_params['roles_arn']
                    ]
                },
                {
                    "Sid": "TenantReadOnlyUserTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:BatchGetItem",
                        "dynamodb:Query"
                    ],
                    "Resource": [
                        policy_params['user_table_arn'], 
                        policy_params['user_table_arn'] + '/*'],
                    "Condition": tenant_condition
                },
                {
                    "Sid": "TenantReadWritePersonalAssumptionsTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem"
                    ],
                    "Resource": [policy_params['assumptions_table_arn']],
                    # "Condition": {
                    #     "ForAllValues:StringEquals": {
                    #         "dynamodb:LeadingKeys": ['${cognito-identity.amazonaws.com:sub}']
                    #     }
                    # }
                },
                {
                    "Sid": "TenantReadAssumptionsTable",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem"
                    ],
                    "Resource": [
                        policy_params['assumptions_table_arn'],
                        policy_params['cma_table_arn']
                    ],
                    "Condition": {
                        "ForAllValues:StringEquals": {
                            "dynamodb:LeadingKeys": ['__DEFAULT__', policy_params['tenant_id']]
                        }
                    }
                },
                {
                    "Sid": "TenantCognitoAccess",
                    "Effect": "Allow",
                    "Action": [
                        "cognito-idp:AdminGetUser",
                        "cognito-idp:ListUsers",
                    ],
                    "Resource": [policy_params['cognito_arn']]
                }
            ]
        }
        return template