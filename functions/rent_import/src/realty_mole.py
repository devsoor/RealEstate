import sys
import logging
import boto3
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
import traceback
import json 
import traceback
from datetime import datetime, timedelta

import requests
import re

# Update this section with your own data
region_name='us-west-2'
table_name='Listings'
lambdaClient = boto3.client('lambda')
sqs = boto3.client('sqs')
queue_url = os.environ['updateRentQueue']

rapid_api_key='5ngG1c80kQmsh2eZIl27nqDrrZ8Ep1NZx6BjsnEgy0up1K08wO'

url='https://realtymole-rental-estimate-v1.p.rapidapi.com/rentalPrice'

dynamodb = boto3.resource('dynamodb', region_name=region_name)
listings_table = dynamodb.Table(table_name)

expiration_in_days = 28

mpStyleNameDir = {
    0:'None',
    1:'Single Family Residence',
    2:'Town House',
    3:'Condo',
    4:'Manufactured Home',
    5:'Mobile Home Park',
    6:'Farm & Ranch',
    7:'Multi-Family',
    8:'Apartments',
    9:'Floating Home',
    10:'Co-Op',
    11:'Commercial',
    12:'Recreational',
    13:'Land'
}

'Apartment, Single Family, Townhouse, Condo, Duplex-Triplex'
realtyMoleStyleDir = {
    0:'',
    1:'Single Family',
    2:'Townhouse',
    3:'Condo',
    4:'',
    5:'',
    6:'',
    7:'Duplex-Triplex',
    8:'Apartment',
    9:'',
    10:'',
    11:'',
    12:'',
    13:''
}

def normalize_address(address):
    address = address.strip()   # remove leading and trailing whitespace
    address = address.replace(",", "")  # remove commas
    address = re.sub(' +', ' ',address) # remove duplicate spaces
    return address


class RealtyMole():
# var rp = require('request-promise');
# var RateLimiter = require('limiter').RateLimiter;
# var rentEstimateLimiter = new RateLimiter(1, 200); // 1 request every .2 seconds
    def get_params(self, address, bedrooms, bathrooms, square_footage, mp_style, days_old, comp_count):
        params = {
            'compCount': 5
        }
        if comp_count:
            params['compCount'] = comp_count
        if days_old:
            params['daysOld'] = days_old
            
        if bedrooms:
            params['bedrooms'] = bedrooms
        if bathrooms:
            params['bathrooms'] = bathrooms
        if square_footage:
            params['squareFootage'] = square_footage
        if mp_style: 
            mp_style = int(mp_style)
            if realtyMoleStyleDir.get(mp_style):
                params['propertyType'] = realtyMoleStyleDir.get(mp_style)

        params['address'] = address
        print(f'request params:')
        print(params)
        return params

    def get_rent_estimate(self, address, bedrooms, bathrooms, square_footage, mp_style, days_old, comp_count, force_update=False):
        address = normalize_address(address)
        params = self.get_params(address, bedrooms, bathrooms, square_footage, mp_style, days_old, comp_count)
        try:
            rent_data = None
            response = listings_table.get_item(
                Key={
                    'address': address,
                    'params': json.dumps(params)
                }
            )
        except ClientError as e:
            logging.error(e.response['Error']['Message'])
        else:
            if 'Item' in response:
                item = response['Item']
                rent_data = item['RentData']
                last_updated = datetime.fromisoformat(item['RentLastUpdatedDate'])
                time_since_update = datetime.utcnow() - last_updated
                print(f'cached value: {item}')
                print(f'time since update: {time_since_update.days} days' )
                
            
            shouldUpdate = ('Item' not in response) or ('RentData' not in item) or (time_since_update > timedelta(days=expiration_in_days)) or force_update
            print(f'shouldUpdate: {shouldUpdate}')
            
            if shouldUpdate:
                print(f'updating rent estimate for {address}')
                payload = {
                    'address': address, 
                    'bedrooms': bedrooms,
                    'bathrooms': bathrooms,
                    'sqft': square_footage,
                    'mp_style': mp_style,
                    'days_old': days_old,
                    'comp_count': comp_count
                }

                response = sqs.send_message(
                    QueueUrl=queue_url,
                    MessageBody=json.dumps(payload, default=str),
                )
                print(f'sent message {response["MessageId"]} to {queue_url}')
                
                # r = lambdaClient.invoke(
                #     FunctionName=f'rentimport-{os.environ["stage"]}-updateRent',
                #     Payload=json.dumps(payload),
                #     InvocationType='Event'
                # )
                
            else:
                print('Skipping rent update')
                
        return rent_data


    def update_rent(self, address, params):
        address = normalize_address(address)
        print(f'updating rent estimate for {address}')
        try:
            response = requests.get(url, 
                headers={
                    "X-RapidAPI-Host":"realtymole-rental-estimate-v1.p.rapidapi.com",
                    "X-RapidAPI-Key": rapid_api_key
                },
                params=params
            )
            print(f'response: {response.status_code}')
            print(response.text)
            json_data = json.loads(response.text)
            
            if json_data.get('rent'):
                rent_data = {
                    'price': json_data.get('rent'),
                    'comps': json_data.get('listings')
                }
                self.__save_rent_estimate__(address, rent_data, params)
                return rent_data
            else:
                print('RealtyMole didnt return a valid rent value')
                raise Exception(f'RealtyMole didnt return a valid rent value. HttpCode: {response.status_code}. Text: {response.text}')
        except Exception as e:
            print('An error occurred with the RealtyMole API')
            print("Unexpected error:", sys.exc_info()[0])
            traceback.print_exc()
            self.__save_rent_estimate__(address, {}, params)
            raise Exception('An error occurred with the RealtyMole API') from e
    
    def __save_rent_estimate__(self, address, rent_data, params):
        address = normalize_address(address)
        currentDate = datetime.utcnow().isoformat()
        item = {
            'address': address,
            'RentLastUpdatedDate': currentDate,
            'RentData': rent_data,
            'params': json.dumps(params)
        }

        try:
            # dynamodb doesn't support floats, so we need to convert all floats to Decimals
            converted_item = json.loads(json.dumps(item), parse_float=Decimal)
            response = listings_table.put_item(
                Item=converted_item
            )
        except ClientError as e:
            logging.error(e.response['Error']['Message'])
        else:
            print(f'updated rent for {address}')
