import json
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime
import uuid

class DynamoDbRepo:
    
    db_tables = {}
    def __init__(self, aws_session):
        self.dynamodb = aws_session.resource('dynamodb', region_name='us-west-2')

    def get_table(self, tablename):
        return DynamoDbRepo.db_tables.get(tablename, self.dynamodb.Table(tablename))

    def get_object_by_key(self, tablename, key):
        try:
            response = self.get_table(tablename).get_item(Key=key)
        except ClientError as e:
            print(e.response['Error']['Message'])
            user_object = None
        else:
            user_object = response['Item']
        
        return user_object

    def get_object(self, tablename, object_id):
        try:
            response = self.get_table(tablename).get_item(Key={'tenant_id': object_id})
        except ClientError as e:
            print(e.response['Error']['Message'])
        else:
            user_object = response['Item']
        
        return user_object

    def get_user_object(self, tablename, owner, user_object_id):
        try:
            response = self.get_table(tablename).get_item(
                Key={
                    'owner': owner,
                    'id': user_object_id
                }
            )

        except ClientError as e:
            print(e.response['Error']['Message'])
        else:
            user_object = response['Item']
        
        return user_object

    def get_all_objects(self, tablename, page_size, last_key):
        table = self.get_table(tablename)

        # query for first page
        query = {
            'Limit': page_size or 20
        }
        if last_key:
            query['ExclusiveStartKey'] = last_key

        response = table.scan(**query)

        return response

    def get_user_objects_for_user(self, tablename, user):
        #For now, the only user objects accessible to a particular user are those for which it is the owner
        table = self.get_table(tablename)
        user_objects = []

        # query for first page
        response = table.query(KeyConditionExpression=Key('owner').eq(user))
        items = response.pop("Items")
        user_objects.extend(items)

        # check to see if there are additional pages to get
        while 'LastEvaluatedKey' in response:
            response = table.query(KeyConditionExpression=Key('owner').eq(user),
                ExclusiveStartKey=response['LastEvaluatedKey'])
            items = response.pop("Items")
            user_objects.extend(items)

        return user_objects

    def update_user_object(self, tablename, owner, user_object_id, updates):
        try:
            update_expressions = []
            update_values = {}
            update_names = {}
            for key, value in updates.items():
                update_expressions.append("#{key} = :{key}".format(key=key))
                update_values[":{key}".format(key=key)] = value
                update_names["#{key}".format(key=key)] = key
            
            update_expression = "set " + ",".join(update_expressions)
            response = self.get_table(tablename).update_item(
                Key={
                    'owner': owner,
                    'id': user_object_id
                },
                UpdateExpression=update_expression,
                ExpressionAttributeValues=update_values,
                ExpressionAttributeNames=update_names
            )

        except ClientError as e:
            print(e.response['Error']['Message'])
        else:
            print(response)

        return {}
        
    def delete(self, tablename, key):
        try:
            self.get_table(tablename).delete_item(
                Key=key
            )

        except ClientError as e:
            print(e.response['Error']['Message'])
            raise
        else:
            print("DeleteItem succeeded")

    def save(self,tablename,item):
        if not isinstance(item, dict):
            escaped_item = item.__dict__
        else:
            escaped_item = item
        # remove None values since dynamoDB can't handle them
        escaped_item = {k: v for k, v in escaped_item.items() if v is not None and v is not ''}

        return self.get_table(tablename).put_item(Item=escaped_item)

    @staticmethod
    def json_escape(source_json):
        if (not source_json):
            return source_json
        return json.dumps(source_json) \
            .replace('"', '\\"').replace('\n', '\\n')
    @staticmethod
    def json_unescape(source_string):
        if (not source_string):
            return source_string
        return json.loads( \
            source_string.replace('\\"','"').replace('\\n', '\n'))        
