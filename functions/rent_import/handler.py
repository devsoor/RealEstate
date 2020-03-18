import json
import sys
sys.path.append('src')
from lambda_decorators import cors_headers
import boto3
import os
import csv
from decimal import Decimal
from realty_mole import RealtyMole

s3 = boto3.client('s3')
lambdaClient = boto3.client('lambda')
realty_mole = RealtyMole()

def import_csv_to_dynamodb(table_name, csv_contents, column_names, column_types):
    '''
    Import a CSV file to a DynamoDB table
    '''        
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
    table = dynamodb.Table(table_name) 
    
    items = []
    
    # csv_file = open(csv_file_name, 'r')
    lines = csv_contents.splitlines(True)
    csv_file = csv.reader(lines, delimiter=',')

    # skip the header row
    next(csv_file)
    for row in csv_file:
        item = {}
        for column_number, column_name in enumerate(column_names):
            if (row[column_number]):
                item[column_name] = column_types[column_number](row[column_number])
              
        items.append(item)

    with table.batch_writer() as batch:
        for i in items:
            batch.put_item(
                Item=i
        )
        
    print('imported ' + str(len(items)) + ' items')


def import_rental_stats(event, context):
    column_names = 'address status report_time bedrooms mean median min max std_dev eightieth twentieth max_distance sample_size'.split()
    response = s3.get_object(Bucket= 'realpeek-data', Key= 'rentometer.csv') 
    csv = response['Body'].read().decode('utf-8')
    column_types = [int, str, str, int, int, int, int, int, int, int, int, Decimal, int]
    import_csv_to_dynamodb('RentalStats', csv, column_names, column_types)

    body = {
        "message": "Import success",
        "input": event
    }

    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }

    return response

def update_all_rents(event, context):
    has_more_hits = True
    total = None
    start = 0
    size = event.get('size', 10)
    total = event.get('total')
    searchAfter = None

    while has_more_hits:
        query = {
            "searchAfter": searchAfter,
            "size": size
        }
        print('getting next page')
        print(query)
        r = lambdaClient.invoke(
            FunctionName=f'search-{os.environ["stage"]}-searchInternal',
            Payload=json.dumps(query)
        )
        response = json.loads(r['Payload'].read().decode("utf-8"))
        if not total:
            total = response['hits']['total']
        hits = response['hits']['hits']
        end = start + len(hits)
        print(f'processing {start}-{end} of {total}')
        for h in hits:
            hit = h['_source']
            listing = {
                'address': hit.get('address'),
                'bedrooms': hit.get('bedrooms'),
                'bathrooms': hit.get('bathrooms'),
                'sqft': hit.get('sqft'),
                'mp_style': hit.get('mp_style'),
                'days_old': 90,
                'comp_count': 5
            }
            # todo: we could use an SQS queue for this too, but since it's only run once it's probably not necessary
            # if we end up running this many times, we may want to use an SQS queue
            r = lambdaClient.invoke(
                FunctionName=f'rentimport-{os.environ["stage"]}-getRent',
                Payload=json.dumps(listing),
                InvocationType='Event'
            )
            searchAfter = h.get('sort')
            start += 1

        has_more_hits = start < total
    return


def listing_updated_get_rent(event, context):
    for record in event.get('Records'):
        body = json.loads(record['body'])
        listing = json.loads(body["Message"])
        print(listing)
        status = listing.get('ST')
        # we only want to update active or pending properties
        if status.upper() not in ['A', 'P']:
            print('status not A or P, skipping rent update')
            continue
        # skip VACL
        if listing.get('PTYP') in ['VACL']:
            print('skipping rent update for VACL')
            continue
    
        # we could also do this in the SQS subscription filtering by adding a message attribute
        if status.upper() in ['A', 'P'] and listing.get('PTYP') not in ['VACL']:
            ln = listing.get('LN')
            print(f'updating rent estimate for listing# {ln}')
            address_parts = [listing.get(p) for p in ['HSN', 'DRP', 'STR', 'SSUF', 'DRS'] if listing.get(p)]
            if listing.get('UNT'):
                address_parts.append(f"Unit {listing.get('UNT')}")
            address_parts += [listing.get(p) for p in ['CIT', 'STA', 'ZIP'] if listing.get(p)]
            address = " ".join(address_parts)

            bedrooms = listing.get('BR')
            bathrooms = listing.get('BTH')
            square_footage = listing.get('ASF')
            mp_style = listing.get('mpStyle')
            days_old = 90
            comp_count = 5

            realty_mole.get_rent_estimate(address, bedrooms, bathrooms, square_footage, mp_style, days_old, comp_count, force_update=False)
        else:
            print('skipping rent update')
    return True

def get_rent(event, context):
    address = event.get('address')
    bedrooms = event.get('bedrooms')
    bathrooms = event.get('bathrooms')
    square_footage = event.get('sqft')
    mp_style = event.get('mp_style')
    days_old = event.get('days_old')
    comp_count = event.get('comp_count')
    rent = realty_mole.get_rent_estimate(address, bedrooms, bathrooms, square_footage, mp_style, days_old, comp_count, force_update=False)
    return rent

def update_rent(event, context):
    for record in event.get('Records'):
        listing = json.loads(record['body'])
        print(listing)

        address = listing.get('address')
        bedrooms = listing.get('bedrooms')
        bathrooms = listing.get('bathrooms')
        square_footage = listing.get('sqft')
        mp_style = listing.get('mp_style')
        days_old = listing.get('days_old')
        comp_count = listing.get('comp_count')

        params = realty_mole.get_params(address, bedrooms, bathrooms, square_footage, mp_style, days_old, comp_count)
        rent = realty_mole.update_rent(address, params)
    
    print(rent)
    return rent


def import_property_taxes(event, context):
    column_names = 'county rate'.split()
    response = s3.get_object(Bucket='realpeek-data', Key= 'property_tax_rates.csv') 
    csv = response['Body'].read().decode('utf-8')
    column_types = [str, Decimal]
    import_csv_to_dynamodb('PropertyTaxRates', csv, column_names, column_types)

    body = {
        "message": "Import success",
        "input": event
    }

    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }

    return response

@cors_headers
def import_property_taxes_by_city(event, context):
    column_names = 'city county rate'.split()
    response = s3.get_object(Bucket='realpeek-data', Key= 'property_taxes_cities.csv') 
    csv = response['Body'].read().decode('utf-8')
    column_types = [str, str, Decimal]
    import_csv_to_dynamodb('PropertyTaxByCityRates', csv, column_names, column_types)

    body = {
        "message": "Import success",
        "input": event
    }

    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }
    return response