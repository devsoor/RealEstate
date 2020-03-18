import sys
import traceback
import os
from elasticsearch_dsl import Search, A
from elasticsearch_dsl.query import MultiMatch, Match, MatchPhrase, Term, Bool, Terms, GeoDistance, Range, Script
from multiprocessing import Process, Pipe
from concurrent.futures import ThreadPoolExecutor
import boto3
import json
import statistics
from mlsproperty import Property
from datetime import datetime, timedelta
from search_options import SearchOptions
from cma.cma import CmaCalculator

from enum import Enum

class CmaMode(Enum):
    NONE = 0
    ALL = 1
    PAGE_ONLY = 2

# class Sort(Enum):
#     SUCCESS_CRITIERA = 'success_criteria'
#     CASH_FLOW = 'cash_flow_criteria'
#     CAPRATE = 'cap_rate_criteria'
#     RENT_TO_VALUE = 'rent_to_value_criteria'
#     LIST_PRICE = 'price'
#     BEDROOMS = 'bedrooms'
#     CITY = 'city'
#     ZIPCODE = 'zipcode'
#     SQFT = 'sqft'
#     DOM = 'dom'
#     DEFAULT = 'list_date'

#     @classmethod
#     def has_value(cls, value):
#         return any(value == item.value for item in cls)

