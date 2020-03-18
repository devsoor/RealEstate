import json
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime

dictfilt = lambda x, y: dict([ (i,x[i]) for i in x if i in set(y) ])
notdictfilt = lambda x, y: dict([ (i,x[i]) for i in x if i not in set(y) ])
class AssumptionsRepo:
    def __init__(self, aws_session):
        dynamodb = aws_session.resource('dynamodb', region_name='us-west-2')
        self.assumptions_table = dynamodb.Table('Assumptions')
        self.criteria_table = dynamodb.Table('CmaCriteria')

    def save(self, a):
        assumptions_table = self.assumptions_table
        criteria_table = self.criteria_table
        print('updating assumptions for ' + a.user_id)
        if (a.site_id == "__DEFAULT__"):
            global_criteria = a.global_criteria
            global_criteria["siteId"] = "__DEFAULT__"
            print('updating global criteria')
            print(global_criteria)
            criteria_table.put_item(Item=global_criteria)
        else:
            site_assumptions = a.site_assumptions
            site_assumptions["siteId"] = a.site_id
            site_assumptions["updatedBy"] = a.user_id
            site_assumptions["lastUpdateDate"] = a.date 
            print('updating site criteria for ' + a.site_id)
            criteria_table.put_item(Item=site_assumptions)

        return assumptions_table.put_item(Item=a.user_assumptions)

    def save_platform_assumptions(self, a):
        criteria_table = self.criteria_table
        print('updating platform assumptions')
        
        global_criteria = a.global_criteria
        global_criteria["siteId"] = "__DEFAULT__"
        print(global_criteria)
        return criteria_table.put_item(Item=global_criteria)

    def save_user_assumptions(self, a):
        assumptions_table = self.assumptions_table
        print('updating assumptions for ' + a.user_id)
        return assumptions_table.put_item(Item=a.user_assumptions)
    
    def save_site_assumptions(self, a):
        criteria_table = self.criteria_table
        site_assumptions = a.site_assumptions
        site_assumptions["siteId"] = a.site_id
        site_assumptions["updatedBy"] = a.user_id
        site_assumptions["lastUpdateDate"] = a.date 
        print('updating site criteria for ' + a.site_id)
        return criteria_table.put_item(Item=site_assumptions)

    def delete(self, user):
        # don't delete the default values
        if (user != "__DEFAULT__"):
            self.criteria_table.delete_item(Key={'userId': user }) 

    @classmethod
    def get_options(self, isAdmin):
        return {
            "cma_pretty": False,
            "pretty_money": False,
            "cma_properties": isAdmin,
            "area_properties": isAdmin,
            "market_value": isAdmin,
            "aggregate_results": isAdmin
        }

    def get_assumptions(self, user, site_id, isAdmin):
        assumptions_table = self.assumptions_table
        criteria_table = self.criteria_table
        try:
            print('getting user assumptions for ' + user)
            response = assumptions_table.get_item(Key={'userId': user })

            if (not response.get("Item")):
                print('assumptions for user ' + user + ' not found.  getting default assumptions.')
                # if the user doesn't have assumptions, just use the default assumptions
                response = assumptions_table.get_item(Key={'userId': '__DEFAULT__' })

            user_assumptions = response['Item']
            # if (user == "__DEFAULT__" and isAdmin):
            #     criteria_response = criteria_table.get_item(Key={'siteId': '__DEFAULT__' })
            #     criteria = criteria_response['Item']
            #     user_assumptions = {**criteria, **user_assumptions}
            if site_id:
                response = criteria_table.get_item(Key={'siteId': '__DEFAULT__' })
                platform_assumptions = response.get('Item', {})
                print('platform assumptions')
                print(platform_assumptions)
                response = criteria_table.get_item(Key={'siteId': site_id })
                site_assumptions = response.get('Item', {})
                print('site assumptions for ' + site_id)
                print(site_assumptions)
                user_assumptions = {**platform_assumptions, **site_assumptions, **user_assumptions}
                print('merged assumptions')
                print(user_assumptions)

            result = {
                "options": AssumptionsRepo.get_options(isAdmin),
                "parameters": user_assumptions
            }

            return result
        except ClientError as e:
            print(e.response['Error']['Message'])
            return None