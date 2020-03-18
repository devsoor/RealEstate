import json
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer
import uuid
import decimal

dynamodb = boto3.resource('dynamodb', region_name='us-west-2')

class UserObject:
    #def __init__(self):
        #use from_dict
    
    @classmethod
    def from_dict(cls, adict):
        user_object = cls()
        user_object.set_attributes_from_dict(adict)
        return user_object

    def set_attributes_from_dict(self, *adict, **kwargs):
        #Populates attributes of self with all values from dictionaries and keywords
        # Example usage options:
        #   set_attributes_from_dict({"name": "abc"})
        #
        #   set_attributes_from_dict(name="abc")
        #
        #   userobject_template = {"role": "agent"}
        #   set_attributes_from_dict(userobject_template, name="abc")

        for dictionary in adict:
            for key in dictionary:
                setattr(self, key, dictionary[key])  #eg self.owner = adict["owner"]
        
        for key in kwargs:
            setattr(self, key, kwargs[key])


    db_tables = {}

    @classmethod
    def get_table(cls, tablename):
        return UserObject.db_tables.get(tablename, dynamodb.Table(tablename))

    @classmethod
    def get_user_objects_for_user(cls, tablename, user, attributesToGet=None):
        #For now, the only user objects accessible to a particular user are those for which it is the owner
        table = UserObject.get_table(tablename)
        user_objects = []

        # query for first page
        query = {
            'KeyConditionExpression': Key('owner').eq(user)
        }
        if (attributesToGet):
            projectionExpressionList = ['#' + item for item in attributesToGet]
            projectionExpression = ','.join(projectionExpressionList)
            attributeNames = {'#'+x:x for x in attributesToGet}
            query['ProjectionExpression'] = projectionExpression
            query['ExpressionAttributeNames'] = attributeNames

        response = table.query(**query)
        items = response.pop("Items")
        user_objects.extend(items)

        # check to see if there are additional pages to get
        while 'LastEvaluatedKey' in response:
            print('getting additional page')
            query['ExclusiveStartKey'] = response['LastEvaluatedKey']
            response = table.query(**query)
            items = response.pop("Items")
            user_objects.extend(items)

        return user_objects

    @classmethod
    def get_user_object(cls, tablename, owner, user_object_id):
        try:
            response = UserObject.get_table(tablename).get_item(
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

    @classmethod
    def update_user_object(cls, tablename, owner, user_object_id, updates):
        try:
            update_expressions = []
            update_values = {}
            update_names = {}
            for key, value in updates.items():
                print("DSDSDS<><><> update_user_object: key value = ", key, value)
                for k, v in value.items():
                    print("DSDSDS<><><> update_user_object: k v = ", k, v)
                    update_expressions.append("#{}.{} = :{}".format(key,k,k))
                    if isinstance(v, float):
                        v = decimal.Decimal(v)
                    update_values[":{}".format(k)] = v
                    update_names["#{}.{}".format(k)] = k
            
            update_expression = "set " + ",".join(update_expressions)
            print("DSDSDS<><><> update_user_object: update_expression = ", update_expression)
            print("DSDSDS<><><> update_user_object: update_values = ", update_values)
            print("DSDSDS<><><> update_user_object: update_names = ", update_names)
            response = UserObject.get_table(tablename).update_item(
                Key={
                    'owner': owner,
                    'id': user_object_id
                },
                UpdateExpression=update_expression,
                ExpressionAttributeValues=update_values
                # ExpressionAttributeNames=update_names
            )
            print("DSDSDS<><><> update_user_object: response = ", response) 
        except ClientError as e:
            print(e.response['Error']['Message'])
        else:
            print(response)

        return {}
        
    @classmethod
    def delete(cls, tablename, owner, user_object_id):
        try:
            response = UserObject.get_table(tablename).delete_item(
                Key={
                    'owner': owner,
                    'id': user_object_id
                }
            )

        except ClientError as e:
            print(e.response['Error']['Message'])
            raise
        else:
            print("DeleteItem succeeded " + user_object_id)

    def save(self,tablename,user_object:dict):
        item = decode_object(user_object)
        print(item)
        return UserObject.get_table(tablename).put_item(Item=item)

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


def decode_object(dct):
    # remove None values since dynamoDB can't handle them
    escaped_dct = {k: v for k, v in dct.items() if v is not None and v is not ''}

    for key, val in escaped_dct.items():
        if isinstance(val, float):
            escaped_dct[key] = Decimal(str(val))
        if isinstance(val, dict):
            escaped_dct[key] = decode_object(val)
        if isinstance(val, list):
            escaped_dct[key] = [x for x in val if x]

    return escaped_dct


# def json_serial(val):
#     # if isinstance(val, datetime):
#     #     serial = val.strftime('%Y-%m-%dT%H:%M:%S.%f')
#     #     return serial
#     if isinstance(val, set):
#         serial = list(val)
#         return serial
#     elif isinstance(val, uuid.UUID):
#         serial = str(val.hex)
#         return serial


# def dumps(dct, *args, **kwargs):
#     kwargs['object_hook'] = decode_object
#     return json.loads(json.dumps(dct, default=str), *args, **kwargs)