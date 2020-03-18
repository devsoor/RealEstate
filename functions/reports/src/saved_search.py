from datetime import datetime
from user_object import UserObject
from enum import Enum
import uuid

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

class SavedSearch(UserObject):
    table_name = "SavedSearches"

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
    def create(cls, owner, data:dict):
        s = cls()
        if not owner:
            raise ValueError('Owner is required')        
        if not data.get('name'):
            raise ValueError('Name is required')

        s.id = str(uuid.uuid4())
        s.owner = owner
        s.created_at = datetime.now().isoformat()

        s.name = data.get('name')
        s.query = data.get('query')
        s.assumptions = data.get('assumptions')
        s.recipient = data.get('recipient')
        s.__update_email_settings__(data.get('email_enabled'), data.get('email_frequency'), data.get('email_day_of_week'))
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

    def update_settings(self, new_settings):
        new_name = new_settings.get('name')
        if not new_name:
            raise ValueError('Name is required')
        self.name = new_name

        self.__update_email_settings__(new_settings.get('email_enabled'), new_settings.get('email_frequency'), new_settings.get('email_day_of_week'))

    @classmethod
    def get_saved_searches_for_user(cls, user):
        #For now, the only saved searches accessible to a particular user are those for which it is the owner
        saved_searches = super().get_user_objects_for_user(SavedSearch.table_name, user)
        saved_searches.sort(key=lambda x: x.get("created_at"), reverse=True)
        for search_dict in saved_searches:
            search_dict['description'] = SavedSearch.get_criteria_description(search_dict.get('query'))
        return saved_searches

    @classmethod
    def get_saved_search(cls, owner, saved_search_id):
        saved_search_dict = super().get_user_object(SavedSearch.table_name, owner, saved_search_id)
        saved_search = SavedSearch.from_dict(saved_search_dict)
        return saved_search


    @classmethod
    def delete_saved_search(cls, owner, saved_search_id):
        #For now, the only reports accessible to a particular user are those for which it is the owner
        super().delete(SavedSearch.table_name, owner, saved_search_id)

    def save(self):
        return super().save(SavedSearch.table_name, self.__dict__)

    @classmethod
    def __create_range_description__(cls, query, min, max, field, is_currency=False, greater_than_text='greater than', less_than_text='less_than', between_text='between'):
        minValue = query.get(min)
        maxValue = query.get(max)
        if is_currency:
            minValue = '${:,.0f}'.format(int(minValue)) if minValue else minValue
            maxValue = '${:,.0f}'.format(int(maxValue)) if maxValue else maxValue
        if minValue and not maxValue:
            return f'{field} {greater_than_text} {minValue}'
        if maxValue and not minValue:
            return f'{field} {less_than_text} {maxValue}'
        if maxValue and minValue:
            return f'{field} {between_text} {minValue} and {maxValue}'
        return None

    @classmethod
    def get_criteria_description(cls, query):
        description = []

        search_type = query.get('searchType', 'location')

        if search_type == 'location':
            locations = query.get("locations")
            if locations:
                locationLists = {}
                for loc in locations:
                    locType = loc.get("type", "Locations").capitalize()
                    values = locationLists.get(locType, [])
                    values.append(loc['value'])
                    locationLists[locType] = values
                for locType, vals in locationLists.items():
                    description.append(locType + ": " + ",".join(vals))
            if query.get("address"):
                description.append("Address: " + query["address"])
            if query.get("city"):
                description.append("City: " + query["city"])
            if query.get("zipcode"):
                description.append("Zipcode: " + query["zipcode"])
            if query.get("county"):
                description.append("County: " + query["county"])
            if query.get("listing_id"):
                description.append("MLS ID: " + query["listing_id"])

        if search_type == "ids":
            locations = query.get("ids")
            if locations:
                description.append("MLS IDs: " + ",".join(locations.split()))

        if search_type == "poi":
            poi = query.get("poi")
            distance = query.get("distance", 2)
            if poi and distance:
                poiName = poi.get('name', '')
                description.append(f'Within {distance} miles of {poiName}')

        if query.get("ptype"):
            description.append('Propery Type: ' + query["ptype"])
        if query.get("style"):
            styles = list(filter(len, query["style"]))
            if styles:
                named_styles = []
                for style in styles:
                    named_styles.append(mpStyleNameDir.get(int(style)))
                description.append('Propery Styles: ' + ",".join(named_styles))

        # filter for price range
        price_description = SavedSearch.__create_range_description__(query, "min_price", "max_price", "Price", True)
        if price_description:
            description.append(price_description)

        # filter for bank owned
        bank_owned = query.get("bank_owned", '').lower()
        if bank_owned == "only":
            description.append('Only Bank-Owned Properties')
        elif bank_owned == "exclude":
            description.append('Exclude Bank-Owned Properties')
        
        # filter for short sale
        short_sale = query.get("short_sale", '').lower()
        if short_sale == "only":
            description.append('Only Short Sale Properties')
        elif short_sale == "exclude":
            description.append('Exclude Short Sale Properties')
        
        # filter for fixer upper
        fixer = query.get("fixer", '').lower()
        if fixer == "only":
            description.append('Only Fixer Properties')
        elif fixer == "exclude":
            description.append('Exclude Fixer Properties')

        # filter for new construction
        new_construction = query.get("new_construction", '').lower()
        if new_construction == "only":
            description.append('Only New Construction')
        elif new_construction == "exclude":
            description.append('Exclude New Construction')

        # filter for interior features
        interior_features = query.get("features")
        if interior_features:
            description.append('Interior Features: ' + ",".join(interior_features))

        # filter for days on market
        days_on_market_description = SavedSearch.__create_range_description__(query,"min_days_on_market", "max_days_on_market", "List date")
        if days_on_market_description:
            description.append(days_on_market_description)


        # filter for num beds
        bed_description = SavedSearch.__create_range_description__(query, "min_beds", "max_beds", "# Bedrooms")
        if bed_description:
            description.append(bed_description)

        # filter for num baths
        bath_description = SavedSearch.__create_range_description__(query, "min_baths", "max_baths", "# Baths")
        if bath_description:
            description.append(bath_description)

        # filter for built date
        year_built_description = SavedSearch.__create_range_description__(query, "built_after", "built_before", "Built", False, "after", "before", "between")
        if year_built_description:
            description.append(year_built_description)

        # filter for sqft
        sqft_desc = SavedSearch.__create_range_description__(query, "min_sqft", "max_sqft", "# SQFT")
        if sqft_desc:
            description.append(sqft_desc)

        # filter for lot size
        lot_size_desc = SavedSearch.__create_range_description__(query, "min_lot", "max_lot", "Lot Size")
        if lot_size_desc:
            description.append(lot_size_desc)

        # filter for hoa dues
        hoa_desc = SavedSearch.__create_range_description__(query, "min_hoa", "max_hoa", "HOA Dues", True)
        if hoa_desc:
            description.append(hoa_desc)

        if query.get("include_pending"):
            description.append("Include Pending")

        if not len(description):
            description.append("All Properties")

        return description