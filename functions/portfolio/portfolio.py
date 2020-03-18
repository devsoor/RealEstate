from datetime import datetime
from user_object import UserObject
from enum import Enum
import uuid
from decimal import Decimal

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

# decimalNames = [
#     'vacancy_rate', 'market_cap_rate', 'property_mgmt_percent', 'broker_commission', 'excise_tax'
# ]

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

class PortFolio(UserObject):
    table_name = "Portfolios"

    id = None
    owner = None
    name = None
    created_at = None
    recipient = None
    assumptions = None
    query = None
    email_enabled = False
    email_frequency = None
    email_day_of_week = None
    email_time = None

    @classmethod
    def create_property(cls, owner, data:dict):
        print("DSDSDSD<><><> portfolio: create_property: data = ", data)
        s = cls()
        if not owner:
            raise ValueError('Owner is required')        
        # if not data.get('property_name'):
        #     raise ValueError('Name is required')

        s.id = str(uuid.uuid4())
        s.owner = owner
        s.date = datetime.now().isoformat()
        s.folio_name = data.get('folio_name')
        s.folio_property = data.get('folio_property')
        # for key, value in data.items():
        #     print("DSDSDS<><><> create_property: key,value = ", key, ",  ",value)
        #     if key in decimalNames:
        #         setattr(s.folio_property, key, Decimal(value))
        #     else:
        #         setattr(s.folio_property, key, value)
        # s.folio_property = data
        # if data.get('vacancy_rate'):
        #     s.folio_property.vacancy_rate = Decimal(data.get('vacancy_rate'))
        # s.folio_property.market_cap_rate = Decimal(data.get('market_cap_rate'))
        # s.folio_property.property_mgmt_percent = Decimal(data.get('property_mgmt_percent'))
        # s.folio_property.broker_commission = Decimal(data.get('broker_commission'))
        # s.folio_property.excise_tax = Decimal(data.get('excise_tax'))

        # s.__update_email_settings__(data.get('email_enabled'), data.get('email_frequency'), data.get('email_day_of_week'))
        return s


    def __update_email_settings__(self, email_enabled:bool, frequency:str, day_of_week):
        '''
        Update email settings for the search alert.  
        Params:
        - frequency:str - Frequency at which to send alert - NEVER, DAILY, WEEKLY, MONTHLY
        - day_of_week:str - Day of week to send the alert if frequency is WEEKLY.  #1-7 or SUN-SAT or * or ALL
        '''
        self.email_enabled = email_enabled

        try:
            if not email_enabled:
                frequency = EmailFrequency.NEVER
            else:
                frequency = EmailFrequency[frequency.upper()]
            self.email_frequency = frequency.name
        except:
            raise ValueError('Invalid frequency')

        if frequency == EmailFrequency.WEEKLY:
            # default to Monday if day of week isn't given
            if not day_of_week:
                d = DayOfWeek.MON
            else:
                try:
                    d = DayOfWeek(int(day_of_week))
                except ValueError:
                    try:
                        if day_of_week == '*':
                            day_of_week = 'ALL'
                        d = DayOfWeek[day_of_week]
                    except:
                        raise ValueError('Invalid day of week')
            self.email_day_of_week = d.name
        else:
            self.email_day_of_week = None

    def update_settings(self, id, owner, new_settings):
        print("DSDSDS<><><><> PortFolio.update_settings: new_settings = ", new_settings)
        # new_property_name = new_settings.get('property_name')
        # if not new_property_name:
        #     raise ValueError('Name is required')
        # self.property_name = new_property_name
        updated_folio_property = super().update_user_object(PortFolio.table_name, owner, id, new_settings)
        print("DSDSDS<><><><> PortFolio.update_settings: updated_folio_property = ", updated_folio_property)

        return updated_folio_property
        # self.__update_email_settings__(new_settings.get('email_enabled'), new_settings.get('email_frequency'), new_settings.get('email_day_of_week'))

    @classmethod
    def get_folio_properties_for_user(cls, user):
        # attributesToGet = ["id", "date", "property"]
        #For now, the only saved searches accessible to a particular user are those for which it is the owner
        folio_properties = super().get_user_objects_for_user(PortFolio.table_name, user)
        folio_properties.sort(key=lambda x: x["date"], reverse=True)
        return folio_properties

    @classmethod
    def get_folio_property(cls, owner, folio_property_id):
        folio_property_dict = super().get_user_object(PortFolio.table_name, owner, folio_property_id)
        print("DSDSDSDS<><><> get_folio_property:  = folio_property_dict", folio_property_dict)
        # folio_property = folio_property_dict.get('folio_property')
        folio_property = PortFolio.from_dict(folio_property_dict)
        print("DSDSDSDS<><><> get_folio_property:  = folio_property", folio_property)

        return folio_property


    @classmethod
    def delete_folio_property(cls, owner, folio_property_id):
        print("DSDSDSDS<><><> delete_folio_property: id = ", folio_property_id)
        #For now, the only reports accessible to a particular user are those for which it is the owner
        super().delete(PortFolio.table_name, owner, folio_property_id)

    def save(self):
        print("DSDSDSDS<><><> save __dict__ = ", self.__dict__)
        return super().save(PortFolio.table_name, self.__dict__)