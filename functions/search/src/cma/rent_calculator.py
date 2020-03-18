import boto3
import os
import json
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
lambdaClient = boto3.client('lambda')


class RentCalculator:
    def __init__(self):
        self.table = dynamodb.Table('RentalStats')

    def get_rent(self, address, zipcode, bedrooms, bathrooms, square_footage, mp_style, max_days, max_comps):
        try:
            payload = {
                'address': address,
                'bedrooms': bedrooms, 
                'bathrooms': bathrooms,
                'sqft': square_footage,
                'mp_style': mp_style,
                'days_old': max_days,
                'comp_count': max_comps
            }
            response = lambdaClient.invoke(
                FunctionName=f'rentimport-{os.environ["stage"]}-getRent',
                Payload=json.dumps(payload)
            )
            data = json.loads(response['Payload'].read().decode("utf-8"))
            data['comps'] = [RentCalculator.__convert_to_comp__(c) for c in data.get('comps')]
            data['source'] = 'RealtyMole'
            if not data.get('price'):
                data['price'] = self.get_rental_stats_price(zipcode, bedrooms)
                data['source'] = 'Rentometer'
            return data
        except:
            print('there was an error getting the rent from RealtyMole. Trying Rentometer')
            data = {
                'price': self.get_rental_stats_price(zipcode, bedrooms),
                'source': 'Rentometer'
            }
            return data
        

    # Get average monthly rent for property by zipcode and bedrooms
    def get_rental_stats_price(self, zipcode, bedrooms):
        print('retrieving rental stats price from dynamodb for zip ' + str(zipcode) + ' beds ' + str(bedrooms))
        result = 0.0
        try:
            response = self.table.query(
                KeyConditionExpression=Key('address').eq(int(zipcode))
            )
        except ClientError as e:
            print("error retrieving rental stats")
            print(e.response['Error']['Message'])
            return result
        else:
            # 	Get rows if any returned and compute price based on closest match to bedrooms function arg
            # Set up to search for closest match in # of beds
            diff_beds = 10
            match_beds = 0
            match_price = 0.0

            for i in response['Items']:
                # Look for closest number of bedrooms with non-zero price for the zipcode
                zip_beds = float(i['bedrooms'])
                beds_price = float(i.get('median', 0))
                beds_diff = abs(zip_beds - bedrooms)
                if (beds_diff < diff_beds and beds_price > 0.0):
                    match_beds = int(zip_beds)
                    match_price = beds_price
                    diff_beds = beds_diff
    
            # If found a non-zero price for some number of bedrooms in the zipcode, use funky formula to computer guesstimate.
            if (match_price > 0.0):
                # Price will be increased or decreased by 10% times difference in number of bedrooms
                delta_price = match_price * ((float(abs(match_beds - bedrooms))) * 0.10)
                if (match_beds < bedrooms):
                    result = match_price + delta_price
                else:	
                    result = match_price - delta_price
                    
            return result
    @staticmethod
    def __convert_to_comp__(realty_mole_comp):
        return RealtyMoleComp(realty_mole_comp)

class RealtyMoleComp():
    def __init__(self, c):
        self.address = c.get('formattedAddress')
        self.lat = c.get('latitude')
        self.lon = c.get('longitude')
        self.price = c.get('price')
        self.listing_date = c.get('publishedDate')
        self.zipcode = c.get('zipcode')
        self.city = c.get('city')
        self.county = c.get('county')
        self.state = c.get('state')
        self.days = c.get('daysOld')
        self.miles = c.get('distance')
        self.mp_style_name = c.get('propertyType')
        self.bed = c.get('bedrooms')
        self.bath = c.get('bathrooms')
        self.sqft = c.get('squareFootage', 0)
        self.price_sqft = ( float(self.price / self.sqft) ) if self.sqft > 0 else 0


