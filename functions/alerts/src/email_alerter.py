import boto3
import logging
import datetime
import os
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

from rule_config import RuleConfig
from utils import get_user_attribute

CHARSET = "UTF-8"
AWS_REGION = "us-west-2"
SENDER = "info@realpeek.com"
BASE_URL = os.environ['base_url']

ses_client = boto3.client('ses',region_name=AWS_REGION)
cognito = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
users = dynamodb.Table("Users")
tenants = dynamodb.Table("Tenants")

class Recipient():
    email = None
    firstname = None
    lastname = None
    def __init__(self, email, firstname, lastname):
        self.email = email
        self.firstname = firstname
        self.lastname = lastname


class EmailAlerter():
    """ Sends an email alert """
    required_options = frozenset(['email'])

    recipient:Recipient = None

    def __init__(self, rule:RuleConfig):
        self.rule = rule
        self.recipient = self.__get_user_info__(rule.recipient_ids[0])
    

    def __get_user_info__(self, user_id):
        try:
            print('getting user info for ' + user_id)
            response = users.query(
                IndexName='user_id-index',
                KeyConditionExpression=Key('user_id').eq(user_id)
            )
            items = response['Items']
            if not items:
                logging.info('user not found ' + user_id)
                return None
            user = items[0]
            response = cognito.admin_get_user(
                UserPoolId=user['user_pool_id'],
                Username=user['user_id']
            )
            print(response)
            if response['Enabled']:
                attributes = response['UserAttributes']
                email = get_user_attribute(attributes, 'email')
                firstname = get_user_attribute(attributes, 'given_name')
                lastname =  get_user_attribute(attributes, 'family_name')
                tenant_id = get_user_attribute(attributes, 'custom:tenantid')

                response = tenants.get_item(Key={'tenant_id': tenant_id})
                self.site_settings = response['Item']
                return Recipient(email, firstname, lastname)
            else:
                logging.info('user disabled; not sending email')
                return None
        except:
            logging.error('error getting user ' + user_id)
            raise


    def alert(self, matches):
        if not self.recipient:
            logging.error('No recipient configured')
            return
            
        subject = self.create_subject(matches)
        sender = SENDER

        body_text = self.create_alert_body(matches, False)
        body_html = self.create_alert_body(matches, True)
        # Try to send the email.
        try:
            response = ses_client.send_email(
                Destination={
                    'ToAddresses': [self.recipient.email]
                },
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
                Source=sender,
                #ConfigurationSetName=CONFIGURATION_SET,
            )
        # Display an error if something goes wrong.	
        except ClientError as e:
            print(e.response['Error']['Message'])
            raise
        except e:
            logging.error(f"Error sending email to {self.recipient.email}")
            raise
        else:
            print(f"Email sent! Message ID: {response['MessageId']}")
            logging.info(f"Sent email alert to {self.recipient.email}")

    def create_subject(self, matches):
        today_str = datetime.datetime.today().strftime('%m/%d/%Y')
        frequency = self.rule.frequency
        if self.rule.frequency.lower() == 'instantly':
            frequency = 'Instant'

        subject = f'{frequency} Investment Property Report as of {today_str}'

        return subject

    def create_signature(self, is_html):
        line_separator = '<br>' if is_html else '\r\n'

        email = self.site_settings['agent_email']
        agent_name = self.site_settings['agent_name']        
        agent_title = self.site_settings['agent_title']
        office_name = self.site_settings['office_name']
        agent_phone = self.site_settings['agent_phone']
        logo_url = self.site_settings['logo_url']

        s = f"""
        Regards,{line_separator}
            {agent_name}{line_separator}
            {agent_title}{line_separator}
            {office_name}{line_separator}
            {agent_phone}{line_separator}
            {email}{line_separator}
        """
        if is_html:
            s += '<img src="{logo_url}" height="70px" />'
        return s
    
    def create_unsubscribe_footer(self, is_html):
        site_url = BASE_URL + self.site_settings['site_name']
        unsubscribe_url = f"{site_url}/user/saved-searches/{self.rule.id}/edit"

        s = f"""
        <p>
        <small>If you would like to stop receiving email alerts, {create_link('click here', unsubscribe_url)} to update your email preferences.
        </small>
        </p>
        """
        return s


    def create_alert_body(self, matches, is_html):
        line_separator = '<br>' if is_html else '\r\n'

        site_url = BASE_URL + self.site_settings['site_name']
        if is_html:
            search_criteria = create_link(self.rule.name, f"{site_url}/search/{self.rule.id}")
        else: 
            search_criteria = self.rule.name
        body = f"""
            Hi {self.recipient.firstname} {self.recipient.lastname},
            {line_separator}
            Here are the properties that are now available based on your search criteria ({search_criteria}).
            {line_separator}
            {line_separator}
        """
        body += "<table cellspacing='0' cellpadding='10' width='100%' border='0'>"
        body += """<tr>
            <th>Address</th>
            <th>MLS ID</th>
            <th>Price</th>
            <th>Monthly Cashflow</th>
            <th>Cap Rate</th>
            <th>Rent2Value</th>
            <th>CoC Return</th>
            </tr>"""
        for match in matches:
            info = match['_source']
            subject_property = match['cma']['cma']['subject_property']
            cma = match['cma']['cma']['cma_results']

            property_url = f"{site_url}/property/{info['unique_id']}"
            row = f"""<tr>
                <td>{create_link(info['address'], property_url)}</td>
                <td>{create_link(info['listing_id'], property_url)}</td>
                <td>{subject_property['purchase_price']}</td>
                <td>{cma['Result_CashFlow_Monthly']}</td>
                <td>{cma['Result_CapRate']}</td>
                <td>{cma['Result_RentValueRatio']}</td>
                <td>{cma['Result_CashOnCashReturn']}</td>
                </tr>"""
            body += row

        body += "</table>"
        body += "<br>" + self.create_signature(is_html)
        body += "<br>" + self.create_unsubscribe_footer(is_html)
        return body

def create_link(text, location):
    return f'<a href="{location}">{text}</a>'
