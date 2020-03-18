import sys
import traceback
import os
from multiprocessing import Process, Pipe
from concurrent.futures import ThreadPoolExecutor
import boto3
import json
from datetime import datetime, timedelta
from search_options import SearchOptions
from cma.cma import CmaCalculator

from enum import Enum


class Sort(Enum):
    SUCCESS_CRITIERA = 'success_criteria'
    CASH_FLOW = 'cash_flow_criteria'
    CAPRATE = 'cap_rate_criteria'
    RENT_TO_VALUE = 'rent_to_value_criteria'
    LIST_PRICE = 'price'
    BEDROOMS = 'bedrooms'
    CITY = 'city'
    ZIPCODE = 'zipcode'
    SQFT = 'sqft'
    DEFAULT = 'price'

    @classmethod
    def has_value(cls, value):
        return any(value == item.value for item in cls)

class PropertyAnalyze:
    def __init__(self, site_id):
        self.stage = os.environ.get('stage')
        self.site_id = site_id

    def analyze(self, event, searchParams):
        # selectType = searchParams.get('selectType')
  
        properties = searchParams.get('offprops')
        count = len(properties)
        if (count == 0):
            print("No properties sent")
            return        

        max_cma = 1000
        cma_exceeded = False
        if (count > 1):
            s = properties
            print('Found ', count, "properties")
            # pagination
            page_start = searchParams.get("from", 0)
            size = searchParams.get("size", 10)

            # if we are including cma, then we need to do all the calculations so make sure to get all properties
            # we need to limit the cma calculation to 300 because of lambda limitations
            # max_cma = 1000
            # cma_exceeded = False

            if count <= max_cma:
                page_start = 0
                size = max_cma
            else:
                cma_exceeded = True
                print('cma exceeded: ' + str(cma_exceeded))
            
            page_end = page_start + size
            s = s[page_start:page_end]  # {"from": 0, "size": 10}


        cma_response = {
            'hits': {
                'total':count,
                'totalSuccess':0,
                'hits': properties
            }
        }
        # print("DSDSDS<>> Created cma_response = ", cma_response)
        # cma_response['hits']['total'] = count
        # cma_response['hits']['hits'] = properties

        cmaParams = searchParams.get('cma', {})
        filterMode = searchParams.get('filter')
        reqParams = cmaParams.get('parameters')
        reqOptions = cmaParams.get('options')
        if (reqParams and reqOptions):
            cma_response = self.analyze_cma(event, cma_response, reqParams, reqOptions, filterMode)

        cma_response['hits']['max_cma'] = max_cma
        if cma_exceeded:
            cma_response['hits']['cma_exceeded'] = cma_exceeded
        return cma_response
            
    def batch(self, iterable, n=1):
        l = len(iterable)
        for ndx in range(0, l, n):
            yield iterable[ndx:min(ndx + n, l)]

    def analyze_cma(self, event, response, req_params, req_options, filterMode):
        count = len(response['hits']['hits'])
        print('Calculating CMA for {count} results'.format(count=count))
        client = boto3.client('lambda')
        payload = {'parameters': req_params, 'options': req_options}
        
        batch_size = 50
        if count < batch_size:
            batch_size = 5
            
        batches = list(self.batch(response['hits']['hits'], batch_size))
        with ThreadPoolExecutor(max_workers=40) as executor:
            futs = []
            for property_batch in batches:
                # ids = [prop['_source']['unique_id'] for prop in property_batch]
                print('calculating cma for batch')
                # print(ids)
                # payload['id'] = ids
                payload['properties'] = property_batch
                payload['site_id'] = self.site_id
                payloadmsg = {'event':event, 'pload':payload}
                futs.append(
                    executor.submit(client.invoke,
                        FunctionName   = f"search-{self.stage}-cmaCalculationAnalyze",
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
                fut = futs[index]
                # print("DSDSDSDSD<><><> analyze_cma: fut from LAMBDA = ", fut)
                payload = fut.result()['Payload'].read().decode("utf-8")
                body = json.loads(payload).get('body')
                if body:
                    results = json.loads(body)
                    for index, hit in enumerate(batch):
                        try:
                            success = "N/A"
                            # print("ENUMERATING HIT " + str(index) + ": Property " + hit['address'] )
                            cma_result = results[index]
                            # print("DSDSDSDSD<><><> analyze_cma: cma_result = ", cma_result)
                            hit['cma'] = cma_result
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
        print ("Hits: ",hits)
        if (filterMode and filterMode.lower() == "successful"):
            response['hits']['hits'] = successfulHits
            response['hits']['total'] = len(successfulHits)
        else:    
            response['hits']['hits'] = hits

        response['hits']['totalSuccess'] = len(successfulHits)
        return response