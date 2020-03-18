import json
from enum import Enum
from datetime import datetime, timedelta
import pytz
import dateutil.tz
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import MultiMatch, Match, Term, Terms, GeoDistance, Range, Bool
from cma.rent_calculator import RentCalculator
from mlsproperty import Property
from statistics import mean

# Allow multiple success criteria designations via map
success_criteria_map = {
    'cash_flow_criteria': 'cash_flow_criteria', 'Cash Flow': 'cash_flow_criteria',
    'cap_rate_criteria': 'cap_rate_criteria', 'Cap Rate': 'cap_rate_criteria',
    'rent_to_value_criteria': 'rent_to_value_criteria', 'Rent-to-Value': 'rent_to_value_criteria'
}

def ts_now():
    return datetime.utcnow().replace(tzinfo=dateutil.tz.tzutc())

class CompProperty(object):
    # Listing that is source of property data
    listing = None
    
    # Key fields of property
    ln = 0
    lat = 0.0
    lon = 0.0
    ptype = None
    address = None
    mp_status = None
    mp_status_name = None
    listing_date = None
    selling_date = None
    update_date = None
    listing_price = 0.0
    original_price = 0.0
    selling_price = 0.0
    price = 0.0  # Price to use for analysis
    year = 0  # Year built, or EffectiveYearBuilt (if provided)
    style =None	# this is the MLS style code
    style_name = None
    mp_style = 0  # this is the internal mpStyle, not the MLS style
    mp_style_name = None
    bed = 0.0
    bath = 0.0
    zipcode = 0
    sqft = 0
    price_sqft = 0.0  # Price per sq ft
    adj = 0.0  # Adjustment to price ((this sqft - subject sqft) * price/sqft)
    days = 0
    miles = 0.0  # distance (miles) from subject property
    cma_score = 0.0  # Weighted score reflecting how closely it matches subject prop
    market_value = 0.0

    def __init__(self, listing, miles):
        self.listing = listing
        self.ln = listing.listing_id
        self.ptype = listing.property_type
        self.address = listing.address
        self.lat = listing.lat
        self.lon = listing.long
        self.mp_status = listing.listing_status
        self.mp_status_name = listing.mp_status_name
        self.listing_date = listing.list_date_received if self.ptype.lower() == "rent" else listing.list_date
        self.update_date = listing.update_date
        self.selling_date = listing.selling_date
        if listing.price: self.listing_price = float(listing.price)
        if listing.selling_price: self.selling_price = float(listing.selling_price)
        self.original_price = float(self.listing_price) if self.ptype.lower() == "rent" else listing.original_price
        self.price = float(self.selling_price) if self.mp_status == 'S' else self.listing_price
        self.year = listing.year_built
        self.days = self.compute_prop_days()
        self.miles = float(miles)
        self.style = listing.style
        self.style_name = listing.style_name
        self.mp_style = listing.mp_style
        self.mp_style_name = listing.mp_style_name
        self.bed = float(listing.bedrooms)
        self.bath = float(listing.bathrooms)
        self.zipcode = listing.zipcode
        self.sqft = listing.sqft
        self.price_sqft = ( float(self.price / self.sqft) ) if self.sqft > 0 else 0

        # Use EffectiveYearBuilt for 'year' if it's provided & valid, and it comes from Public Records
        if (listing.effective_year_built):
            eyb = listing.effective_year_built
            eybsrc = listing.effective_year_built_source
            if (eyb and int(eyb) > 1800 and eybsrc.lower() == 'pr'):
                self.year = int(eyb)
    # end __init__

    def compute_prop_days(self):
        days = 0
        
        prop_datetime = self.selling_date if self.mp_status == 'S' else self.listing_date
        now = ts_now()
        
        prop_datetime = prop_datetime.astimezone(pytz.timezone('US/Pacific'))
        # Get difference between prop date and today
        days = abs(prop_datetime-now).days
        
        return days


