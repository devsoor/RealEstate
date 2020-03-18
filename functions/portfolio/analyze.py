import sys
import traceback
import os
from multiprocessing import Process, Pipe
from concurrent.futures import ThreadPoolExecutor
import boto3
import json
from datetime import datetime, timedelta
from cma import CmaCalculator

from enum import Enum

class FolioAnalyze:
    def __init__(self, site_id, user_id):
        self.table_name = "Portfolios"
        self.stage = os.environ.get('stage')
        self.site_id = site_id
        self.user_id = user_id
        print("DSDSDSDSDS<><><><> FolioAnalyze: init")
    
    def analyze(self, event, folioParams):
        print("DSDSDSDSDS<><><><> FolioAnalyze: analyze: event = ", event)
        print("DSDSDSDSDS<><><><> FolioAnalyze: analyze: folioParams = ", folioParams)

        property_ids = folioParams.get('property_ids')
        assumptions = folioParams.get('assumptions')
  
        count = len(property_ids)
        if (count == 0):
            print("No properties sent")
            return        

        max_cma = 100
        cma_exceeded = False
        if (count > 1):
            print('Found ', count, "properties")

            if count > max_cma:
                cma_exceeded = True
                print('cma exceeded: ' + str(cma_exceeded))

        cma_response = {
            'hits': {
                'total':count,
                'hits': property_ids
            }
        }
        # print("DSDSDS<>> Created cma_response = ", cma_response)
        # cma_response['hits']['total'] = count
        # cma_response['hits']['hits'] = properties

        # reqParams = cmaParams.get('parameters')
        # reqOptions = cmaParams.get('options')
        # if (reqParams and reqOptions):
        cma_response = self.analyze_cma(event, cma_response, assumptions)

        cma_response['hits']['max_cma'] = max_cma
        if cma_exceeded:
            cma_response['hits']['cma_exceeded'] = cma_exceeded
        return cma_response
            
    def batch(self, iterable, n=1):
        print("DSDSDSDSDS<><><><> ENTER FolioAnalyze: batch: iterable = ", iterable)

        l = len(iterable)
        for ndx in range(0, l, n):
            yield iterable[ndx:min(ndx + n, l)]
        print("DSDSDSDSDS<><><><> EXIT FolioAnalyze: batch: iterable = ", iterable)

    def analyze_cma(self, event, response, assumptions):
        print("DSDSDSDSDS<><><><> FolioAnalyze: analyze_cma: response['hits']['hits'] = ", response['hits']['hits'])

        count = len(response['hits']['hits'])
        print('Calculating CMA for {count} results'.format(count=count))
        client = boto3.client('lambda')
        payload = {}
        
        batch_size = 50
        if count < batch_size:
            batch_size = 2
            
        batches = list(self.batch(response['hits']['hits'], batch_size))
        with ThreadPoolExecutor(max_workers=40) as executor:
            futs = []
            for p_ids in batches:
                print('calculating cma for IDs: ', p_ids)
                # print(ids)
                # payload['id'] = ids
                payload['property_ids'] = p_ids
                payload['assumptions'] = assumptions
                payload['site_id'] = self.site_id
                payload['user_id'] = self.user_id
                payloadmsg = {'event':event, 'pload':payload}
                futs.append(
                    executor.submit(client.invoke,
                        FunctionName   = f"portfolio-{self.stage}-cmaCalculationFolio",
                        InvocationType = "RequestResponse",
                        Payload        = bytes(json.dumps(payloadmsg), 'utf8')
                    )
                )

            hits = response['hits']['hits']
            successfulHits = []

            # for index, hit in enumerate(hits):
            for index, batch in enumerate(batches):
                fut = futs[index]
                # print("DSDSDSDSD<><><> analyze_cma: fut from LAMBDA = ", fut)
                payload = fut.result()['Payload'].read().decode("utf-8")
                # print("DSDSDSDSD<><><> analyze_cma: fut.result() from LAMBDA = ", fut.result())
                body = json.loads(payload).get('body')
                # print("DSDSDSDSD<><><> analyze_cma: body from LAMBDA = ", body)
                if body:
                    results = json.loads(body)
                    for index, hit in enumerate(batch):
                        # print("DSDSDSDSD<><><><><> index = ", index)
                        # print("DSDSDSDSD<><><><><> hit = ", hit)
                        try:
                            # print("ENUMERATING HIT " + str(index) + ": Property " + hit['address'] )
                            cma_result = results[index]
                            # print("DSDSDSDSD<><><> analyze_cma: cma_result = ", json.dumps(cma_result))
                            # hit['cma'] = cma_result
                            if (cma_result):
                                successfulHits.append(cma_result)
                                print("Successful hits: ", successfulHits)
                            #     # print('results for ' + cma_result['request_property']['listing_number'])
                            #     critera_result = cma_result['cma']['cma_results']['criteria_result']
                            #     if (critera_result == "Failure"):
                            #         success = False
                            #     elif (critera_result == "Success"):
                            #         success = True
                            #         successfulHits.append(hit)
                            #         print("Successful hits: ", successfulHits)
                            # else:
                            #     print('no result for str ' + str(index))
                        except:
                            print('an error occurred with the cma calculation: ' + payload)
                            print("Unexpected error:", sys.exc_info()[0])
                            traceback.print_exc()
                            # hit['cma'] = None
                        # finally:
                        #     hit['success'] = success

        hits = [item for batch in batches for item in batch]
        print ("Hits: ",hits)
        print("DSDSDSDSD<><><> analyze_cma: successfulHits = ", successfulHits)

        response['hits']['hits'] = successfulHits

        return response