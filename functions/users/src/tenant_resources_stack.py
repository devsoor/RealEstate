from troposphere import Ref, Template, Output, GetAtt
from troposphere.cognito import (UserPool, AdminCreateUserConfig, InviteMessageTemplate, DeviceConfiguration, Policies, PasswordPolicy, SchemaAttribute,StringAttributeConstraints, UserPoolClient,
    IdentityPool, CognitoIdentityProvider, UserPoolGroup, IdentityPoolRoleAttachment)
from troposphere.iam import (PolicyType, Role)
from tenant import Tenant
from config import config

import datetime
import json
import boto3
import botocore

class TenantStack:
    def __init__(self, tenant, session, role_manager):
        self.tenant = tenant
        self.stack_name = 'tenant-stack-' + tenant.tenant_id
        self.cf = session.client('cloudformation')  # pylint: disable=C0103
        self.role_manager = role_manager

    def create_or_update_stack(self):
        cf = self.cf
        stack_name = self.stack_name
        template = self.__create_template__()
        params = {
            'StackName': stack_name,
            'TemplateBody': template.to_json(),
            'Capabilities': ['CAPABILITY_NAMED_IAM']
        }
        try:
            if self.__stack_exists__(stack_name):
                print('Updating {}'.format(stack_name))
                stack_result = cf.update_stack(**params)
                waiter = cf.get_waiter('stack_update_complete')
            else:
                print('Creating {}'.format(stack_name))
                stack_result = cf.create_stack(**params)
                waiter = cf.get_waiter('stack_create_complete')
            print("...waiting for stack to be ready...")
            waiter.wait(StackName=stack_name)
        except botocore.exceptions.ClientError as ex:
            error_message = ex.response['Error']['Message']
            if error_message == 'No updates are to be performed.':
                print("No changes")
            else:
                raise
        else:
            response = cf.describe_stacks(StackName=stack_result['StackId'])
            stack = response['Stacks'][0]
            return stack['Outputs']

    def delete_stack(self):
        cf = self.cf
        stack_name = self.stack_name
        print('Deleting {}'.format(stack_name))
        response = cf.delete_stack(
            StackName=stack_name
        )
        print(response)

    def __stack_exists__(self, stack_name):
        cf = self.cf
        stacks = cf.list_stacks()['StackSummaries']
        for stack in stacks:
            if stack['StackStatus'] == 'DELETE_COMPLETE':
                continue
            if stack_name == stack['StackName']:
                return True
        return False

    def __create_template__(self):
        tenant = self.tenant
        t = Template()
        t.add_description("AWS CloudFormation Template for a RealPeek Tenant")

        user_pool_name ='realpeek-up-'+tenant.tenant_id

        ########################
        # create user pool
        user_pool = t.add_resource(UserPool(
            'userPool',
            UserPoolName= user_pool_name,
            AdminCreateUserConfig=AdminCreateUserConfig(
                AllowAdminCreateUserOnly=False,
                InviteMessageTemplate=InviteMessageTemplate(
                    EmailMessage= 'Welcome to RealPeek Platform Beta!'+
                        f'<br /><br />Please login at https://{config["domainName"]}/{tenant.site_name} with the following username and temporary password.'+
                        '<br /><br /><b>Username:</b> {username}<br />'+
                        '<b>Temporary Password:</b>  {####}<br /><br />'+
                        'You will be prompted to change your password on first login.',
                    EmailSubject='Welcome to RealPeek'   
                )
            ),
            AutoVerifiedAttributes=['email'],
            UsernameAttributes=['email'],
            DeviceConfiguration=DeviceConfiguration(DeviceOnlyRememberedOnUserPrompt=True),
            Policies=Policies(
                PasswordPolicy=PasswordPolicy(
                    MinimumLength=8,
                    RequireUppercase=True,
                    RequireLowercase=True,
                    RequireNumbers=True,
                    RequireSymbols=True
                )
            ),
            Schema=[
                SchemaAttribute(
                    Name='tenantid',
                    AttributeDataType='String',
                    Mutable=True,
                    StringAttributeConstraints=StringAttributeConstraints(
                        MinLength='10',
                        MaxLength='32'
                    )
                )
            ]
        ))

        ########################
        # create user pool client
        user_pool_client = t.add_resource(UserPoolClient(
            "userPoolClient",
            ClientName=user_pool_name,
            UserPoolId=Ref(user_pool),
            ExplicitAuthFlows=['ADMIN_NO_SRP_AUTH', 'USER_PASSWORD_AUTH'],
            GenerateSecret=False,
        ))

        ########################
        # create identity pool
        identity_pool = t.add_resource(IdentityPool(
            "identityPool",
            IdentityPoolName='ip'+tenant.tenant_id,
            AllowUnauthenticatedIdentities=True,
            CognitoIdentityProviders=[
                CognitoIdentityProvider(
                    ClientId=Ref(user_pool_client),
                    ProviderName=GetAtt(user_pool, 'ProviderName'),
                    ServerSideTokenCheck=True
                )
            ]
        ))

        ########################
        # create roles
        policy_params = {
            'tenant_id': tenant.tenant_id,
            'account_id': config['account_id'],
            'region': config['aws_region'],
            'tenant_table_name': config['table']['tenant'],
            'user_table_name': config['table']['user'],
            'cma_table_name': config['table']['cma_criteria'],
            'assumptions_table_name': config['table']['assumptions'],
            'user_pool_id': GetAtt(user_pool, 'Arn')
        }
        trust_policy_template = self.role_manager.get_trust_policy(Ref(identity_pool))

        # create policies
        for i, user_role in enumerate(['tenantAdmin', 'tenantMember', 'tenantUser'], start=1):
            group_name = config['userRole'][user_role]
            policy_name = f'{tenant.tenant_id}-{group_name}Policy'
            policy_template = self.role_manager.get_policy_template(group_name, policy_params)

            role_name = tenant.tenant_id + '-' + group_name
            role = t.add_resource(Role(
                user_role+'role',
                AssumeRolePolicyDocument=trust_policy_template,
                RoleName=role_name
            ))

            policy = t.add_resource(PolicyType(
                user_role+'policy',
                PolicyName=policy_name,
                PolicyDocument=policy_template,
                Roles=[Ref(role)]
            ))
            group = t.add_resource(UserPoolGroup(
                user_role+'Group',
                GroupName=group_name,
                UserPoolId=Ref(user_pool),
                Description=group_name,
                RoleArn=GetAtt(role, 'Arn'),
                Precedence=i*10
            ))

        trust_role_name = tenant.tenant_id + '-trust'
        trust_role = t.add_resource(Role(
                'trustRole',
                AssumeRolePolicyDocument=trust_policy_template,
                RoleName=trust_role_name
            ))

        t.add_resource(IdentityPoolRoleAttachment(
            'identityPoolRoles',
            IdentityPoolId=Ref(identity_pool),
            Roles={
                'unauthenticated': 'arn:aws:iam::450322736372:role/Cognito_realpeek_ipUnauth_Role',
                'authenticated': GetAtt(trust_role, 'Arn')
            },
            # RoleMappings={
            #     provider: {
            #         'Type': 'Token',
            #         'AmbiguousRoleResolution': 'Deny'
            #     }
            # }
        ))


        t.add_output(Output(
            "UserPoolId",
            Value=Ref(user_pool),
            Description="User Pool Id of new user pool",
        ))

        t.add_output(Output(
            "ClientId",
            Value=Ref(user_pool_client),
            Description="UserPool Client Id"
        ))
        t.add_output(Output(
            "IdentityPoolId",
            Value=Ref(identity_pool),
            Description="Identity Pool Id of new identity pool",
        ))

        return t