class MPSubjectProperty(object):
    resi_style_matches = [
        [0],		# Invalid style
        [1,2],		# SFR matches SFR and Town House
        [2,1],		# Town House matches TH and SFR
        [3],		# Condo
        [4],		# Manufactured
        [0],		# Mobile Home Park
        [0],		# Farm & Ranch
        [0],		# Multi Family
        [0],		# Apartments
        [9],		# Floating Home
        [0],		# Co-Op
        [0],		# Commercial
        [0]			# Recreational
    ]

    cond_style_matches = [
        [0],		# Invalid style
        [1],		# SFR
        [2,3],		# Town House matches TH and Condo
        [3,2],		# Condo matches Condo and TH
        [0],		# Manufactured
        [0],		# Mobile Home Park
        [0],		# Farm & Ranch
        [0],		# Multi Family
        [0],		# Apartments
        [0],		# Floating Home
        [10],		# Co-Op
        [0],		# Commercial
        [0]			# Recreational
    ]

    manu_style_matches = [
        [0],		# Invalid style
        [0],		# SFR
        [0],		# Town House
        [0],		# Condo
        [4],		# Manufactured
        [0],		# Mobile Home Park
        [0],		# Farm & Ranch
        [0],		# Multi Family
        [0],		# Apartments
        [0],		# Floating Home
        [0],		# Co-Op
        [0],		# Commercial
        [0]			# Recreational
    ]

    rent_style_matches = [
        [0],		# Invalid style
        [1,2],		# SFR matches SFR and TH
        [2,3],		# Town House matches TH and Condo
        [3,2],		# Condo matches Condo and TH
        [4],		# Manufactured
        [5],		# Mobile Home Park
        [6],		# Farm & Ranch
        [1,7],		# Multi Family
        [8],		# Apartments
        [9],		# Floating Home
        [10],		# Co-Op
        [11],		# Commercial
        [12]		# Recreational
    ]
    mult_style_matches = [
        [0],		# Invalid style
        [0],		# SFR
        [0],		# Town House
        [0],		# Condo
        [0],		# Manufactured
        [0],		# Mobile Home Park
        [0],		# Farm & Ranch
        [1,7],		# Multi Family
        [0],		# Apartments
        [0],		# Floating Home
        [0],		# Co-Op
        [0],		# Commercial
        [0]			# Recreational
    ]

    type_style_matches = {
        'resi':resi_style_matches,
        'cond':cond_style_matches,
        'manu':manu_style_matches,
        'rent':rent_style_matches,
        'mult':mult_style_matches }

    # The area comps used for finding matching CMA comps.
    area_comps = None
    num_area_comps = 0

    # The CMA comps are those properties (from the area comps), that match the CMA search criteria and scored highest.
    cma_comps = None
    num_cma_comps = 0

    # The area rentals used for finding matching CMA rentals.
    area_rentals = None
    num_area_rentals = 0
    rental_source = None

    # The CMA rentals are those rentals (from the area rentals), that match the CMA search criteria and scored highest.
    cma_rentals = None
    num_cma_rentals = 0

    # Listing that is source of subject property data
    listing = None

    # Subject Property Data
    ln = 0
    ptype = None
    address = None
    mp_status = None
    mp_status_name = None
    listing_date = None
    update_date = None
    selling_date = None
    listing_price = 0.0
    selling_price = 0.0
    original_price = 0.0
    lat = 0.0
    lon = 0.0
    year = 0		# Year built, or EffectiveYearBuilt (if provided)
    style = None	# this is the MLS style code
    style_name = None
    mp_style = 0  # this is the internal mpStyle, not the MLS style
    mp_style_name = None
    bed = 0.0
    bath = 0.0
    zipcode = 0
    monthly_dues = 0.0  # monthly HOA dues
    sqft = 0
    price_sqft = 0.0  # Price per sq ft
    rent_sqft = 0.0
    purchase_price = 0.0
    
    # Fixed assumptions (non user input)
    Amortization_yrs = 30.0
    Payments_yr      = 12.0

    # CMA User Values
    Improvements = 0.0
    Downpayment_Percent = 0.0
    InsuranceRate = 0.0025
    HOA_yr = 0.0
    MortgageInterest_Percent = 0.045
    PropertyTaxRate_Percent  = 0.01025
    Maintenance_Percent      = 0.005
    VacancyRate_Percent      = 0.08
    ClosingCosts_Percent     = 0.02
    PropertyMgmt_Percent     = 0.0
    CompMaxDist              = 0
    CompMaxDays              = 0
    CompMaxNumProps          = 0
    RentalMaxDist            = 0
    RentalMaxDays            = 0
    RentalMaxNumProps        = 0

    # CMA Calculations
    Calc_GrossSchedIncome = 0.0
    Calc_ClosingCosts = 0.0
    Calc_Downpayment = 0.0
    Calc_LoanAmount = 0.0
    Calc_PurchaseEquity = 0.0
    Calc_MarketEquity = 0.0
    Calc_AfterRepairValue = 0.0
    Calc_EffectiveGrossIncome = 0.0
    Calc_MortgagePerMonth = 0.0
    Calc_NetOperatingIncome = 0.0
    Calc_PropertyTaxes = 0.0
    Calc_Insurance = 0.0
    Calc_Maintenance = 0.0
    Calc_PropertyMgmt = 0.0
    Calc_OperatingExpenses = 0.0
    Calc_DebtCoverageRatio = 0.0
    Calc_ExpenseRatio = 0.0
    Calc_NetIncomeMultiplier = 0.0
    Calc_GrossRentMultiplier = 0.0
    
    # Current Investment Values
    Current_GrossSchedIncome = 0.0
    Current_TotalMonthlyIncome = 0.0
    Current_EffectiveGrossIncome = 0.0
    Current_GrossRentMultiplier = 0.0
    Current_NetOperatingIncome = 0.0
    Current_OperatingExpenses = 0.0
    Current_Insurance = 0.0
    Current_ExpensesOther = 0.0
    Current_PropertyMgmt = 0.0
    Current_PropertyTaxes = 0.0
    Current_WaterSewerGarbage = 0.0
    Current_HODAnnual = 0.0
    Current_NetIncomeMultiplier = 0.0
    Result_Current_CapRate = 0.0
    Result_Current_CashFlow = 0.0
    Result_Current_CashFlow_Monthly = 0.0
    Result_Current_RentValueRatio = 0.0

    # CMA Results
    Result_EstMarketValue = 0.0
    Result_EstMonthlyRent = 0.0
    Result_CashIn = 0.0
    Result_CapRate = 0.0
    Result_CashFlow = 0.0
    Result_CashFlow_Monthly = 0.0
    Result_RentValueRatio = 0.0
    Result_CashOnCashReturn = 0.0
    
    # CMA Success Criteria
    success_criteria = None
    criteria_name = None
    criteria_result = None
    criteria_threshold = 0.0
    criteria_value = 0.0
    criteria_type = None

    error = None

    # MultiFamily Rents
    number_of_units = None
    Units = None
    max_rent_diff = 0.0

    # Purchase Price type to use (listing_price, est_market_value, or user_provided)
    purchase_price_type = "listing_price"

    def __init__(self, listing, req_param_values, listing_details):  
        self.listing = listing
        self.listing_details = listing_details

        if (self.listing_details and listing.mp_style == 7):
            self.number_of_units = self.listing_details.get('NOU')
            self.Units = []
            for unit_num in range(1, 7):
                unit_current_rent = self.listing_details[f'RN{unit_num}']
                unit_bed = float(self.listing_details[f'BR{unit_num}'])
                unit_bath = float(self.listing_details[f'BA{unit_num}'])
                unit_sqft = self.listing_details[f'SF{unit_num}']
                unit_desc = self.listing_details[f'UN{unit_num}']

                if unit_bed or unit_bath:
                    unit = {
                        'UnitNum': unit_num,
                        'Description': unit_desc,
                        'CurrentRent': unit_current_rent,
                        'EstMonthlyRent': 0.0,
                        'bed': unit_bed,
                        'bath': unit_bath,
                        'sqft': unit_sqft,
                    }
                    user_input = req_param_values.get('monthly_rent_unit'+str(unit_num))
                    if (user_input):
                        unit['EstMonthlyRent'] = float(user_input)

                    self.Units.append(unit)

            # we need at least 1 unit so the user can enter something
            if len(self.Units) == 0:
                unit_num=1
                unit = {
                        'UnitNum': unit_num,
                        'Description': '',
                        'CurrentRent': 0.0,
                        'EstMonthlyRent': 0.0,
                        'bed': 0,
                        'bath': 0,
                        'sqft': 0,
                    }
                user_input = req_param_values.get('monthly_rent_unit'+str(unit_num))
                if (user_input):
                    unit['EstMonthlyRent'] = float(user_input)
                self.Units.append(unit)

            self.Current_TotalMonthlyIncome = self.listing_details['TIN']
            self.Current_GrossSchedIncome = self.listing_details['GSI']
            self.Current_EffectiveGrossIncome = self.listing_details['GAI'] # !!!!!
            self.Current_GrossRentMultiplier = float(self.listing_details['GRM'])/100
            self.Current_NetOperatingIncome = self.listing_details['NOI']
            self.Current_OperatingExpenses = self.listing_details['EXP']   # Total Expenses
            self.Current_Insurance = self.listing_details['INS']
            self.Current_ExpensesOther = self.listing_details['OTX']
            self.Current_PropertyMgmt = 0  ## NOT AVAILABLE??
            self.Current_PropertyTaxes = self.listing_details['TX']
            self.Current_WaterSewerGarbage = self.listing_details['WSG'] #Water Sewage Garbage
            self.Current_HODAnnual = self.listing_details['HOD']
            self.Current_VacancyRate = self.listing_details['VAC']
                        

        # Finish setup and perform all searches, matches, and computations if a valid listing was returned
        if (self.listing):
            listing = self.listing
            self.ln = listing.listing_id
            self.ptype = listing.property_type
            self.address = listing.address
            self.mp_status = listing.mp_status
            self.mp_status_name = listing.mp_status_name
            self.listing_date = listing.list_date
            self.update_date = listing.update_date
            self.selling_date = listing.selling_date
            if listing.price: self.listing_price = float(listing.price)
            if listing.selling_price: self.selling_price = float(listing.selling_price)
            if listing.original_price: self.original_price = float(listing.original_price)
            self.lat = listing.lat
            self.lon = listing.long
            self.year = listing.year_built
            self.style = listing.style
            self.style_name = listing.style_name
            self.mp_style = listing.mp_style
            self.mp_style_name = listing.mp_style_name
            self.bed = float(listing.bedrooms)
            self.bath = float(listing.bathrooms)
            self.zipcode = listing.zipcode
            self.sqft = listing.sqft
            self.purchase_price = float(self.selling_price) if self.mp_status == 'S' else self.listing_price
            self.price_sqft = ( float(self.purchase_price) / self.sqft ) if self.sqft > 0 else 0
            
            # Use EffectiveYearBuilt for 'year' if it's provided & valid, and it comes from Public Records
            if (listing.effective_year_built):
                eyb = listing.effective_year_built
                eybsrc = listing.effective_year_built_source
                if (eyb and int(eyb) > 1800 and eybsrc.lower() == 'pr'):
                    self.year = int(eyb)
            
            # Get monthly dues if available
            if (listing.hoa_dues):
                self.monthly_dues = float(listing.hoa_dues)

            # Use property monthly dues for HOA_yr (if provided),otherwise use from assumption data
            if (self.monthly_dues > 0.0):
                self.HOA_yr = self.monthly_dues * 12.0
            else:
                self.HOA_yr = float(req_param_values['hoa_yr'])

            # Assign various user supplied parameters to appropriate subject property members
            self.Improvements             = float(req_param_values['improvements'])
            self.Downpayment_Percent      = float(req_param_values['downpayment_percent_pcnt'])
            self.InsuranceRate            = float(req_param_values['insurance_rate_pcnt'])
            self.MortgageInterest_Percent = float(req_param_values['mortgage_interest_rate_pcnt'])
            self.PropertyTaxRate_Percent  = float(req_param_values['property_tax_rate_pcnt'])
            self.Maintenance_Percent      = float(req_param_values['maintenance_percent_pcnt'])
            self.VacancyRate_Percent      = float(req_param_values['vacancy_rate_pcnt'])
            self.ClosingCosts_Percent     = float(req_param_values['closing_costs_percent_pcnt'])
            self.PropertyMgmt_Percent     = float(req_param_values['property_mgmt_percent_pcnt'])
            self.Amortization_yrs         = float(req_param_values['amortization_yrs'])
            self.Payments_yr              = float(req_param_values['payments_yr'])
            self.CompMaxDist              = int(req_param_values['comp_max_dist'])
            self.CompMaxDays              = int(req_param_values['comp_max_days'])
            self.CompMaxNumProps          = int(req_param_values['comp_max_num_props'])
            self.RentalMaxDist            = int(req_param_values['rental_max_dist'])
            self.RentalMaxDays            = int(req_param_values['rental_max_days'])
            self.RentalMaxNumProps        = int(req_param_values['rental_max_num_props'])
            if req_param_values['monthly_rent']:
                self.Result_EstMonthlyRent    = float(req_param_values['monthly_rent'])

            # Get various user supplied parameters needed for criteria computations further down
            success_criteria_param = req_param_values['success_criteria']
            self.success_criteria = success_criteria_map.get(success_criteria_param, 'cash_flow_criteria')
            
            self.cash_flow_criteria = float(req_param_values['cash_flow_criteria'])
            self.cap_rate_criteria_pcnt = req_param_values['cap_rate_criteria_pcnt']
            self.rent_to_value_criteria_pcnt = req_param_values['rent_to_value_criteria_pcnt']
            
            if (self.success_criteria == 'cash_flow_criteria'):
                self.criteria_name = 'Cash Flow'
                self.criteria_threshold = self.cash_flow_criteria
                self.criteria_type = 'currency'
            elif (self.success_criteria == 'cap_rate_criteria'):
                self.criteria_name = 'Cap Rate'
                self.criteria_threshold = self.cap_rate_criteria_pcnt
                self.criteria_type = 'percent'             
            else:
                self.criteria_name = 'Rent-to-Value'
                self.criteria_threshold = self.rent_to_value_criteria_pcnt
                self.criteria_type = 'percent'
            
            # Get property match options and scoring weights from params
            self.comp_prop_match_options = req_param_values['comp_prop_match_options']
            self.rental_prop_match_options = req_param_values['rental_prop_match_options']
            self.comp_scoring_weights = req_param_values['comp_scoring_weights']
            self.rental_scoring_weights = req_param_values['rental_scoring_weights']

            # determine which purchase_price to use for calculations
            if (req_param_values['purchase_price_type']):
                self.purchase_price_type = req_param_values['purchase_price_type'].lower()
            if (req_param_values['purchase_price'] or self.purchase_price_type=='user_provided'):
                self.purchase_price_type = 'user_provided'
                self.purchase_price = float(req_param_values['purchase_price'])
        # end __init__

    def calculate_cma(self, market_value_option, debug=False):
        self.debug = debug
        # Get out if bad data for subject property
        if (self.sqft == 0 or self.purchase_price == 0):
            print('bad data for property.  Exiting')
            print('SQFT: ' + str(self.sqft) + " PRICE: " + str(self.purchase_price))
            if (not self.sqft):
                self.error = 'SQFT is 0'
            if (not self.purchase_price):
                self.error = 'Purchase price is 0'
            return

        # Get estimated market value.
        # The compute_cma_market_value() function returns the market
        # value or 0 if it can't be calculated.  The cma properties are also stored in this object.
        # This also scores & sorts all area comp properties.
        if (market_value_option):
            self.Result_EstMarketValue = self.compute_cma_market_value(self.comp_prop_match_options, self.comp_scoring_weights)
            if (self.purchase_price_type=='est_market_market' and self.Result_EstMarketValue):
                self.purchase_price = self.Result_EstMarketValue

        # Get estimated market rent via CMA Analysis if monthly rent not already provided.
        self.Result_EstMonthlyRent = self.calculate_estimated_rent()
        self.rent_sqft = ( float(self.Result_EstMonthlyRent) / self.sqft ) if self.sqft > 0 else 0

        # Calculate investor property analysis values if rent is non-zero
        if (self.Result_EstMonthlyRent > 0.0):
            # Perform final calcs based on estimated monthly rent and other financials
            self.calculate_property_investment_analysis()
            self.calculate_current_property_investment_analysis()
        
            # Store results of investment criteria (value, success/failure)
            if (self.success_criteria == 'cash_flow_criteria'):
                # use the monthly cash flow values
                self.criteria_result = 'Success' if (self.Result_CashFlow_Monthly - self.cash_flow_criteria) > 0.000001 else 'Failure'
                self.criteria_value = self.Result_CashFlow_Monthly
                # self.criteria_result = 'Success' if (self.Result_CashFlow - cash_flow_criteria) > 0.000001 else 'Failure'
                # self.criteria_value = self.Result_CashFlow
                
            elif (self.success_criteria == 'cap_rate_criteria'):
                self.criteria_result = 'Success' if (self.Result_CapRate - self.cap_rate_criteria_pcnt) > 0.000001 else 'Failure'
                self.criteria_value = self.Result_CapRate
            else:
                self.criteria_result = 'Success' if (self.Result_RentValueRatio - self.rent_to_value_criteria_pcnt) > 0.000001 else 'Failure'
                self.criteria_value = self.Result_RentValueRatio
        else:
            self.error = 'Estimated rent could not be determined.'


    def calculate_estimated_rent(self):
        print('calculating estimated rent')
        est_monthly_rent = 0.0
        style = self.style
        mp_style = self.mp_style
        mp_style_name = self.mp_style_name
        lat = self.lat
        lon = self.lon
        year = self.year
        sqft = self.sqft
        bed = self.bed
        bath = self.bath
        zipcode = self.zipcode
        address = self.address
        
        # if this is a multi-family home, then calculate estimated rent for each unit
        if mp_style == 7:
            est_monthly_rent = self.calculate_estimated_rent_for_units()
        # otherwise, calculate rent as usual
        else:
            if (self.Result_EstMonthlyRent == 0.0):
                # est_monthly_rent = self.compute_cma_market_rent(style, mp_style, lat, lon, year, sqft, bed, bath, self.rental_prop_match_options, self.rental_scoring_weights)
                # self.rental_source = "MLS"
                max_dist = self.rental_prop_match_options['MaxDist']
                days_old = self.rental_prop_match_options['MaxDays']
                comp_count = self.rental_prop_match_options['MaxNumProps']
                rent_data = RentCalculator().get_rent(address, zipcode, bed, bath, sqft, mp_style, days_old, comp_count)
                est_monthly_rent = rent_data['price']
                self.cma_rentals = rent_data.get('comps', [])
                self.rental_source = rent_data['source']
                # If estimated rent is still 0 (e.g. min # of CMA rentals not found) try getting estimated rent via rental stats data
                if (est_monthly_rent == 0.0):
                    # No valid rental price via MLS data, so try to get price via 3rd part API service
                    #print("Couldn't find rent in MLS, get it from 3rd party API")
                    #est_monthly_rent = RentCalculatorThirdParty().get_rental_rate(mp_style_name, address, sqft, bed, bath, self.rental_prop_match_options['MaxNumProps'])
                    #self.rental_source = "RealtyMole"
                    #if (est_monthly_rent == 0.0):
                    #print("Couldn't find rent in 3rd party API, get it from CSV")
                    # No valid rental price via 3rd party API, so try to get price via rental stats data
                    #est_monthly_rent = RentCalculator().get_rental_stats_price(zipcode, bed)
                            # Get values of property match options
                    # max_dist = self.rental_prop_match_options['MaxDist']
                    # days_old = self.rental_prop_match_options['MaxDays']
                    # comp_count = self.rental_prop_match_options['MaxNumProps']
                    # rent_data = RentCalculator().get_rent(address, zipcode, bed, bath, sqft, mp_style, days_old, comp_count)
                    # est_monthly_rent = rent_data['price']
                    # self.cma_rentals = rent_data.get('comps', [])
                    # self.rental_source = rent_data['source']

                    est_monthly_rent = self.compute_cma_market_rent(style, mp_style, lat, lon, year, sqft, bed, bath, self.rental_prop_match_options, self.rental_scoring_weights)
                    self.rental_source = "MLS"                    
                    

            else:
                est_monthly_rent = self.Result_EstMonthlyRent

        return est_monthly_rent

    def calculate_estimated_rent_for_units(self):
        print('calculating estimated rent for units')
        style = self.style
        mp_style = self.mp_style
        lat = self.lat
        lon = self.lon
        year = self.year
        zipcode = self.zipcode
        address = self.address

        total_est_monthly_rent = 0.0
        max_rent_diff = 0.0
        for unit in self.Units:
            unit_est_monthly_rent = unit['EstMonthlyRent']
            unit_bed = unit['bed']
            unit_bath = unit['bath']
            unit_sqft = unit['sqft']
            unit_current_rent = unit['CurrentRent']
            if not unit_est_monthly_rent:
                unit_est_monthly_rent = self.compute_cma_market_rent(style, mp_style, lat, lon, year, unit_sqft, unit_bed, unit_bath, 
                    self.rental_prop_match_options, self.rental_scoring_weights)

                if unit_est_monthly_rent:
                    print('Estimated rent for unit (using CMA): ' + str(unit_est_monthly_rent))

                # If estimated rent is still 0 (e.g. min # of CMA rentals not found) try getting estimated rent via rental stats data
                if (unit_est_monthly_rent == 0.0):
                    # No valid rental price via MLS data, so try to get price via rental stats data
                    max_dist = self.rental_prop_match_options['MaxDist']
                    days_old = self.rental_prop_match_options['MaxDays']
                    comp_count = self.rental_prop_match_options['MaxNumProps']
                    rent_data = RentCalculator().get_rent(address, zipcode, unit_bed, unit_bath, unit_sqft, mp_style, days_old, comp_count)

                    unit_est_monthly_rent = rent_data['price']
                    self.cma_rentals = rent_data.get('comps', [])
                    self.rental_source = rent_data['source']

                    print(f'Getting estimated rent from {self.rental_source}: {unit_est_monthly_rent}')

                rental_adjustment_mult = self.rental_scoring_weights.get('RentAdjustmentMult')
                # if an adjustment is provided for multifamily then use it
                if rental_adjustment_mult:
                    unit_est_monthly_rent = unit_est_monthly_rent * rental_adjustment_mult

                unit['EstMonthlyRent'] = unit_est_monthly_rent
            rent_diff = unit_est_monthly_rent - unit_current_rent
            rent_avg = mean([unit_est_monthly_rent, unit_current_rent])
            if self.debug and rent_avg:
                rent_diff_pct = rent_diff/rent_avg
                unit['RentDiff'] = rent_diff
                unit['RentDiffPercent'] = rent_diff_pct
                # we should only count it as max_diff if there is a current rent provided
                if unit_current_rent > 0:
                    max_rent_diff = max(rent_diff_pct, max_rent_diff)
            total_est_monthly_rent += unit_est_monthly_rent
        self.max_rent_diff = max_rent_diff
        return total_est_monthly_rent

    # ---------------------------------------------------------
    # The following function does 2 things:
    #   1) It finds and stores matching CMA properties.
    #   2) It computes and stores the market value via the 
    #       average sale price of those matching properties.
    # ---------------------------------------------------------
    def compute_cma_market_value(self, property_match_options, scoring_weights):        
        # Get area comp (SOLD) properties of the same type
        self.area_comps = MPSubjectProperty.retrieve_area_comp_properties(self.style,
            self.mp_style, self.lat, self.lon, self.year, self.sqft, self.bath, self.bed, self.ptype, property_match_options)
        self.num_area_comps = len(self.area_comps)

        # Get estimated market value via CMA Analysis if comps exist.
        if self.area_comps:
            # Perform CMA comp market analysis and get results
            area_comp_market = MPSubjectProperty.perform_cma_analysis(self.style, self.year, self.sqft, self.bed, self.bath, self.area_comps, 
                property_match_options, scoring_weights)
            
            # Store results and return market price
            market_value = area_comp_market['MarketValue']
            self.cma_comps = area_comp_market['MarketProperties']
            self.num_cma_comps = len(self.cma_comps)
            
            return market_value
        else:
            return 0.0

    # ---------------------------------------------------------
    # 	The following function does 2 things:
    # 		1) It finds and stores matching CMA rental properties.
    # 		2) It computes and stores the market rent via the
    # 		   average rental price of those matching properties.
    # ---------------------------------------------------------
    def compute_cma_market_rent(self, style, mp_style, lat, lon, year, sqft, bed, bath, property_match_options, scoring_weights):
        # Get area rental properties of the same type

        self.area_rentals = MPSubjectProperty.retrieve_area_rental_properties(style,
            mp_style, lat, lon, year, sqft, bath, bed, property_match_options)
        self.num_area_rentals = len(self.area_rentals)
                
        if (self.area_rentals):
            print('found ' + str(self.num_area_rentals) + ' matching rental comps')
            # Perform CMA rental market analysis and get results
            area_rental_market = MPSubjectProperty.perform_cma_analysis(style, year, sqft, bed, bath, self.area_rentals, property_match_options, scoring_weights)
            
            #  Store results and return market rent
            market_value = area_rental_market['MarketValue']
            self.cma_rentals = area_rental_market['MarketProperties']
            self.num_cma_rentals = len(self.cma_rentals)
            
            return market_value
        else:
            return 0.0

    # ---------------------------------------------------------//
    #
    #	Compute market price based on average price of area
    #  properties of similar type based on match parameters.
    #
    @classmethod
    def perform_cma_analysis(cls, style, year, sqft, bed, bath, area_props, property_match_options, scoring_weights):
        
        # Table used to get syle score code
        style_score_codes = {
            10:110,16:111,11:115,17:116,12:120,18:121,13:130,14:131,15:132,
            32:200,30:300,31:301,34:302,33:400,20:600,21:601,22:602,24:800,
            42:125,52:125,53:125,54:125
        }
        
        # Init counters and such
        prop_count = len(area_props)
        matching_props = []
        match_count = 0
        market_value = 0.0
        market_value_sum = 0.0
        
        # Maximum value for each lever (attribute of property that affects score), EXCEPT FOR STYLE
        max_lever = 10.0
        
        # Max value for STYLE lever
        max_style_lever = 1000.00
        
        # Special non-zero value that's close to zero, simply to prevent "divide by zero" exceptions
        close_to_zero = 0.0000000001

        # Get values of property match options
        max_dist = property_match_options['MaxDist']
        max_age_diff = property_match_options['MaxAgeDiff']
        max_days = property_match_options['MaxDays']
        max_sqft_diff = property_match_options['MaxSqftDiff']
        max_bed_diff = property_match_options['MaxBedDiff']
        max_bath_diff = property_match_options['MaxBathDiff']
        min_num_props = property_match_options['MinNumProps']
        max_num_props = property_match_options['MaxNumProps']

        # Get values of scoring weights
        dist_weight = scoring_weights['DistWeight']
        age_weight = scoring_weights['AgeWeight']
        days_weight = scoring_weights['DaysWeight']
        sqft_weight = scoring_weights['SqftWeight']
        bed_weight = scoring_weights['BedWeight']
        bath_weight = scoring_weights['BathWeight']
        style_weight = scoring_weights['StyleWeight']
        
        # Score factor is used to adjust lever value so attributes with outer values will result in
        # an appropriate minimum value.  Not applied to bed & bath due to their value range.
        score_factor = max_lever * 0.95
        
        # Get special style score code for subject property
        subject_ssc = style_score_codes.get(style)
        
        # Loop through each area property computing weighted score
        for prop in area_props:
            # Compute weighted score for each attribute (no score factor for bed & bath).
            # Note that bed & bath scores are computed against max+1, so that a difference
            # of 1 results in 50% of a full lever (attribute) score.
            dist_score = dist_weight * (max_lever - ((prop.miles / max_dist) * score_factor))
            age_score = age_weight * (max_lever - ((abs(prop.year - year) / max_age_diff) * score_factor))
            days_score = days_weight * (max_lever - ((prop.days / max_days) * score_factor))
            sqft_score = sqft_weight * (max_lever - ((abs(prop.sqft - sqft) / max_sqft_diff) * score_factor))
            bed_score = bed_weight * (max_lever - ((abs(prop.bed - bed) / (max_bed_diff + close_to_zero)) * score_factor))
            bath_score = bath_weight * (max_lever - ((abs(prop.bath - bath) / (max_bath_diff + close_to_zero)) * score_factor))
            
            # Style is different than the rest, so a special computation is used.
            prop_ssc = style_score_codes.get(prop.style)
            style_lever = max_style_lever - abs(subject_ssc - prop_ssc)
            style_score = style_lever
            
            # Compute final score
            prop.cma_score = style_score + dist_score + age_score + days_score + bed_score + bath_score + sqft_score

        # Sort the properties by their cma_score
        # usort($area_props, array('MP_Subject_Property', 'sort_properties_by_cma_score'));
        sorted_area_props = sorted(area_props, key=lambda prop: prop.cma_score, reverse=True)
            
        # Get number of properties to match (lesser of max_num_props and number of area_props)
        match_count = min(max_num_props, prop_count)
        
        # Loop over all area props computing values and assigning to match list (if appropriate)
        for index, prop in enumerate(area_props):
            prop.adj = (prop.sqft - sqft) * prop.price_sqft
            prop.market_value = prop.price - prop.adj
            
            # Add to average and CMA prop list only if within the match count
            if (index < match_count):
                market_value_sum += prop.market_value
                matching_props.append(prop)
        
        # If we have enough matches, get the average of their market values
        if (match_count >= min_num_props):
            market_value = market_value_sum / match_count
        else:
            # Insufficient matches
            market_value = 0.0
            matching_props = []
        
        # Store resulting price and matching properties in dict
        market_value = int(round(market_value))
        results = {
            'MarketValue': market_value,
            'MarketProperties': matching_props
        }

        return results
    
    @classmethod
    def retrieve_area_comp_properties(cls, style, mp_style, lat, lon, year, sqft, bath, bed, ptype, property_match_options):
        area_comps = None
        # Get area comp listings (Sold)
        status_list = ['S']
        print('retrieve comp properties')
        area_comps = MPSubjectProperty.retrieve_area_properties(style, mp_style, lat, lon, year, sqft, bath, bed, ptype, status_list, property_match_options)
        
        return area_comps

    @classmethod
    def retrieve_area_rental_properties(cls, style, mp_style, lat, lon, year, sqft, bath, bed, property_match_options):
        area_rentals = None
                
        # Get area rental listings (Active, Pending, Sold)
        status_list = ['A','P','S','U']
        print('retrieve rental properties')
        area_rentals = MPSubjectProperty.retrieve_area_properties(style, mp_style, lat, lon, year, sqft, bath, bed, 'rent', status_list, property_match_options)
        
        return area_rentals

    @classmethod
    def retrieve_area_properties(cls, style, mp_style, lat, lon, year, sqft, bath, bed, ptype, status_list, property_match_options):
        filters = []
        area_props = None
        
        # Get values of property match options
        max_dist = property_match_options['MaxDist']
        max_age_diff = property_match_options['MaxAgeDiff']
        max_days = property_match_options['MaxDays']
        max_sqft_diff = property_match_options['MaxSqftDiff']
        max_bed_diff = property_match_options['MaxBedDiff']
        max_bath_diff = property_match_options['MaxBathDiff']
        # min_num_props = property_match_options['MinNumProps']
        max_num_props = property_match_options['MaxNumProps']
        style_match_type = property_match_options['StyleMatchType']
        
        # Get listing date threshold filter based on max_days
        min_date = datetime.today() - timedelta(days=max_days)

        filters.append(Term(property_type=ptype))

        # min_date_str = min_date->format('Y-m-d H:i:s');
        if (ptype.lower() == "rent"):
            # date_filter = "((`mpStatus` = 'S' AND `CLO` >= '$min_date_str') OR (`mpStatus` != 'S' AND `LDR` >= '$min_date_str'))"
            rented_filter = Bool(must=[Term(listing_status='S'), Range(selling_date={'gte': min_date})])
            not_rented_filter = Bool(must_not=Term(listing_status='S'), must=Range(list_date_received={'gte': min_date}))
            filters.append(Bool(should=[rented_filter, not_rented_filter]))
        else:
            filters.append(Range(selling_date={'gte': min_date}))
            
        
        # Status filter
        filters.append(Terms(listing_status=status_list))
        
        # Style filter
        if (style_match_type == 'Strict'):
            # STY=this.style
            filters.append(Term(style=str(style)))
        elif (style_match_type == 'Class'):
            # mpStyle=this.mpStyle
            filters.append(Term(mp_style=str(mp_style)))   
        elif (style_match_type == 'Relaxed'):
            style_matches = MPSubjectProperty.type_style_matches[ptype.lower()]
            style_list_values = style_matches[mp_style]
            filters.append(Terms(mp_style=style_list_values))
        
        # Valid listing filter (no wacky values)  `LP` > 0
        filters.append(Range(price={'gt': 0}))
        
        # Distance filter
        distance = str(max_dist) + "mi"
        dist_filter = GeoDistance(location={"lat":lat, "lon": lon}, distance=distance)
        filters.append(dist_filter)

        # Age difference filter
        min_year = year - max_age_diff
        max_year = year + max_age_diff
        # Check if table being queried has EffectiveYearBuilt column, and use appropriate filter
        year_built_filter = Range(year_built={'gte': min_year, 'lte': max_year})
        effective_year_built_filter = Bool(must=[Term(effective_year_built_source='PR'), Range(effective_year_built={'gte': min_year, 'lte': max_year})])
        filters.append(Bool(should=[year_built_filter, effective_year_built_filter]))
        
        # Sqft filter (make sure at least 100 sqft)
        min_sqft = max(100, sqft - max_sqft_diff)
        max_sqft = sqft + max_sqft_diff
        filters.append(Range(sqft={'gte': min_sqft, 'lte': max_sqft}))
        
        # Bath filter (make sure any prop has at least 1/2 bath)
        min_bath = max(0.50, bath - max_bath_diff)
        max_bath = bath + max_bath_diff
        filters.append(Range(bathrooms={'gte': min_bath, 'lte': max_bath}))

        # Bed filter
        min_bed = max(1.0, bed - max_bed_diff)
        max_bed = bed + max_bed_diff
        filters.append(Range(bedrooms={'gte': min_bed, 'lte': max_bed}))
        
        # Add exclusions filter for Short Sale, Bank Owned / REO, Fixer properties if non-RENT DB
        if (ptype.lower() != "rent"):
            filters.append(Bool(must_not=[Term(parq='C'), Term(breo='Y'), Term(building_condition='C')]))
        
        # pagination
        ### DAVID!!! What should max num props be?  Also, this was commented out in php...why??
        # If max num of props is specified (greater than 0), append limit modifier
        size = max_num_props or 100

        s = Property.search()
        s = s.query("bool", filter=filters)
        s = s.sort({"_geo_distance": {
            'location':[lon, lat], 
            'unit': "mi"}})
        s = s[0:size]  # {"from": 0, "size": 10}

        print(s.to_dict())

        # Get area listings
        response = s.execute()
        print("Area listings: ", response.to_dict())

        area_props = []

        # Convert distance sorted listings to properties objects
        if (response):
            # Loop getting each listing with distance in miles and create property object
            for listing in response:
                miles = listing.meta.sort[0] # when sorting by distance, the score is the distance

                # Create property object for listing
                area_props.append(CompProperty(listing, miles))
        
        return area_props
    # end retrieve_area_properties


    # ---------------------------------------------------------
    # Perform calculations
    # ---------------------------------------------------------
    def calculate_property_investment_analysis(self):
        self.Calc_GrossSchedIncome = self.Result_EstMonthlyRent * 12.0

        self.Calc_ClosingCosts = self.purchase_price * self.ClosingCosts_Percent
        self.Calc_Downpayment = self.purchase_price * self.Downpayment_Percent
        self.Calc_LoanAmount = self.purchase_price * ( 1.0 - self.Downpayment_Percent )
        self.Calc_PurchaseEquity = self.purchase_price - self.Calc_LoanAmount
        if (self.Result_EstMarketValue > 0):
            self.Calc_MarketEquity = self.Result_EstMarketValue - self.Calc_LoanAmount
        self.Calc_AfterRepairValue = self.purchase_price + self.Improvements + self.Calc_ClosingCosts
        self.Calc_EffectiveGrossIncome = self.Calc_GrossSchedIncome  * ( 1.0 - self.VacancyRate_Percent)
        self.Calc_MortgagePerMonth = self.__PMT__( self.MortgageInterest_Percent,
                                                  self.Amortization_yrs * self.Payments_yr,
                                                  self.Calc_LoanAmount )

        self.Calc_PropertyTaxes = self.purchase_price * self.PropertyTaxRate_Percent
        self.Calc_Insurance = self.InsuranceRate * self.purchase_price

        self.Calc_Maintenance = self.Maintenance_Percent * self.purchase_price
        self.Calc_PropertyMgmt = self.PropertyMgmt_Percent * self.Result_EstMonthlyRent * 12.0
        self.Calc_OperatingExpenses = self.Calc_PropertyTaxes + self.Calc_Insurance + self.HOA_yr + self.Calc_Maintenance + self.Calc_PropertyMgmt
        self.Calc_NetOperatingIncome = self.Calc_EffectiveGrossIncome - self.Calc_OperatingExpenses

        # self.Calc_DebtCoverageRatio = self.Calc_NetOperatingIncome / ( self.Calc_MortgagePerMonth * 12.0 ) / 100.0
        # handle if downpayment is set to 100%, meaning cash offer or seller scenario
        if (self.Calc_MortgagePerMonth > 0):
            self.Calc_DebtCoverageRatio = self.Calc_NetOperatingIncome / ( self.Calc_MortgagePerMonth * 12.0 ) / 100.0
        else:
            self.Calc_DebtCoverageRatio = 0
        self.Calc_ExpenseRatio = self.Calc_OperatingExpenses / self.Calc_EffectiveGrossIncome
        self.Calc_NetIncomeMultiplier = self.purchase_price / self.Calc_NetOperatingIncome / 100.0
        self.Calc_GrossRentMultiplier = self.purchase_price / self.Calc_GrossSchedIncome / 100.0

        self.Result_CashIn = self.Calc_AfterRepairValue - self.Calc_LoanAmount
        self.Result_CapRate = self.Calc_NetOperatingIncome / self.purchase_price
        self.Result_CashFlow = self.Calc_NetOperatingIncome - ( self.Calc_MortgagePerMonth * 12.0 )
        self.Result_CashFlow_Monthly = (float(self.Calc_NetOperatingIncome) - ( self.Calc_MortgagePerMonth * 12.0 )) / 12.0
        self.Result_RentValueRatio = self.Result_EstMonthlyRent / self.purchase_price
        self.Result_CashOnCashReturn = self.Result_CashFlow / self.Result_CashIn
    # end calculate_property_investment_analysis

    # ---------------------------------------------------------
    # Perform calculations
    # ---------------------------------------------------------
    def calculate_current_property_investment_analysis(self):
        # self.Current_GrossSchedIncome = self.Result_EstMonthlyRent * 12.0
        # self.Calc_EffectiveGrossIncome = self.Calc_GrossSchedIncome  * ( 1.0 - self.VacancyRate_Percent)
        
        # self.Calc_PropertyTaxes = self.purchase_price * self.PropertyTaxRate_Percent
        # self.Calc_Insurance = self.InsuranceRate * self.purchase_price

        # self.Calc_Maintenance = self.Maintenance_Percent * self.purchase_price
        # self.Calc_PropertyMgmt = self.PropertyMgmt_Percent * self.Result_EstMonthlyRent * 12.0
        # self.Calc_OperatingExpenses = self.Calc_PropertyTaxes + self.Calc_Insurance + self.HOA_yr + self.Calc_Maintenance + self.Calc_PropertyMgmt
        # self.Calc_NetOperatingIncome = self.Calc_EffectiveGrossIncome - self.Calc_OperatingExpenses

        # self.Calc_DebtCoverageRatio = self.Calc_NetOperatingIncome / ( self.Calc_MortgagePerMonth * 12.0 ) / 100.0
        # self.Calc_ExpenseRatio = self.Calc_OperatingExpenses / self.Calc_EffectiveGrossIncome
        if self.Current_TotalMonthlyIncome:
            self.Current_GrossSchedIncome = self.Current_GrossSchedIncome or self.Current_TotalMonthlyIncome * 12.0
            self.Current_EffectiveGrossIncome = self.Current_GrossSchedIncome  * ( 1.0 - self.VacancyRate_Percent)

            # self.Current_NetOperatingIncome = self.Current_NetOperatingIncome or self.Current_TotalMonthlyIncome
            self.Current_OperatingExpenses = self.Current_OperatingExpenses or (self.Current_Insurance + self.Current_ExpensesOther + self.Current_PropertyMgmt + self.Current_PropertyTaxes + self.Current_WaterSewerGarbage + self.Current_HODAnnual)

            self.Current_NetOperatingIncome = self.Current_NetOperatingIncome or (self.Current_EffectiveGrossIncome - self.Current_OperatingExpenses)
            self.Current_NetIncomeMultiplier = self.purchase_price / self.Current_NetOperatingIncome / 100.0
            self.Current_GrossRentMultiplier = self.Current_GrossRentMultiplier or (self.purchase_price / self.Current_GrossSchedIncome / 100.0)

            self.Result_Current_CapRate = self.Current_NetOperatingIncome / self.purchase_price
            self.Result_Current_CashFlow = self.Current_NetOperatingIncome - ( self.Calc_MortgagePerMonth * 12.0 )
            self.Result_Current_CashFlow_Monthly = self.Result_Current_CashFlow / 12.0
            self.Result_Current_RentValueRatio = self.Current_TotalMonthlyIncome / self.purchase_price

        if self.mp_style == 7:
            try:
                if self.success_criteria == 'cash_flow_criteria':
                    monthly_interest = self.MortgageInterest_Percent/12
                    mtg_factor = (monthly_interest*pow((1+monthly_interest), (self.Amortization_yrs*self.Payments_yr)))/(pow((1+monthly_interest),(self.Amortization_yrs*self.Payments_yr))-1)

                    annual_mtg_factor=(1-self.Downpayment_Percent)*mtg_factor*12
                    cash_flow_criteria_annual = self.cash_flow_criteria * 12
                    print('Mortgage Factor: ' + str(mtg_factor))
                    self.Result_EstMarketValue = (self.Calc_EffectiveGrossIncome-self.Calc_PropertyMgmt-cash_flow_criteria_annual-self.HOA_yr)/(self.InsuranceRate+self.Maintenance_Percent+self.PropertyTaxRate_Percent+annual_mtg_factor)
                elif self.success_criteria == 'cap_rate_criteria':
                    self.Result_EstMarketValue =(self.Calc_EffectiveGrossIncome-self.Calc_PropertyMgmt-self.HOA_yr)/(self.cap_rate_criteria_pcnt+self.InsuranceRate+self.Maintenance_Percent+self.PropertyTaxRate_Percent)
                else:
                    print(self.rent_to_value_criteria_pcnt)
                    self.Result_EstMarketValue = (self.Result_EstMonthlyRent/self.rent_to_value_criteria_pcnt)
            except:
                print('error calculating EMV for MULT')

    # end calculate_current_property_investment_analysis
    #---------------------------------------------------------//
    # Compute the monthly mortgage payment against loan principal plus interest.
    #---------------------------------------------------------//
    def __PMT__(self, apr, term, loan):
        """Compute the monthly mortgage payment against loan principal plus interest.

        Keyword arguments:
        apr -- Annual interest rate already divided by 100.  E.g. For 4.5%, arg should be 0.045
        term -- Loan length in months.
        loan -- loan amount (positive value)
        """
        month_apr = float(apr) / 12.0
        months = float(term)
        negloan = float(loan) * -1.0

        amount = month_apr * negloan * pow((1 + month_apr), months) / (1 - pow((1 + month_apr), months))
      
        return amount
    # end __PMT__

    def get_results(self, include_cma_props, include_area_props, pretty_print=False):
        results = {	
            'subject_property': {
                'ln':self.ln,
                'ptype':self.ptype,
                'address':self.address,
                'mp_status':self.mp_status,
                'mp_status_name':self.mp_status_name,
                'listing_date':self.listing_date,
                'update_date':self.update_date,
                'selling_date':self.selling_date,
                'listing_price':format_value(self.listing_price, pretty_print, NumberType.CURRENCY),
                'selling_price':format_value(self.selling_price, pretty_print, NumberType.CURRENCY),
                'original_price':format_value(self.original_price, pretty_print, NumberType.CURRENCY),
                'monthly_dues':format_value(self.monthly_dues, pretty_print, NumberType.CURRENCY),
                'lat':self.lat,
                'lon':self.lon,
                'year':self.year,
                'style':self.style,
                'style_name':self.style_name,
                'mp_style':self.mp_style,
                'mp_style_name':self.mp_style_name,
                'bed':self.bed,
                'bath':self.bath,
                'zipcode':self.zipcode,
                'sqft':self.sqft,
                'price_sqft':self.price_sqft,
                'rent_sqft': self.rent_sqft,
                'purchase_price':format_value(self.purchase_price, pretty_print, NumberType.CURRENCY),
            },
            'params': {
                'downpayment_percent': self.Downpayment_Percent * 100,
                'mortgage_interest_rate': self.MortgageInterest_Percent * 100,
                'maintenance_percent': self.Maintenance_Percent * 100,
                'property_tax_rate': self.PropertyTaxRate_Percent * 100,
                'vacancy_rate': self.VacancyRate_Percent * 100,
                'closing_costs_percent': self.ClosingCosts_Percent * 100,
                'property_mgmt_percent': self.PropertyMgmt_Percent * 100,
                'insurance_rate': self.InsuranceRate * 100,
                'hoa_yr': self.HOA_yr,
                'monthly_rent': self.Result_EstMonthlyRent,
                'purchase_price': self.purchase_price,
                'comp_max_dist' : self.CompMaxDist,
                'comp_max_days' : self.CompMaxDays,
                'comp_max_num_props' : self.CompMaxNumProps,
                'rental_max_dist' : self.RentalMaxDist,
                'rental_max_days' : self.RentalMaxDays,
                'rental_max_num_props' : self.RentalMaxNumProps
            },
            'cma_calc': {
                'Calc_GrossSchedIncome': self.Calc_GrossSchedIncome,
                'Calc_ClosingCosts': self.Calc_ClosingCosts,
                'Calc_Downpayment': self.Calc_Downpayment,
                'Calc_LoanAmount': self.Calc_LoanAmount,
                'Calc_PurchaseEquity': self.Calc_PurchaseEquity,
                'Calc_MarketEquity': self.Calc_MarketEquity,
                'Calc_AfterRepairValue': self.Calc_AfterRepairValue,
                'Calc_EffectiveGrossIncome': self.Calc_EffectiveGrossIncome,
                'Calc_MortgagePerMonth': self.Calc_MortgagePerMonth,
                'Calc_NetOperatingIncome': self.Calc_NetOperatingIncome,
                'Calc_PropertyTaxes': self.Calc_PropertyTaxes,
                'Calc_Insurance': self.Calc_Insurance,
                'Calc_Maintenance': self.Calc_Maintenance,
                'Calc_PropertyMgmt': self.Calc_PropertyMgmt,
                'Calc_OperatingExpenses': self.Calc_OperatingExpenses,
                'Calc_DebtCoverageRatio': self.Calc_DebtCoverageRatio,
                'Calc_ExpenseRatio': self.Calc_ExpenseRatio,
                'Calc_NetIncomeMultiplier': self.Calc_NetIncomeMultiplier,
                'Calc_GrossRentMultiplier': self.Calc_GrossRentMultiplier,
                'HOA_yr': self.HOA_yr,
            },
            'cma_results': {
                'Result_EstMarketValue': format_value(self.Result_EstMarketValue, pretty_print, NumberType.CURRENCY),
                'Result_EstMonthlyRent': format_value(self.Result_EstMonthlyRent, pretty_print, NumberType.CURRENCY),
                'Result_CashIn': format_value(self.Result_CashIn, pretty_print, NumberType.CURRENCY),
                'Result_CapRate': format_value(self.Result_CapRate, pretty_print, NumberType.PERCENT, 2),
                'Result_CashFlow': format_value(self.Result_CashFlow, pretty_print, NumberType.CURRENCY, 2),
                'Result_CashFlow_Monthly': format_value(self.Result_CashFlow_Monthly, pretty_print, NumberType.CURRENCY, 2),
                'Result_RentValueRatio': format_value(self.Result_RentValueRatio, pretty_print, NumberType.PERCENT, 2),
                'Result_CashOnCashReturn': format_value(self.Result_CashOnCashReturn, pretty_print, NumberType.PERCENT, 2),
                'success_criteria': self.success_criteria,
                'criteria_name': self.criteria_name,
                'criteria_value': self.criteria_value,
                'criteria_threshold': self.criteria_threshold,
                'criteria_result': self.criteria_result,
                'criteria_type': self.criteria_type,
                'error': self.error
            }
        }

        # if it's a multi-family home, include current financials as well
        if (self.mp_style == 7 and self.listing_details):
            results['subject_property']['number_of_units'] = self.number_of_units
            results['cma_results']['Result_EstMarketValue'] = 0
            current_cma = {
                'Current_GrossSchedIncome': self.Current_GrossSchedIncome,
                'Current_TotalMonthlyIncome': self.Current_TotalMonthlyIncome,
                'Current_EffectiveGrossIncome': self.Current_EffectiveGrossIncome, # !!!!!
                'Current_GrossRentMultiplier': self.Current_GrossRentMultiplier,
                'Current_NetOperatingIncome': self.Current_NetOperatingIncome,
                'Current_OperatingExpenses': self.Current_OperatingExpenses,   # Total Expenses
                'Current_Insurance': self.Current_Insurance,
                'Current_ExpensesOther': self.Current_ExpensesOther,
                'Current_PropertyMgmt': self.Current_PropertyMgmt,
                'Current_PropertyTaxes': self.Current_PropertyTaxes,
                'Current_WaterSewerGarbage': self.Current_WaterSewerGarbage, #Water Sewage Garbage
                'Current_HODAnnual': self.Current_HODAnnual,
                'Current_VacancyRate': self.Current_VacancyRate,
                'Current_NetIncomeMultiplier': self.Current_NetIncomeMultiplier,
                'Result_Current_CapRate': self.Result_Current_CapRate,
                'Result_Current_CashFlow': self.Result_Current_CashFlow,
                'Result_Current_CashFlow_Monthly': self.Result_Current_CashFlow_Monthly,
                'Result_Current_RentValueRatio': self.Result_Current_RentValueRatio
            }
            if self.number_of_units <= 6:
                results['cma_results']['Result_EstMonthlyRent_Units'] = self.Units
                results['cma_results']['Result_MaxRentDiff'] = self.max_rent_diff
                current_cma['Units'] = self.Units
                for unit in self.Units:
                    unit_num = unit['UnitNum']
                    paramname = f'monthly_rent_unit{unit_num}'
                    results['params'][paramname] = unit['EstMonthlyRent']
            
            results['current_cma'] = current_cma
        
        # Check flag for including CMA props
        # print("DSDSDS<><><> get_results: include_cma_props is ", include_cma_props)
        if (include_cma_props):
            cma_comps = []
            if (self.cma_comps):
                for comp in self.cma_comps:
                    cma_comps.append(comp.__dict__)
            results['cma_comps'] = cma_comps

            cma_rentals = []
            if (self.cma_rentals):
                for rental in self.cma_rentals:
                    cma_rentals.append(rental.__dict__)
            results['cma_rentals'] = cma_rentals
            results['rent_source'] = self.rental_source
        
        # Check flag for including area props
        if (include_area_props):
            results['area_comps'] = self.area_comps
            results['area_rentals'] = self.area_rentals
        
        print("DSDSDS<><><> get_results: results = ", results)
        return results   
# end MPSubjectProperty

class NumberType(Enum):
    CURRENCY = 0
    PERCENT = 1
    NUMBER = 2
def format_value(value, pretty_print, t:NumberType, decimals=0):
    if not pretty_print:
        return value
    if t == NumberType.CURRENCY:
        currencyFormatStr =  '${:,.' + str(decimals) + 'f}'
        return currencyFormatStr.format(float(value))
    if t == NumberType.PERCENT:
        formatStr = '{:.' + str(decimals) + '%}'
        return formatStr.format(float(value))