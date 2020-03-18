import boto3
import logging
import traceback
from tenant_repo import TenantRepo

ses_client = boto3.client('ses')
CHARSET = "UTF-8"
AWS_REGION = "us-west-2"
SENDER = "info@realpeek.com"

class Notifications():
    def __init__(self, aws_session):
        self.cognitoClient = aws_session.client('cognito-idp')
        self.tenantRepo = TenantRepo(aws_session)

    def __get_user_details__(self, user):
        user_pool_id = user['user_pool_id']
        username = user['user_id']
        response = self.cognitoClient.admin_get_user(
            UserPoolId=user_pool_id,
            Username=username
        )
        user_attributes = {
            'username': response['Username']
        }
        for a in response['UserAttributes']:
            attr_name = a['Name']
            attr_value = a['Value']
            user_attributes[attr_name] = attr_value

        return user_attributes

    def __get_recipients__(self, user_info):
        tenant_id = user_info['custom:tenantid']
        tenant = self.tenantRepo.get_tenant(tenant_id)
        agent_email = tenant.agent_email
        site_admins = self.tenantRepo.get_admins_for_tenant(tenant_id)
        recipients = [agent_email]
        for a in site_admins:
            recipients.append(a['email'])
        return recipients

    def __create_body_text__(self, user_info, is_html):
        first_name = user_info.get('given_name')
        last_name = user_info.get('family_name')
        user_email =user_info.get('email')

        line_break = '<br>' if is_html else '\r\n'
        text = f"""A new user signed up on your site{line_break}
            {line_break}
            Name: {first_name} {last_name}{line_break}
            Email: {user_email}{line_break}"""
        return text

    def on_user_signup(self, user):
        user_info = self.__get_user_details__(user)
        recipients = self.__get_recipients__(user_info)
        subject = 'RealPeek: New User Signup'
        body_text = self.__create_body_text__(user_info, False)
        body_html = self.__create_body_text__(user_info, True)

        try:
            response = ses_client.send_email(
                Destination={
                    'ToAddresses': recipients
                },
                Source=SENDER,
                Message={
                    'Body': {
                        'Html': {
                            'Charset': CHARSET,
                            'Data': body_html,
                        },
                        'Text': {
                            'Charset': CHARSET,
                            'Data': body_text,
                        },
                    },
                    'Subject': {
                        'Charset': CHARSET,
                        'Data': subject,
                    },
                },
            )
        # Display an error if something goes wrong.	
        except:
            traceback.print_exc()
            logging.error(f"Error sending email to {recipients}")
            raise
        else:
            print(f"Email sent! Message ID: {response['MessageId']}")
            logging.info(f"Sent email alert to {recipients}")