class PropertySearchBulk:
    def __init__(self, site_id):
        self.stage = os.environ.get('stage')
        self.site_id = site_id

    def createRangeFilter(self, searchParams, min, max, field):
        minValue = searchParams.get(min)
        maxValue = searchParams.get(max)
        if (minValue or maxValue):
            r = {}
            if (minValue):
                r["gte"] = str(minValue)
            if (maxValue):
                r["lte"] = str(maxValue)
            attributes = {field: r}
            return Range(**attributes)
        return None
    

    def createDOMFilter(self, searchParams, min, max, field):
        minValue = searchParams.get(min)
        maxValue = searchParams.get(max)
        if minValue is not None or maxValue is not None:
            try:
                if minValue is not None:
                    minValue = int(minValue)
                if maxValue is not None:
                    maxValue = int(maxValue)
                if minValue is not None and maxValue is not None and minValue > maxValue:
                    raise ValueError('min cannot be more than max')
                attributes = {
                    "script": {
                        "lang": "painless",
                        "source": """
                            long dom = doc['cdom'].value + (System.currentTimeMillis() - doc['update_date'].value.getMillis()) /86400000;
                            boolean between = true;
                            if (params.min > 0) {
                                between = (dom >= params.min);
                            }
                            if (params.max > 0) {
                                between = between && (dom <= params.max);
                            }
                            return between;
                            """,
                        "params": {
                            "min": minValue or 0,
                            "max": maxValue or 0
                        }
                    }
                }
                return Script(**attributes)
            except Exception as e:
                print('invalid parameter provided for ' + field)
                print(e)
        return None

    def createDateRangeFilter(self, searchParams, min, max, field):
        minValue = searchParams.get(min)
        maxValue = searchParams.get(max)
        if minValue is not None or maxValue is not None:
            try:
                r = {}
                if minValue is not None:
                    minValue = int(minValue)
                    r["lte"] = f"now-{minValue}d"
                if maxValue is not None:
                    maxValue = int(maxValue)
                    r["gte"] = f"now-{maxValue}d"
                if minValue is not None and maxValue is not None and minValue > maxValue:
                    raise ValueError('min cannot be more than max')
                attributes = {field: r}
                return Range(**attributes)
            except Exception as e:
                print('invalid parameter provided for ' + field)
                print(e)
        return None


    def get_bulk_query(self, searchParams):
        filters = []
        exclude = []

        search_type = searchParams.get('searchType', 'location')
        # exclude rental properties
        exclude.append(Term(property_type="RENT"))

        statusList = ["A"]
        if (searchParams.get("include_pending")):
            statusList.append("P")
        # filter by the correct status
        filters.append(Terms(mp_status=statusList))
        if (searchParams.get("location")):
            filters.append(MultiMatch(fields=["city", "zipcode", "county", "listing_id", "address"], type="phrase", query=searchParams["location"]))
        
        if search_type == 'location':
            locations = searchParams.get("locations")
            if (locations):
                locationFilters = []
                for loc in locations:
                    locType = loc['type']
                    locValue = loc['value']
                    if (locType):
                        attrs = { locType:locValue }
                        locationFilters.append(MatchPhrase(**attrs))
                    else:
                        locationFilters.append(MultiMatch(fields=["city", "zipcode", "county", "listing_id", "address"], type="phrase", query=locValue))
                filters.append(Bool(should=locationFilters))
            if (searchParams.get("address")):
                filters.append(MatchPhrase(address=searchParams["address"]))
            if (searchParams.get("city")):
                filters.append(Term(city=searchParams["city"]))
            if (searchParams.get("zipcode")):
                filters.append(Term(zipcode=searchParams["zipcode"]))
            if (searchParams.get("county")):
                filters.append(Term(county=searchParams["county"]))
            if (searchParams.get("listing_id")):
                filters.append(Term(listing_id=searchParams["listing_id"]))

        # if search_type == "ids":
        #     locations = searchParams.get("ids")
        #     if locations:
        #         filters.append(Terms(listing_id=locations.split()))

        # if search_type == "poi":
        #     if (searchParams.get("poi")):
        #         distance = searchParams.get("distance", 2)
        #         poi = searchParams.get("poi")
        #         if (poi.get("lat") and poi.get("lng")):
        #             filters.append(GeoDistance(
        #                 distance=str(distance) + "mi",
        #                 location={"lat":poi["lat"], "lon": poi["lng"]}))

        if (searchParams.get("ptype")):
            filters.append(Terms(property_type=searchParams["ptype"]))
        if (searchParams.get("style")):
            styles = list(filter(len, searchParams["style"]))
            if (styles):
                filters.append(Terms(mp_style=styles))
        
        # filter for bank owned
        bank_owned = searchParams.get("bank_owned")
        if (bank_owned):
            if (bank_owned.lower() == "only"):
                filters.append(Term(breo='Y'))
            elif(bank_owned.lower() == "exclude"):
                exclude.append(Term(breo='Y'))
        
        # filter for short sale
        short_sale = searchParams.get("short_sale")
        if (short_sale):
            if (short_sale.lower() == "only"):
                filters.append(Term(parq='C'))
            elif(short_sale.lower() == "exclude"):
                exclude.append(Term(parq='C'))
        
        # filter for fixer upper
        fixer = searchParams.get("fixer")
        if (fixer):
            if (fixer.lower() == "only"):
                filters.append(Term(building_condition='C'))
            elif(fixer.lower() == "exclude"):
                exclude.append(Term(building_condition='C'))

        # filter for new construction
        new_construction = searchParams.get("new_construction")
        if (new_construction):
            if (new_construction.lower() == "only"):
                filters.append(Term(new_construction='Y'))
            elif(new_construction.lower() == "exclude"):
                exclude.append(Term(new_construction='Y'))

        # filter for interior features
        interior_features = searchParams.get("features")
        if (interior_features):
            filters.append(Terms(interior_features=interior_features))

        # filter for days on market
        days_on_market_filter = self.createDOMFilter(searchParams, "min_days_on_market", "max_days_on_market", "list_date")
        if (days_on_market_filter):
            filters.append(days_on_market_filter)

        # filter for price range
        price_filter = self.createRangeFilter(searchParams, "min_price", "max_price", "price")
        if (price_filter):
            filters.append(price_filter)

        # filter for num beds
        bed_filter = self.createRangeFilter(searchParams, "min_beds", "max_beds", "bedrooms")
        if (bed_filter):
            filters.append(bed_filter)

        # filter for num baths
        bath_filter = self.createRangeFilter(searchParams, "min_baths", "max_baths", "bathrooms")
        if (bath_filter):
            filters.append(bath_filter)

        # filter for built date
        year_filter = self.createRangeFilter(searchParams, "built_after", "built_before", "year_built")
        if (year_filter):
            filters.append(year_filter)

        # filter for sqft
        sqft_filter = self.createRangeFilter(searchParams, "min_sqft", "max_sqft", "sqft")
        if (sqft_filter):
            filters.append(sqft_filter)

        # filter for lot size
        lot_size_filter = self.createRangeFilter(searchParams, "min_lot", "max_lot", "lot_size")
        if (lot_size_filter):
            filters.append(lot_size_filter)

        # filter for hoa dues
        hoa_filter = self.createRangeFilter(searchParams, "min_hoa", "max_hoa", "hoa_dues")
        if (hoa_filter):
            filters.append(hoa_filter)

        s = Property.search(index="property")
        s = s.query("bool", filter=filters, must_not=exclude)
        return s

 

    def search_bulk(self, event, searchParams, cma_mode):
        # print("DSDSDSDS<><><><> search: event = ", event)
        s = self.get_bulk_query(searchParams)

        count = s.count()
        
        print('Found {count} results'.format(count=count))
        # pagination
        page_start = searchParams.get("from", 0)
        size = searchParams.get("size", 10)

        max_cma = 3000
        if count <= max_cma:
            cma_exceeded = False
            size = max_cma
        else:
            cma_exceeded = True

        print('cma exceeded: ' + str(cma_exceeded))

        page_end = page_start + size
        s = s[page_start:page_end]

        response = s.execute()

        print("s.to_dict = ", s.to_dict())

        cma_response = response.to_dict()

        # if (calculate_cma):
        cmaParams = searchParams.get('cma', {})
        filterMode = searchParams.get('filter')
        reqParams = cmaParams.get('parameters')
        reqOptions = cmaParams.get('options')
        if (reqParams and reqOptions):
            cma_response = self.calculate_bulk_cma(event, cma_response, reqParams, reqOptions, filterMode)

        # we calculated everything, but only need to return to the user what they requested
        # if (cma_mode is CmaMode.ALL):
        page_start = searchParams.get("from", 0)
        size = searchParams.get("size", 10)
        page_end = page_start + size
        print('Getting search results {start} to {end}'.format(start=page_start, end=page_end))
        cma_response['hits']['hits'] = cma_response['hits']['hits'][page_start:page_end]
        print("DSDSDSDS<><><> search: if cma_mode: cma_response = ", cma_response)

        cma_response['hits']['max_cma'] = max_cma
        if cma_exceeded:
            cma_response['hits']['cma_exceeded'] = cma_exceeded

        cma_response['hits']['aggregate'] = self.calculate_aggregate(cma_response['hits']['hits'])
        print("DSDSDSDS<><><><> search_bulk: returning cma_response = ", cma_response)
        return cma_response
            
    def batch(self, iterable, n=1):
        l = len(iterable)
        for ndx in range(0, l, n):
            yield iterable[ndx:min(ndx + n, l)]

    def calculate_bulk_cma(self, event, response, req_params, req_options, filterMode):
        print("DSDSDSDS<><><><> search: calculate_cma: event = ", event)
        print("DSDSDSDS<><><><> search: calculate_cma: response = ", response)
        count = len(response['hits']['hits'])
        print('Calculating CMA for {count} results'.format(count=count))
        client = boto3.client('lambda')
        payload = {'parameters': req_params, 'options': req_options}
        
        batch_size = 20
        if count < batch_size:
            batch_size = 5
            
        batches = list(self.batch(response['hits']['hits'], batch_size))
        with ThreadPoolExecutor(max_workers=40) as executor:
            futs = []
            for property_batch in batches:
                # print("DSDSDSDS<><><><> property_batch = ", property_batch)
                ids = [prop['_source']['unique_id'] for prop in property_batch]
                print('calculating cma for batch, size: ', batch_size)
                print(ids)
                payload['id'] = ids
                payload['site_id'] = self.site_id
                payloadmsg = {'event':event, 'pload':payload}
                # print("DSDSDSDS<><><><> calculate_cma: payloadmsg = ", payloadmsg)
                futs.append(
                    executor.submit(client.invoke,
                        FunctionName   = f"search-{self.stage}-cmaCalculation",
                        InvocationType = "RequestResponse",
                        Payload        = bytes(json.dumps(payloadmsg), 'utf8')
                    )
                )
            # for prop in response['hits']['hits']:
            #     print(prop)
            #     payload['id'] = prop['_source']['unique_id']
            #     futs.append(
            #         executor.submit(client.invoke,
            #             FunctionName   = "search-dev-cmaCalculation",
            #             InvocationType = "RequestResponse",
            #             Payload        = bytes(json.dumps(payload), 'utf8')
            #         )
            #     )
            
            hits = response['hits']['hits']
            successfulHits = []

            # for index, hit in enumerate(hits):
            for index, batch in enumerate(batches):
                # print("DSDSDSDSD<><><> calculate_cma: index = ", index)
                # print("DSDSDSDSD<><><> calculate_cma: batch = ",batch)
                fut = futs[index]
                payload = fut.result()['Payload'].read().decode("utf-8")
                # print("DSDSDSDSD<><><> calculate_cma: payload from LAMBDA = ", payload)
                body = json.loads(payload).get('body')
                # print("DSDSDSDSD<><><> calculate_cma: body = ", json.dumps(body))
                if body:
                    results = json.loads(body)
                    for index, hit in enumerate(batch):
                        try:
                            success = "N/A"
                            # print("ENUMERATING HIT " + str(index) + ": LN " + hit['_id'] )
                            cma_result = results[index]
                            hit['cma'] = cma_result
                            # print("DSDSDSDSDSD<><><>   hit[cma] = ", hit['cma'])
                            if (cma_result):
                                # print('results for ' + cma_result['request_property']['listing_number'])
                                critera_result = cma_result['cma']['cma_results']['criteria_result']
                                if (critera_result == "Failure"):
                                    success = False
                                elif (critera_result == "Success"):
                                    success = True
                                    successfulHits.append(hit)
                                    print("Successful hits: ", successfulHits)

                            else:
                                print('no result for str ' + str(index))
                        except:
                            print('an error occurred with the cma calculation: ' + payload)
                            print("Unexpected error:", sys.exc_info()[0])
                            traceback.print_exc()
                            hit['cma'] = None
                        finally:
                            hit['success'] = success

        hits = [item for batch in batches for item in batch]
        # if sort:
        #     hits.sort(key=lambda x: x['cma']['cma']['cma_results']['criteria_value'] if x.get('cma') else 0, reverse=desc)

        print (hits)
        if (filterMode and filterMode.lower() == "successful"):
            # if sort:
            #     successfulHits.sort(key=lambda x: x['cma']['cma']['cma_results']['criteria_value'] if x.get('cma') else 0, reverse=desc)
            response['hits']['hits'] = successfulHits
            response['hits']['total'] = len(successfulHits)
        else:    
            response['hits']['hits'] = hits

        response['hits']['totalSuccess'] = len(successfulHits)
        print("DSDSDSDSD<><><> search: calculate_cma: response[hits][hits] = ", response['hits']['hits'])
        return response

    def getnestedvalue(self, dict, list): 
        length = len(list)
        try:
            for depth, key in enumerate(list):
                if depth == length - 1:
                    output = dict[key]
                    return output
                dict = dict[key]
        except (KeyError, TypeError):
            return None

        return None
                
    def calculate_aggregate(self, results):
        result = {}
        stat = {}
        for p in results:
            city = self.getnestedvalue(p, ['_source', 'city'])
            if (not city in stat):
                stat[city] = {}
                stat[city]['cashFlowStats'] = []
                stat[city]['capRateStats'] = []
                stat[city]['cashOnCashStats'] = []
                stat[city]['rent2ValueStats'] = []
                stat[city]['rentStats'] = []
                stat[city]['priceStats'] = []
                stat[city]['priceSqftStats'] = []
                stat[city]['rentSqftStats'] = []
                stat[city]['latlong'] = []
                result[city] = {}
                result[city]['cashFlowStats'] = []
                result[city]['capRateStats'] = []
                result[city]['cashOnCashStats'] = []
                result[city]['rent2ValueStats'] = []
                result[city]['rentStats'] = []
                result[city]['priceStats'] = []
                result[city]['priceSqftStats'] = []
                result[city]['rentSqftStats'] = []
                result[city]['latlong'] = []
                result[city]['totalHits'] = []


            stat[city]['cashFlowStats'].append(self.getnestedvalue(p, ['cma', 'cma', 'cma_results', 'Result_CashFlow']))
            stat[city]['capRateStats'].append(self.getnestedvalue(p, ['cma', 'cma', 'cma_results', 'Result_CapRate']))
            stat[city]['cashOnCashStats'].append(self.getnestedvalue(p, ['cma', 'cma', 'cma_results', 'Result_CashOnCashReturn']))
            stat[city]['rent2ValueStats'].append(self.getnestedvalue(p, ['cma', 'cma', 'cma_results', 'Result_RentValueRatio']))
            stat[city]['rentStats'].append(self.getnestedvalue(p, ['cma', 'cma', 'cma_results', 'Result_EstMonthlyRent']))
            stat[city]['priceStats'].append(self.getnestedvalue(p, ['cma', 'cma', 'params', 'purchase_price']))
            stat[city]['priceSqftStats'].append(self.getnestedvalue(p, ['cma', 'cma', 'subject_property', 'price_sqft']))
            stat[city]['rentSqftStats'].append(self.getnestedvalue(p, ['cma', 'cma', 'subject_property', 'rent_sqft']))
            lat = self.getnestedvalue(p, ['_source', 'lat'])
            lng = self.getnestedvalue(p, ['_source', 'long'])
            stat[city]['latlong'].append({'lat':lat, 'long':lng})
            
        for cityname,statvalues in stat.items():
            for name,values in statvalues.items():
                # if (name == 'lat') or (name == 'long'):
                if (name == 'latlong'):
                    result[cityname][name] = values
                else:
                    result[cityname][name] = {
                        'min': min(values),
                        'max': max(values),
                        'mean': statistics.mean(values),
                        'median': statistics.median(values)
                    }
                    result[cityname]['totalHits'] = len(values) 

        return result