from datetime import datetime
import pytz
from elasticsearch_dsl import DocType, Document, InnerDoc, Date, Float, Double, Integer,Nested, Keyword, Text, GeoPoint, connections
from elasticsearch_dsl.analysis import normalizer

def xval(adict, field):
    value = adict.get(field)
    return '' if value is None else str(value)

lowercase = normalizer('lowercase_normalizer',
    filter=['lowercase']
)

mpStatusNameDir = {'A':'Active','P':'Pending','S':'Sold'}
styleNameDir = {
		10:'1 Story',
		16:'1 Story with Basement',
		11:'1 1/2 Story',
		17:'1 1/2 Story with Basement',
		12:'2 Story',
		18:'2 Stories with Basement',
		13:'Tri-level',
		14:'Split Level',
		15:'Multi-level',
		20:'Manufactured Single-wide',
		21:'Manufactured Double-wide',
		22:'Manufactured Triple-wide',
		24:'Floating Home/On-Water Residence',
		30:'Condo (1 Level)',
		31:'Condo (2 Levels)',
		34:'Condo (3 Levels)',
		32:'Townhouse',
		33:'Co-op'
}
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

class Unit(InnerDoc):
    sqft = Integer()            # also called 'fave_property_size', 'wpcf-rp-property-size'
    bedrooms = Float()          # also called 'fave_property_bedrooms'
    bathrooms = Float()         # also called 'fave_property_bathrooms'

