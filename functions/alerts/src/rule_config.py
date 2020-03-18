from utils import dt_to_ts, ts_now
from enum import Enum
from datetime import datetime, timedelta
from dateutil.parser import parse
import logging
import json
from realpeek_search.search import PropertySearch, CmaMode
from elasticsearch_dsl import Search, DocType, Index, Date, Boolean, Double, Integer,Nested, Keyword, Text
from elasticsearch_dsl.analysis import normalizer

lowercase = normalizer('lowercase_normalizer',
    filter=['lowercase']
)

class EmailTime(Enum):
    MORNING = 0
    EVENING = 1
    DEFAULT = 2

class EmailFrequency(Enum):
    NEVER = 0
    INSTANTLY = 1
    DAILY = 2
    WEEKLY = 3
    MONTHLY = 4

class DayOfWeek(Enum):
    ALL = 0
    SUN = 1
    MON = 2
    TUE = 3
    WED = 4
    THU = 5
    FRI = 6
    SAT = 7

timestamp_field = 'list_date_received'
max_query_size = 10

class RuleConfig(DocType):
    class Index: 
        name = "alerts_rules"

    id = Keyword(normalizer=lowercase)
    owner = Keyword(normalizer=lowercase)
    name = Keyword(normalizer=lowercase)
    query = Text(index=False)
    assumptions = Text(index=False)
    created_at = Date()
    
    site_id = Keyword(normalizer=lowercase)

    recipient_ids = Keyword(normalizer=lowercase)
    
    enabled = Boolean()
    frequency = Keyword(normalizer=lowercase)
    schedule_days = Keyword(normalizer=lowercase)
    schedule_hours = Keyword(normalizer=lowercase)
    
    
    @classmethod
    def from_dict(cls, **kwargs):
        r = cls()
        r.site_id = ''
        r.owner = kwargs['owner']
        r.id = kwargs['id']
        r.name = kwargs['name']
        r.query = json.dumps(kwargs['query'], default=str)
        r.assumptions = json.dumps(kwargs['assumptions'], default=str)
        r.created_at = kwargs.get('created_at')
        r.enabled = kwargs.get('email_enabled', False)
        r.frequency = kwargs.get('email_frequency', '').lower().capitalize()
        
        email_day_of_week = kwargs.get('email_day_of_week')
        email_time = kwargs.get('email_time', 'DEFAULT')

        r.__setup_schedule__(r.frequency, email_day_of_week, email_time)

        recipients = kwargs.get('recipient', [])
        if isinstance(recipients, str):
            recipients = [recipients]

        # if there aren't any recipients specified, then send to the owner
        if not recipients:
            recipients.append(r.owner)

        r.recipient_ids = recipients

        r.meta.id = r.id
        return r

    def __setup_schedule__(self, frequency:str, day_of_week, email_time='DEFAULT'):
        if self.enabled and frequency:
            frequency = EmailFrequency[frequency.upper()]
            if frequency == EmailFrequency.DAILY:
                self.schedule_days = [e.name for e in DayOfWeek if e != DayOfWeek.ALL]
            elif frequency == EmailFrequency.WEEKLY:
                day = DayOfWeek[day_of_week.upper()]
                self.schedule_days = [day.name]
            email_time = EmailTime[email_time.upper()]
            self.schedule_hours = [email_time.name]
        else:
            self.schedule_days = []
            self.schedule_hours = []
            
    def save(self, **kwargs):
        self.created_at = ts_now()
        return super(RuleConfig, self).save(**kwargs)

    def get_default_starttime(self):
        # delta = None
        # freq = EmailFrequency[self.frequency.upper()]
        # if freq == EmailFrequency.WEEKLY:
        #     delta = timedelta(days=7)
        # elif freq == EmailFrequency.DAILY:
        #     delta = timedelta(days=1)
        # else:
        #     delta = timedelta(days=0)

        return parse(self.created_at)


    def execute_query(self, starttime=None, endtime=None, sort=True, desc=False):
        """ Returns a query dict that will apply a list of filters, filter by
        start and end time, and sort results by timestamp.
        :param filters: A list of Elasticsearch filters to use.
        :param starttime: A timestamp to use as the start time of the query.
        :param endtime: A timestamp to use as the end time of the query.
        :param sort: If true, sort results by timestamp. (Default True)
        :return: A query dictionary to pass to Elasticsearch.
        """
        starttime = dt_to_ts(starttime)
        endtime = dt_to_ts(endtime)

        searcher = PropertySearch(self.site_id)
        query = json.loads(self.query)
        q = searcher.get_query(query)

        body = q.to_dict()
        if starttime and endtime:
            body['query']['bool']['filter'].insert(0, {'range': {
                timestamp_field: {
                    'gt': starttime,
                    'lte': endtime}}}
            )

        q = Search.from_dict(body)
        q = q[0:max_query_size]  # {"from": 0, "size": 10}
        if sort:
            q.sort(('-' if desc else '' ) + timestamp_field)

        print(q.to_dict())
        response = q.execute()
        print(response.to_dict())
        # query = {'query': {'bool': es_filters}}
        if self.assumptions:
            cma_params = json.loads(self.assumptions)
            cma_options = {
                'pretty_money': True
            }
            try:
                cma_response = searcher.calculate_cma(response, cma_params, cma_options, "successful")
                return cma_response
            except Exception as e:
                logging.error('error calculating CMA')
                logging.error(str(e))
                return None
        else:
            logging.error('could not calculate CMA; assumptions not provided')
            return None
