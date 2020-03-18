from utils import dt_to_ts
import logging
import time
from datetime import datetime
from elasticsearch_dsl import Search, DocType, Index, Date, Boolean, Double, Integer,Nested, Keyword, Text
from elasticsearch_dsl.analysis import normalizer

class RuleRun(DocType):
    class Index: 
        name = "alerts_runs"
    rule_id = Keyword()
    rule_name = Keyword()
    starttime = Date()
    endtime = Date()  
    matches = Integer()  
    minimum_starttime = Date()
    timestamp = Date()
    time_taken = Double()

    def start(self):
        self.run_start_timer = time.time()
    
    def stop(self):
        self.run_stop_timer = time.time()
        self.time_taken = time.time() - self.run_start_timer


    def add_data(self, data):
        if not data:
            self.matches = 0
        else:
            self.matches = len(data)
        # for datum in data:
        #     self.add_match(datum)

    def save(self, **kwargs):
        self.timestamp = datetime.now()
        return super(RuleRun, self).save(**kwargs)

    # def remove_duplicate_events(self, data):
    #     new_events = []
    #     for event in data:
    #         if event['_id'] in self['processed_hits']:
    #             continue

    #         # Remember the new data's IDs
    #         self['processed_hits'][event['_id']] = lookup_es_key(event, self['timestamp_field'])
    #         new_events.append(event)

    #     return new_events
        
    # def add_match(self, event):
    #     """ Called on all matching hits.  Event is a dictionary
    #     containing terms directly from Elasticsearch and alerts will report
    #     all of the information.
    #     :param event: The matching event, a dictionary of terms.
    #     """
    #     self.matches.append(event)