class Property(Document):
    class Index:
        index = 'property'
        name = 'property'
    
    created_at = Date()
    
    unique_id = Keyword(normalizer=lowercase)

    listing_id = Keyword(normalizer=lowercase)      # also called 'fave_property_id', 'wpcf-rp-listing-id'
    mls_vendor = Keyword(normalizer=lowercase)      # also called 'wpcf-rp-mls-vendor'
    property_type = Keyword(normalizer=lowercase)

    description = Text()        # also called 'post_content'

    address = Text()         # also called 'fave_property_address', 'fave_property_map_address', 'wpcf-rp-address'
    street_address = Keyword(normalizer=lowercase)  # also called 'wpcf-rp-street-address'
    location = GeoPoint()        # also called 'fave_property_location'   {Latitude},{Longitude}',
    lat = Double()              # also called 'houzez_geolocation_lat', 'wpcf-rp-lat'
    lon = Double()              # also called 'houzez_geolocation_long', 'wpcf-rp-long'
    city = Keyword(normalizer=lowercase)
    county = Keyword(normalizer=lowercase)
    state = Keyword(normalizer=lowercase)
    zipcode = Keyword(normalizer=lowercase)         # also called 'fave_property_zip', 'wpcf-rp-zipcode'
    country = Keyword(normalizer=lowercase)         # also called 'fave_property_country'

    year_built = Integer()      # also called 'fave_property_year', 'wpcf-rp-year-built'
    effective_year_built = Integer() 
    effective_year_built_source = Keyword(normalizer=lowercase)
    price = Float()             # also called 'fave_property_price', 'wpcf-rp-price'
    original_price = Float()    # also called 'wpcf-rp-original-price'

    sqft = Integer()            # also called 'fave_property_size', 'wpcf-rp-property-size'
    lot_size = Integer()        # also called 'wpcf-rp-lot-size'
    bedrooms = Float()          # also called 'fave_property_bedrooms'
    bathrooms = Float()         # also called 'fave_property_bathrooms'
    interior_features = Keyword(normalizer=lowercase)   # interior features
    number_of_units = Integer()
    units = Nested(Unit)

    listing_status = Keyword()  # also called 'wpcf-rp-listing-status'
    
    list_date = Date()       # also called 'wpcf-rp-update-date'
    list_date_received = Date()
    ####listing_restrictions = Text ()  # also called 'wpcf-rp-listing-restr'

    building_condition = Keyword(normalizer=lowercase)
    parq = Keyword(normalizer=lowercase) # Third Party Approval Required (A=None, B=Other, C=Short Sale)
    breo = Keyword(normalizer=lowercase) # Bank/REO Owned (Y or N)
    new_construction = Keyword(normalizer=lowercase) # New Construction (Y or N)
	### rp_update_date=>{UpdateDate},

    # listing office
    listing_office_id = Keyword(normalizer=lowercase)       # also called 'wpcf-listing-office-id'
    listing_office_name = Text()        # also called 'wpcf-listing-office-name'
    listing_office_phone = Text()       # also called 'wpcf-listing-office-phone'
    listing_office_email = Keyword(normalizer=lowercase)    # also called 'wpcf-listing-office-email'
    listing_office_website = Keyword(normalizer=lowercase)  # also called 'wpcf-listing-office-website'

    # listing agent
    listing_agent_id= Keyword(normalizer=lowercase)             
    listing_agent_name = Text()
    listing_agent_phone = Text()

    # co-listing office
    co_listing_office_id = Keyword(normalizer=lowercase)
    co_listing_office_name = Text()
    co_listing_office_phone = Text()
    co_listing_office_email = Keyword(normalizer=lowercase) 
    co_listing_office_website = Keyword(normalizer=lowercase) 

    # co-listing agent
    co_listing_agent_id = Keyword(normalizer=lowercase)
    co_listing_agent_name = Text()
    co_listing_agent_phone = Text()

    # selling office
    selling_office_id = Keyword(normalizer=lowercase)
    selling_office_name = Text()
    selling_office_phone = Text()
    selling_office_email = Keyword(normalizer=lowercase)
    selling_office_website = Keyword(normalizer=lowercase) 

    # selling agent
    selling_agent_id = Keyword(normalizer=lowercase) 
    selling_agent_name = Text()
    selling_agent_phone = Text()

    # co-selling office
    co_selling_office_id = Keyword(normalizer=lowercase)
    co_selling_office_name = Text()
    co_selling_office_phone = Text()
    co_selling_office_email = Keyword(normalizer=lowercase)
    co_selling_office_website = Keyword(normalizer=lowercase)

    # co-selling agent
    co_selling_agent_id = Keyword(normalizer=lowercase)
    co_selling_agent_name = Text()
    co_selling_agent_phone = Text()

    hoa_dues = Float()

    # cma
	# rp_cma_cash_flow=>{CMA_CashFlow},
	# rp_cma_cap_rate=>{CMA_CapRate},
	# rp_cma_rent_to_value=>{CMA_RentToValue},
	# rp_cma_market_value=>{CMA_MarketValue},
	# rp_cma_success_criteria=>{CMA_SuccessCriteria},
	# rp_cma_criteria_threshold=>{CMA_CriteriaThreshold},
	# rp_cma_criteria_result=>{CMA_CriteriaResult},
	# rp_cma_results=>{CMA_Results},

    mp_status = Keyword()
    mp_status_name = Keyword()
    status_date = Date()
    update_date =  Date()
    selling_date = Date()
    pending_date = Date()
    listing_price = Float()
    selling_price = Float()
    purchase_price = Float()
    style = Integer()
    style_name = Keyword()
    mp_style = Integer()
    mp_style_name = Keyword()
    price_sqft = Float()
    cdom = Integer()

    # display config options
    property_map = Integer()    # also called 'fave_property_map'
    property_map_street_view = Keyword(normalizer=lowercase)    # also called 'fave_property_map_street_view'
    agent_display_option = Keyword(normalizer=lowercase)   # also called 'fave_agent_display_option'

    image_count = Integer()
    images = Keyword()      # list of image urls
    thumbnail = Keyword()   # thumbnail url


    def save(self, ** kwargs):
        self.created_at = datetime.now()
        return super(Property, self).save(** kwargs)

    def add_image_paths(self, active_count, availability):
        if (active_count > 0):
            availability = 'A'

        if (active_count > 0 and availability == 'A'):
            self.images = []
            self.image_count = active_count

            # set image paths
            image_base_format = '/images/{ptype}/active/{ln}/nwmls_{ptype}_{ln}_'.format(ln=self.listing_id, ptype=self.property_type.lower())
            image_url_format = image_base_format + '{imgnum:02d}.jpg'
                
            for i in range(active_count):
                image_path = image_url_format.format(imgnum=i)
                self.images.append(image_path)
        else:
            print("No image files available")
            self.images = []
            self.image_count = active_count

    def to_dict(self):
        d = super().to_dict()
        return d

    @classmethod
    def from_dict(cls, adict):
        unique_id='nwmls-' + str(adict['LN'])

        # if property already exists, then get the existing object to edit
        # otherwise, create a new one
        mls_prop = Property.get(id=unique_id, ignore=404)
        if (mls_prop is None):
            mls_prop = Property(unique_id=unique_id,
                mls_vendor='nwmls', ## CONSTANT
                listing_id=adict['LN']
            )
        
        mls_prop.property_type = adict.get('PTYP')

        #	'A'=>'Active',	'P'=>'Pending', 'S'=>'Sold', 'U'=>'Unlisted'
        mls_prop.listing_status = adict.get('mpStatus')
        mls_prop.mp_status = adict.get('mpStatus')
        mls_prop.mp_status_name = mpStatusNameDir.get(mls_prop.mp_status)
        mls_prop.description=adict['MR']
        mls_prop.city=adict['CIT']
        mls_prop.state=adict['STA']
        mls_prop.zipcode=adict['ZIP']
        mls_prop.county=adict['COU']
        mls_prop.country='US' ## CONSTANT

        mls_prop.style=adict['STY']
        mls_prop.style_name = styleNameDir.get(mls_prop.style)
        mls_prop.mp_style=adict['mpStyle']
        mls_prop.mp_style_name = mpStyleNameDir.get(mls_prop.mp_style)
        mls_prop.building_condition=adict['BDC']
        mls_prop.parq=adict['PARQ']
        mls_prop.breo=adict['BREO']
        mls_prop.new_construction = adict['NewConstruction']

        features = adict.get('FEA')
        if (features):
            mls_prop.interior_features = features.split("|")

        # format the street address and full address
        s = " "
        address_parts = (
            xval(adict, 'HSN'), 
            xval(adict, 'DRP'), 
            xval(adict, 'STR'), 
            xval(adict, 'SSUF'), 
            xval(adict, 'DRS'),
            'Unit ' + xval(adict, 'UNT') if xval(adict, 'UNT') else '') # This is sequence of strings.

        mls_prop.street_address = s.join(address_parts)
        # street_address_format = '{HSN} {DRP} {STR} {SSUF} {DRS} {UNT}'
        # mls_prop.street_address = street_address_format.format(
        #         HSN=xval(adict, 'HSN'), 
        #         DRP=xval(adict, 'DRP'), 
        #         STR=xval(adict, 'STR'), 
        #         SSUF=xval(adict, 'SSUF'), 
        #         DRS=xval(adict, 'DRS'),
        #         UNT='Unit ' + xval(adict, 'UNT') if xval(adict, 'UNT') else '').strip()
        
        full_address_format = '{st_add}, {CIT} {STA} {ZIP}'
        mls_prop.address = full_address_format.format(
            st_add=mls_prop.street_address, 
            CIT=xval(adict, 'CIT'), 
            STA=xval(adict, 'STA'), 
            ZIP=xval(adict, 'ZIP'))
        mls_prop.lat = adict.get('LAT')
        mls_prop.long = adict.get('LONG')
        mls_prop.location = [mls_prop.long, mls_prop.lat]   # geo-point expressed as an array with format [lon, lat]
        mls_prop.year_built = adict.get('YBT')
        mls_prop.effective_year_built = adict.get('EffectiveYearBuilt')
        mls_prop.effective_year_built_source = adict.get('EffectiveYearBuiltSource')
        mls_prop.price = adict.get('LP')
        mls_prop.selling_price = adict.get('SP')
        mls_prop.original_price = adict.get('OLP')

        mls_prop.sqft = adict.get('ASF')
        mls_prop.lot_size = adict.get('LSF')
        mls_prop.bedrooms = adict.get('BR')
        mls_prop.bathrooms = adict.get('BTH')

        if (mls_prop.property_type == 'MULT'):
            try:
                total_sqft_for_units = 0
                mls_prop.units = []
                mls_prop.number_of_units = adict.get('NOU')
                max_supported_units = 6
                for unit_num in range(1, max_supported_units+1):
                    bed = adict.get(f'BR{unit_num}')
                    bath = adict.get(f'BA{unit_num}')
                    sqft = adict.get(f'SF{unit_num}')
                    total_sqft_for_units += int(sqft)
                    if (bed > 0 or bath > 0):
                        mls_prop.units.append(Unit(bedrooms=bed, bathrooms=bath, sqft=sqft))
                
                if not mls_prop.sqft:
                    mls_prop.sqft = total_sqft_for_units
            except:
                print('error indexing units')

        mls_prop.cdom = adict.get('CDOM')
        mls_prop.update_date = __parse_datetime__(adict.get('UD'))
        mls_prop.list_date = __parse_datetime__(adict.get('LD'))
        mls_prop.list_date_received = __parse_datetime__(adict.get('LDR'))
        mls_prop.status_date = __parse_datetime__(adict.get('SDT'))
        mls_prop.selling_date =  __parse_datetime__(adict.get('CLO'))
        # mls_prop.pending_date = adict.get('PDR').date() if adict.get('PDR') and adict.get('PDR') != '1800-01-01 00:00:00' else None

        mls_prop.listing_office_id = adict.get('LO')
        mls_prop.listing_office_name = adict.get('LOName')
        mls_prop.listing_office_phone = adict.get('LOPhone')
        mls_prop.listing_office_email = adict.get('LOEmail')
        mls_prop.listing_office_website = adict.get('LOWebsite')

        mls_prop.hoa_dues = adict.get('HOD')

        num_pics = adict.get('ActiveCount')
        availability = adict.get('Availability')
        if (num_pics):
            mls_prop.add_image_paths(num_pics, availability)
        # set the unique property id
        mls_prop.meta.id = unique_id

        return mls_prop

def __parse_datetime__(datestr:str):
    if datestr:
        timezone = pytz.timezone("America/Los_Angeles")
        d = datetime.strptime(datestr, '%Y-%m-%d %H:%M:%S.%f')
        d = timezone.localize(d)
        return d
    return None