import json
from enum import Enum
from datetime import datetime, timedelta
import pytz
import dateutil.tz
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import MultiMatch, Match, Term, Terms, GeoDistance, Range, Bool
from rent_calculator import RentCalculator
from mlsproperty import Property
from statistics import mean
import json

# Allow multiple success criteria designations via map
success_criteria_map = {
    'cash_flow_criteria': 'cash_flow_criteria', 'Cash Flow': 'cash_flow_criteria',
    'cap_rate_criteria': 'cap_rate_criteria', 'Cap Rate': 'cap_rate_criteria',
    'rent_to_value_criteria': 'rent_to_value_criteria', 'Rent-to-Value': 'rent_to_value_criteria'
}

def ts_now():
    return datetime.utcnow().replace(tzinfo=dateutil.tz.tzutc())

class CompProperty(object):
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


class FolioSubjectProperty(object):
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
    property_name = None
    address = None
    # mp_status = None
    # mp_status_name = None
    listing_date = None
    # update_date = None
    # selling_date = None
    # listing_price = 0.0
    # selling_price = 0.0
    # original_price = 0.0
    lat = 0.0
    lon = 0.0
    year = 0		# Year built, or EffectiveYearBuilt (if provided)
    style = None	# this is the MLS style code
    # style_name = None
    mp_style = 0  # this is the internal mpStyle, not the MLS style
    mp_style_name = None
    bed = 0.0
    bath = 0.0
    zipcode = 0
    monthly_hoa_dues = 0.0  # monthly HOA dues
    sqft = 0
    price_sqft = 0.0  # Price per sq ft
    rent_sqft = 0.0  # Price per sq ft
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

    MarketVacancyRate_Percent= 0.08
    MarketCapRate_Percent = 0.05
    Current_Improvements = 0.0
    Current_ClosingCosts = 0
    OriginalLoan = 0
    CurrentLoan = 0
    Current_MonthlyMortgage = 0
    Current_MonthlyRent = 0
    Current_OtherMonthlyIncome = 0
    Current_AnnualPropertyTaxes = 0
    Current_AnnualInsurance = 0
    Current_AnnualMaintenance = 0
    Current_AnnualUtilities = 0
    Current_PropertyMgmt = 0.0
    Current_MonthlyHOADues = 0
    Current_OtherAnnualExpenses = 0.0
    BrokerCommission_Percent = 0.06
    ExciseTax_Percent  = 0.0178
    CompMaxDist              = 0
    CompMaxDays              = 0
    CompMaxNumProps          = 0
    RentalMaxDist            = 0
    RentalMaxDays            = 0
    RentalMaxNumProps        = 0

    # CMA Calculations for Current values
    Calc_AdjustedCostBasis = 0.0
    Calc_SellingPriceIncome = 0.0
    Calc_SellingPriceComps = 0.0
    Calc_BrokerCommissionIncome = 0.0
    Calc_BrokerCommissionComps = 0.0
    Calc_ExciseTaxIncome = 0.0
    Calc_ExciseTaxComps = 0.0
    Calc_AdjustedSalesPriceIncome = 0.0
    Calc_AdjustedSalesPriceComps = 0.0

    # CMA Calculations for Estimated values
    Calc_EstClosingCosts = 0.0
    Calc_EstAdjustedCostBasis = 0.0
    Calc_EstDownpayment = 0.0
    Calc_EstLoanAmount = 0.0
    Calc_EstClosingCosts = 0.0
    Calc_EstDownpayment = 0.0
    Calc_EstMortgagePerMonth = 0.0
    Calc_EstPropertyTaxes = 0.0
    Calc_EstInsurance = 0.0
    Calc_EstMaintenance = 0.0
    Calc_EstPropertyMgmt = 0.0

    # CMA Results based on Current property values
    Result_CashIn = 0.0
    Result_OperatingExpenses = 0.0
    Result_GrossSchedIncome = 0.0
    Result_EffectiveGrossIncome = 0.0
    Result_NetOperatingIncome = 0.0
    Result_CapRate = 0.0  # based on purchase price for sellers
    Result_CashFlow = 0.0
    Result_CashFlow_Monthly = 0.0
    Result_RentValueRatio = 0.0
    Result_CashOnCashReturn = 0.0
    Result_DebtCoverageRatio = 0.0
    Result_ExpenseRatio = 0.0
    Result_NetIncomeMultiplier = 0.0
    Result_GrossRentMultiplier = 0.0
    Result_EMVIncome = 0.0
    Result_EquityIncome = 0.0
    Result_RoEIncome = 0.0
    Result_CapRateIncome = 0.0  # based on purchase price for sellers
    Result_EMVComps = 0.0
    Result_EquityComps = 0.0
    Result_RoEComps = 0.0
    Result_CapitalGainLossIncome = 0.0
    Result_CapitalGainLossComps = 0.0
    Result_CashOutIncome = 0.0
    Result_CashOutComps = 0.0
    Result_RoIIncome = 0.0
    Result_RoIComps = 0.0

    # CMA Results based on Estimated property values and assumptions
    Result_EstCashIn = 0.0
    Result_EstOperatingExpenses = 0.0
    Result_EstGrossSchedIncome = 0.0
    Result_EstEffectiveGrossIncome = 0.0
    Result_EstNetOperatingIncome = 0.0
    Result_EstCapRate = 0.0  # based on purchase price for sellers
    Result_EstCashFlow = 0.0
    Result_EstCashFlow_Monthly = 0.0
    Result_EstRentValueRatio = 0.0
    Result_EstCashOnCashReturn = 0.0
    Result_EstDebtCoverageRatio = 0.0
    Result_EstExpenseRatio = 0.0
    Result_EstMonthlyRent = 0.0
    Result_EstNetIncomeMultiplier = 0.0
    Result_EstGrossRentMultiplier = 0.0
    
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
    purchase_price_type = "user_provided"

    def __init__(self, property_id, folio_property, req_param_values):
        print("DSDSDSDS<><><><> FolioSubjectProperty __init__: req_param_values = ", req_param_values)
        print("DSDSDSDS<><><><> FolioSubjectProperty __init__: folio_property = ", folio_property)
        self.folio_property = folio_property
        self.property_id = property_id

        # Multi family
        if (folio_property["mp_style"] == 7):
            self.number_of_units = folio_property["units"]
            self.Units = []
            for unit_num in range(1, self.number_of_units+1):
                unit_current_rent = folio_property["rent"+str(unit_num)]
                unit_bed = float(folio_property["bed"+str(unit_num)])
                unit_bath = float(folio_property["bath"+str(unit_num)])
                unit_sqft = folio_property["sqft"+str(unit_num)]
                # unit_desc = listing[unit_num]["desc"]

                if unit_bed or unit_bath:
                    unit = {
                        'UnitNum': unit_num,
                        # 'Description': unit_desc,
                        'CurrentRent': unit_current_rent,
                        'EstMonthlyRent': 0.0,
                        'bed': unit_bed,
                        'bath': unit_bath,
                        'sqft': unit_sqft,
                    }
                    user_input = folio_property.get('monthly_rent_unit'+str(unit_num))
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
                user_input = folio_property.get('monthly_rent_unit'+str(unit_num))
                if (user_input):
                    unit['EstMonthlyRent'] = float(user_input)
                self.Units.append(unit)
                        
        # else:
            # Finish setup and perform all searches, matches, and computations if a valid listing was returned
            # Single family
        self.ptype = folio_property["property_type"]
        self.property_name = folio_property["property_name"]
        self.address = folio_property["address"]
        # self.mp_status = folio_property["mp_status"]
        # self.mp_status_name = folio_property["mp_status_name"]
        # self.listing_date = datetime.today()
        # self.update_date = datetime.today()
        # self.selling_date = datetime.today()
        # if folio_property["price"]: self.listing_price = float(folio_property["price"])
        # if folio_property["selling_price"]: self.selling_price = float(folio_property["selling_price"])
        # if folio_property["original_price"]: self.original_price = float(folio_property["original_price"])
        self.lat = folio_property["lat"]
        self.lon = folio_property["lng"]
        self.year = int(folio_property["year_built"])
        self.style = folio_property["style_code"]
        # self.style_name = folio_property["style_name"]
        self.mp_style = folio_property["mp_style"]
        self.mp_style_name = folio_property["mp_style_name"]
        self.bed = float(folio_property["bedrooms"])
        self.bath = float(folio_property["bathrooms"])
        self.zipcode = folio_property["zipcode"]
        self.sqft = int(folio_property["sqft"])
        self.purchase_price = float(folio_property["purchase_price"])
        self.price_sqft = ( float(self.purchase_price) / self.sqft ) if self.sqft > 0 else 0
        
        # Get monthly dues if available
        if (folio_property["monthly_hoa_dues"]):
            self.monthly_hoa_dues = float(folio_property["monthly_hoa_dues"])
        else:
            self.monthly_hoa_dues = 0.0
        self.HOA_yr = self.monthly_hoa_dues * 12.0

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

        self.MarketVacancyRate_Percent = float(req_param_values['market_vacancy_rate'])
        self.MarketCapRate_Percent = float(req_param_values['market_cap_rate'])
        self.Current_Improvements = int(req_param_values['current_improvements'])
        self.Current_ClosingCosts = int(req_param_values['current_closing_costs'])
        self.OriginalLoan = int(req_param_values['original_loan'])
        self.CurrentLoan = int(req_param_values['current_loan'])
        self.Current_MonthlyRent  = int(req_param_values['current_monthly_rent'])
        self.Current_OtherMonthlyIncome  = int(req_param_values['current_other_monthly_income'])
        self.Current_MonthlyMortgage  = int(req_param_values['monthly_mortgage'])
        self.Current_AnnualPropertyTaxes = int(req_param_values['annual_property_taxes'])
        self.Current_AnnualInsurance     = int(req_param_values['annual_insurance'])
        self.Current_AnnualMaintenance = int(req_param_values['annual_maintenance'])
        self.Current_AnnualUtilities = int(req_param_values['annual_utilities'])
        self.Current_PropertyMgmt = float(req_param_values['monthly_property_mgmt'])
        self.Current_MonthlyHOADues = int(req_param_values['monthly_hoa_dues'])
        self.Current_OtherAnnualExpenses  = int(req_param_values['other_annual_expenses'])
        self.BrokerCommission_Percent = float(req_param_values['broker_commission'])
        self.ExciseTax_Percent = float(req_param_values['excise_tax'])
        self.CompMaxDist              = int(req_param_values['comp_max_dist'])
        self.CompMaxDays              = int(req_param_values['comp_max_days'])
        self.CompMaxNumProps          = int(req_param_values['comp_max_num_props'])
        self.RentalMaxDist            = int(req_param_values['rental_max_dist'])
        self.RentalMaxDays            = int(req_param_values['rental_max_days'])
        self.RentalMaxNumProps        = int(req_param_values['rental_max_num_props'])

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
        # if (req_param_values['purchase_price_type']):
        #     self.purchase_price_type = req_param_values['purchase_price_type'].lower()
        # if (req_param_values['purchase_price'] or self.purchase_price_type=='user_provided'):
        #     self.purchase_price_type = 'user_provided'
        #     self.purchase_price = float(req_param_values['purchase_price'])
        # end __init__

    def calculate_cma(self, debug=False):
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

        # if (self.purchase_price_type=='est_market_market' and self.Result_EMV_Comps):
        #     self.purchase_price = self.Result_EMV_Comps

        # Get estimated market rent via CMA Analysis if monthly rent not already provided.
        self.Result_EstMonthlyRent = self.calculate_estimated_rent()
        self.rent_sqft = ( float(self.Result_EstMonthlyRent) / self.sqft ) if self.sqft > 0 else 0

        # Get estimated market value.
        # The compute_cma_emv_comps() function returns the market
        # value or 0 if it can't be calculated.  The cma properties are also stored in this object.
        # This also scores & sorts all area comp properties.
        self.Result_EMVComps = self.compute_cma_emv_comps(self.comp_prop_match_options, self.comp_scoring_weights)
        # Calculate investor property analysis values if rent is non-zero
        if (self.Result_EstMonthlyRent > 0.0):
            # Perform final calcs based on estimated monthly rent and other financials
            self.calculate_est_property_investment_analysis()
        else:
            self.error = 'Estimated rent could not be determined.'

        self.calculate_current_property_investment_analysis()


        # self.Result_EMVIncome = self.compute_cma_emv_income()


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
                est_monthly_rent = self.compute_cma_market_rent(style, mp_style, lat, lon, year, sqft, bed, bath, self.rental_prop_match_options, self.rental_scoring_weights)
                self.rental_source = "MLS"
                # If estimated rent is still 0 (e.g. min # of CMA rentals not found) try getting estimated rent via rental stats data
                if (est_monthly_rent == 0.0):
                    # No valid rental price via MLS data, so try to get price via 3rd part API service
                    #print("Couldn't find rent in MLS, get it from 3rd party API")
                    #est_monthly_rent = RentCalculatorThirdParty().get_rental_rate(mp_style_name, address, sqft, bed, bath, self.rental_prop_match_options['MaxNumProps'])
                    #self.rental_source = "RealtyMole"
                    #if (est_monthly_rent == 0.0):
                    #print("Couldn't find rent in 3rd party API, get it from CSV")
                    # No valid rental price via 3rd party API, so try to get price via rental stats data
                    max_dist = self.rental_prop_match_options['MaxDist']
                    days_old = self.rental_prop_match_options['MaxDays']
                    comp_count = self.rental_prop_match_options['MaxNumProps']
                    rent_data = RentCalculator().get_rent(address, zipcode, bed, bath, sqft, mp_style, days_old, comp_count)
                    est_monthly_rent = rent_data['price']
                    self.cma_rentals = rent_data.get('comps', [])
                    self.rental_source = rent_data['source']


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
    def compute_cma_emv_comps(self, property_match_options, scoring_weights):        
        # Get area comp (SOLD) properties of the same type
        self.area_comps = FolioSubjectProperty.retrieve_area_comp_properties(self.style,
            self.mp_style, self.lat, self.lon, self.year, self.sqft, self.bath, self.bed, self.ptype, property_match_options)
        self.num_area_comps = len(self.area_comps)

        # Get estimated market value via CMA Analysis if comps exist.
        if self.area_comps:
            # Perform CMA comp market analysis and get results
            area_comp_market = FolioSubjectProperty.perform_cma_analysis(self.style, self.year, self.sqft, self.bed, self.bath, self.area_comps, 
                property_match_options, scoring_weights)
            
            # Store results and return market price
            market_value = area_comp_market['MarketValue']
            self.cma_comps = area_comp_market['MarketProperties']
            self.num_cma_comps = len(self.cma_comps)
            
            return market_value
        else:
            return 0.0

    def compute_cma_emv_income(self):
        market_value = self.Result_NetOperatingIncome / self.MarketCapRate_Percent * 100.0
        return market_value 

    # ---------------------------------------------------------
    # 	The following function does 2 things:
    # 		1) It finds and stores matching CMA rental properties.
    # 		2) It computes and stores the market rent via the
    # 		   average rental price of those matching properties.
    # ---------------------------------------------------------
    def compute_cma_market_rent(self, style, mp_style, lat, lon, year, sqft, bed, bath, property_match_options, scoring_weights):
        # Get area rental properties of the same type

        self.area_rentals = FolioSubjectProperty.retrieve_area_rental_properties(style,
            mp_style, lat, lon, year, sqft, bath, bed, property_match_options)
        self.num_area_rentals = len(self.area_rentals)
                
        if (self.area_rentals):
            print('found ' + str(self.num_area_rentals) + ' matching rental comps')
            # Perform CMA rental market analysis and get results
            area_rental_market = FolioSubjectProperty.perform_cma_analysis(style, year, sqft, bed, bath, self.area_rentals, property_match_options, scoring_weights)
            
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
        area_comps = FolioSubjectProperty.retrieve_area_properties(style, mp_style, lat, lon, year, sqft, bath, bed, ptype, status_list, property_match_options)
        
        return area_comps

    @classmethod
    def retrieve_area_rental_properties(cls, style, mp_style, lat, lon, year, sqft, bath, bed, property_match_options):
        area_rentals = None
                
        # Get area rental listings (Active, Pending, Sold)
        status_list = ['A','P','S','U']
        print('retrieve rental properties')
        area_rentals = FolioSubjectProperty.retrieve_area_properties(style, mp_style, lat, lon, year, sqft, bath, bed, 'rent', status_list, property_match_options)
        
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
            style_matches = FolioSubjectProperty.type_style_matches[ptype.lower()]
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
    def calculate_current_property_investment_analysis(self):
        self.Result_GrossSchedIncome = (self.Current_MonthlyRent + self.Current_OtherMonthlyIncome) * 12.0
        self.Result_EffectiveGrossIncome = self.Result_GrossSchedIncome  * ( 1.0 - self.MarketVacancyRate_Percent)
        self.Result_OperatingExpenses = self.Current_AnnualPropertyTaxes + self.Current_AnnualInsurance + self.Current_AnnualUtilities + \
            (self.Current_MonthlyHOADues * 12) + self.Current_AnnualMaintenance + (self.Current_PropertyMgmt * 12.0) + self.Current_OtherAnnualExpenses

        self.Calc_AdjustedCostBasis = self.purchase_price + self.Improvements + self.Current_OtherAnnualExpenses

        self.Result_NetOperatingIncome = self.Result_EffectiveGrossIncome - self.Result_OperatingExpenses
        self.Result_EMVIncome = self.compute_cma_emv_income()

        # self.Calc_DebtCoverageRatio = self.Calc_NetOperatingIncome / ( self.Calc_MortgagePerMonth * 12.0 ) / 100.0
        # handle if downpayment is set to 100%, meaning cash offer or seller scenario
        if (self.Current_MonthlyMortgage > 0):
            self.Result_DebtCoverageRatio = self.Result_NetOperatingIncome / ( self.Current_MonthlyMortgage * 12.0 ) / 100.0
        else:
            self.Result_DebtCoverageRatio = 0
        self.Result_ExpenseRatio = self.Result_OperatingExpenses / self.Result_EffectiveGrossIncome
        self.Calc_NetIncomeMultiplier = self.purchase_price / self.Result_NetOperatingIncome / 100.0
        self.Calc_GrossRentMultiplier = self.purchase_price / self.Result_GrossSchedIncome / 100.0

        self.Result_CashIn = self.Calc_AdjustedCostBasis - self.OriginalLoan
        self.Result_CapRate = self.Result_NetOperatingIncome / self.purchase_price
        self.Result_CashFlow = self.Result_NetOperatingIncome - ( self.Current_MonthlyMortgage * 12.0 )
        self.Result_CashFlow_Monthly = float(self.Result_CashFlow) / 12.0
        self.Result_RentValueRatio = self.Current_MonthlyRent / self.purchase_price
        self.Result_CashOnCashReturn = self.Result_CashFlow / self.Result_CashIn

        self.Result_EquityIncome = self.Result_EMVIncome - self.CurrentLoan
        self.Result_RoEIncome = self.Result_CashFlow / self.Result_EquityIncome

        self.Result_EquityComps = self.Result_EMVComps - self.CurrentLoan
        self.Result_RoEComps = self.Result_CashFlow / self.Result_EquityComps

        # sales scenario
        # set the selling price for income-based and comps-based market values
        self.Calc_SellingPriceIncome = self.Result_EMVIncome
        self.Calc_SellingPriceComps = self.Result_EMVComps

        self.Calc_BrokerCommissionIncome = self.BrokerCommission_Percent * self.Calc_SellingPriceIncome
        self.Calc_BrokerCommissionComps = self.BrokerCommission_Percent * self.Calc_SellingPriceComps

        self.Calc_ExciseTaxIncome = self.ExciseTax_Percent * self.Calc_SellingPriceIncome
        self.Calc_ExciseTaxComps = self.ExciseTax_Percent * self.Calc_SellingPriceComps

        self.Calc_AdjustedSalesPriceIncome = self.Calc_SellingPriceIncome - self.Calc_BrokerCommissionIncome - self.Calc_ExciseTaxIncome
        self.Calc_AdjustedSalesPriceComps = self.Calc_SellingPriceComps - self.Calc_BrokerCommissionComps - self.Calc_ExciseTaxComps

        self.Result_CapitalGainLossIncome = self.Calc_AdjustedSalesPriceIncome - self.Calc_AdjustedCostBasis
        self.Result_CapitalGainLossComps = self.Calc_AdjustedSalesPriceComps - self.Calc_AdjustedCostBasis
        
        self.Result_CashOutIncome = self.Calc_AdjustedSalesPriceIncome - self.CurrentLoan
        self.Result_CashOutComps = self.Calc_AdjustedSalesPriceComps - self.CurrentLoan
        
        self.Result_RoIIncome = (self.Result_CashOutIncome - self.Result_CashIn)/self.Result_CashIn
        self.Result_RoIComps = (self.Result_CashOutComps - self.Result_CashIn)/self.Result_CashIn
    # end calculate_property_investment_analysis

    def calculate_est_property_investment_analysis(self):
        self.Result_EstGrossSchedIncome = self.Result_EstMonthlyRent * 12.0

        self.Calc_EstClosingCosts = self.purchase_price * self.ClosingCosts_Percent
        self.Calc_EstDownpayment = self.purchase_price * self.Downpayment_Percent
        self.Calc_EstLoanAmount = self.purchase_price * ( 1.0 - self.Downpayment_Percent )
        self.Calc_EstAdjustedCostBasis = self.purchase_price + self.Improvements + self.Calc_EstClosingCosts
        self.Result_EstEffectiveGrossIncome = self.Result_EstGrossSchedIncome  * ( 1.0 - self.VacancyRate_Percent)
        self.Calc_EstMortgagePerMonth = self.__PMT__( self.MortgageInterest_Percent,
                                                  self.Amortization_yrs * self.Payments_yr,
                                                  self.Calc_EstLoanAmount )

        self.Calc_EstPropertyTaxes = self.purchase_price * self.PropertyTaxRate_Percent
        self.Calc_EstInsurance = self.InsuranceRate * self.purchase_price

        self.Calc_EstMaintenance = self.Maintenance_Percent * self.purchase_price
        self.Calc_EstPropertyMgmt = self.PropertyMgmt_Percent * self.Result_EstMonthlyRent * 12.0
        self.Result_EstOperatingExpenses = self.Calc_EstPropertyTaxes + self.Calc_EstInsurance + self.HOA_yr + self.Calc_EstMaintenance + self.Calc_EstPropertyMgmt
        self.Result_EstNetOperatingIncome = self.Result_EstGrossSchedIncome - self.Result_EstOperatingExpenses

        # self.Calc_DebtCoverageRatio = self.Calc_NetOperatingIncome / ( self.Calc_MortgagePerMonth * 12.0 ) / 100.0
        # handle if downpayment is set to 100%, meaning cash offer or seller scenario
        if (self.Calc_EstMortgagePerMonth > 0):
            self.Result_EstDebtCoverageRatio = self.Result_EstNetOperatingIncome / ( self.Calc_EstMortgagePerMonth * 12.0 ) / 100.0
        else:
            self.Result_EstDebtCoverageRatio = 0
        self.Result_EstExpenseRatio = self.Result_EstOperatingExpenses / self.Result_EstEffectiveGrossIncome
        self.Result_EstNetIncomeMultiplier = self.purchase_price / self.Result_EstNetOperatingIncome / 100.0
        self.Result_EstGrossRentMultiplier = self.purchase_price / self.Result_EstGrossSchedIncome / 100.0

        self.Result_EstCashIn = self.Calc_EstAdjustedCostBasis - self.Calc_EstLoanAmount
        self.Result_CapRate = self.Result_EstNetOperatingIncome / self.purchase_price
        self.Result_EstCashFlow = self.Result_EstNetOperatingIncome - ( self.Calc_EstMortgagePerMonth * 12.0 )
        self.Result_EstCashFlow_Monthly = (float(self.Result_EstNetOperatingIncome) - ( self.Calc_EstMortgagePerMonth * 12.0 )) / 12.0
        self.Result_EstRentValueRatio = self.Result_EstMonthlyRent / self.purchase_price
        self.Result_EstCashOnCashReturn = self.Result_EstCashFlow / self.Result_EstCashIn
    # end calculate_property_investment_analysis

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

    def get_results(self):
        pretty_print = False
        results = {	
            'subject_property': {
                'id':self.property_id,
                'ptype':self.ptype,
                'property_name': self.property_name,
                'address':self.address,
                # 'mp_status':self.mp_status,
                # 'mp_status_name':self.mp_status_name,
                # 'listing_date':self.listing_date,
                # 'update_date':self.update_date,
                # 'selling_date':self.selling_date,
                # 'listing_price':format_value(self.listing_price, pretty_print, NumberType.CURRENCY),
                # 'selling_price':format_value(self.selling_price, pretty_print, NumberType.CURRENCY),
                # 'original_price':format_value(self.original_price, pretty_print, NumberType.CURRENCY),
                'purchase_price':format_value(self.purchase_price, pretty_print, NumberType.CURRENCY),
                'monthly_rent':format_value(self.Current_MonthlyRent, pretty_print, NumberType.CURRENCY),
                'monthly_hoa_dues':format_value(self.monthly_hoa_dues, pretty_print, NumberType.CURRENCY),
                'lat':self.lat,
                'lon':self.lon,
                'year':self.year,
                'style':self.style,
                # 'style_name':self.style_name,
                'mp_style':self.mp_style,
                'mp_style_name':self.mp_style_name,
                'bed':self.bed,
                'bath':self.bath,
                'zipcode':self.zipcode,
                'sqft':self.sqft,
                'price_sqft':self.price_sqft,
                'rent_sqft': self.rent_sqft,
            },
            # 'params': {
            #     'downpayment_percent': self.Downpayment_Percent * 100,
            #     'mortgage_interest_rate': self.MortgageInterest_Percent * 100,
            #     'maintenance_percent': self.Maintenance_Percent * 100,
            #     'property_tax_rate': self.PropertyTaxRate_Percent * 100,
            #     'vacancy_rate': self.VacancyRate_Percent * 100,
            #     'closing_costs_percent': self.ClosingCosts_Percent * 100,
            #     'property_mgmt_percent': self.PropertyMgmt_Percent * 100,
            #     'insurance_rate': self.InsuranceRate * 100,
            #     'hoa_yr': self.HOA_yr,
            #     'monthly_rent': self.Result_EstMonthlyRent,
            #     'purchase_price': self.purchase_price,
            #     'comp_max_dist' : self.CompMaxDist,
            #     'comp_max_days' : self.CompMaxDays,
            #     'comp_max_num_props' : self.CompMaxNumProps,
            #     'rental_max_dist' : self.RentalMaxDist,
            #     'rental_max_days' : self.RentalMaxDays,
            #     'rental_max_num_props' : self.RentalMaxNumProps
            # },
            'cma_calc': {
                'Calc_AdjustedCostBasis': self.Calc_AdjustedCostBasis,
                'Calc_SellingPriceIncome': self.Calc_SellingPriceIncome,
                'Calc_SellingPriceComps': self.Calc_SellingPriceComps,
                'Calc_BrokerCommissionIncome': self.Calc_BrokerCommissionIncome,
                'Calc_BrokerCommissionComps': self.Calc_BrokerCommissionComps,
                'Calc_ExciseTaxIncome': self.Calc_ExciseTaxIncome,
                'Calc_ExciseTaxComps': self.Calc_ExciseTaxComps,
                'Calc_AdjustedSalesPriceIncome': self.Calc_AdjustedSalesPriceIncome,
                'Calc_EstClosingCosts': self.Calc_EstClosingCosts,
                'Calc_AdjustedSalesPriceComps': self.Calc_AdjustedSalesPriceComps,
                'Calc_EstDownpayment': self.Calc_EstDownpayment,
                'Calc_EstLoanAmount': self.Calc_EstLoanAmount,
                'Calc_EstClosingCosts': self.Calc_EstClosingCosts,
                'Calc_EstDownpayment': self.Calc_EstDownpayment,
                'Calc_EstMortgagePerMonth': self.Calc_EstMortgagePerMonth,
                'Calc_EstPropertyTaxes': self.Calc_EstPropertyTaxes,
                'Calc_EstInsurance': self.Calc_EstInsurance,
                'Calc_EstPropertyMgmt': self.Calc_EstPropertyMgmt                
            },
            'cma_results': {
                'Result_CashIn': format_value(self.Result_CashIn, pretty_print, NumberType.CURRENCY),
                'Result_OperatingExpenses': format_value(self.Result_OperatingExpenses, pretty_print, NumberType.CURRENCY),
                'Result_MonthlyRent': format_value(self.Current_MonthlyRent, pretty_print, NumberType.CURRENCY),
                'Result_NetOperatingIncome': format_value(self.Result_NetOperatingIncome, pretty_print, NumberType.CURRENCY),
                'Result_GrossSchedIncome': format_value(self.Result_GrossSchedIncome, pretty_print, NumberType.CURRENCY),
                'Result_EffectiveGrossIncome': format_value(self.Result_EffectiveGrossIncome, pretty_print, NumberType.CURRENCY),
                'Result_CapRate': format_value(self.Result_CapRate, pretty_print, NumberType.PERCENT, 2),
                'Result_CashFlow': format_value(self.Result_CashFlow, pretty_print, NumberType.CURRENCY),
                'Result_CashFlow_Monthly': format_value(self.Result_CashFlow_Monthly, pretty_print, NumberType.CURRENCY),
                'Result_RentValueRatio': format_value(self.Result_RentValueRatio, pretty_print, NumberType.PERCENT, 2),
                'Result_CashOnCashReturn': format_value(self.Result_CashOnCashReturn, pretty_print, NumberType.PERCENT, 2),
                'Result_DebtCoverageRatio': format_value(self.Result_DebtCoverageRatio, pretty_print, NumberType.PERCENT, 2),
                'Result_ExpenseRatio': format_value(self.Result_ExpenseRatio, pretty_print, NumberType.PERCENT, 2),
                'Result_NetIncomeMultiplier': format_value(self.Result_NetIncomeMultiplier, pretty_print, NumberType.PERCENT, 2),
                'Result_GrossRentMultiplier': format_value(self.Result_GrossRentMultiplier, pretty_print, NumberType.PERCENT, 2),
                'Result_EMVIncome': format_value(self.Result_EMVIncome, pretty_print, NumberType.CURRENCY),
                'Result_EquityIncome': format_value(self.Result_EquityIncome, pretty_print, NumberType.CURRENCY),
                'Result_RoEIncome': format_value(self.Result_RoEIncome, pretty_print, NumberType.CURRENCY),
                'Result_EMVComps': format_value(self.Result_EMVComps, pretty_print, NumberType.CURRENCY),
                'Result_EquityComps': format_value(self.Result_EquityComps, pretty_print, NumberType.CURRENCY),
                'Result_RoEComps': format_value(self.Result_RoEComps, pretty_print, NumberType.CURRENCY),
                'Result_CapitalGainLossIncome': format_value(self.Result_CapitalGainLossIncome, pretty_print, NumberType.CURRENCY),
                'Result_CapitalGainLossComps': format_value(self.Result_CapitalGainLossComps, pretty_print, NumberType.CURRENCY),
                'Result_CashOutIncome': format_value(self.Result_CashOutIncome, pretty_print, NumberType.CURRENCY),
                'Result_CashOutComps': format_value(self.Result_CashOutComps, pretty_print, NumberType.CURRENCY),
                'Result_RoIIncome': format_value(self.Result_RoIIncome, pretty_print, NumberType.PERCENT, 2),
                'Result_RoIComps': format_value(self.Result_RoIComps, pretty_print, NumberType.PERCENT, 2),             
                'error': self.error
            },
            'cma_est_results': {
                'Result_CashIn': format_value(self.Result_EstCashIn, pretty_print, NumberType.CURRENCY),
                'Result_OperatingExpenses': format_value(self.Result_EstOperatingExpenses, pretty_print, NumberType.CURRENCY),
                'Result_NetOperatingIncome': format_value(self.Result_EstNetOperatingIncome, pretty_print, NumberType.CURRENCY),
                'Result_GrossSchedIncome': format_value(self.Result_EstOperatingExpenses, pretty_print, NumberType.CURRENCY),
                'Result_EffectiveGrossIncome': format_value(self.Result_EstEffectiveGrossIncome, pretty_print, NumberType.CURRENCY),
                'Result_CapRate': format_value(self.Result_EstCapRate, pretty_print, NumberType.PERCENT, 2),
                'Result_CashFlow': format_value(self.Result_EstCashFlow, pretty_print, NumberType.CURRENCY),
                'Result_CashFlow_Monthly': format_value(self.Result_EstCashFlow_Monthly, pretty_print, NumberType.CURRENCY),
                'Result_RentValueRatio': format_value(self.Result_EstRentValueRatio, pretty_print, NumberType.PERCENT, 2),
                'Result_CashOnCashReturn': format_value(self.Result_EstCashOnCashReturn, pretty_print, NumberType.PERCENT, 2),
                'Result_DebtCoverageRatio': format_value(self.Result_EstDebtCoverageRatio, pretty_print, NumberType.PERCENT, 2),
                'Result_ExpenseRatio': format_value(self.Result_EstExpenseRatio, pretty_print, NumberType.PERCENT, 2),
                'Result_MonthlyRent': format_value(self.Result_EstMonthlyRent, pretty_print, NumberType.CURRENCY),
                'Result_NetIncomeMultiplier': format_value(self.Result_EstNetIncomeMultiplier, pretty_print, NumberType.PERCENT, 2),
                'Result_GrossRentMultiplier': format_value(self.Result_GrossRentMultiplier, pretty_print, NumberType.PERCENT, 2),   
            }
        }

        # if it's a multi-family home, include current financials as well
        if (self.mp_style == 7 and self.folio_property):
            results['subject_property']['number_of_units'] = self.number_of_units
            if self.number_of_units <= 6:
                results['cma_results']['Result_EstMonthlyRent_Units'] = self.Units
                results['cma_results']['Result_MaxRentDiff'] = self.max_rent_diff
                for unit in self.Units:
                    unit_num = unit['UnitNum']
                    paramname = f'monthly_rent_unit{unit_num}'
                    results['params'][paramname] = unit['EstMonthlyRent']
                    
        # Check flag for including CMA props
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
        
        results['area_comps'] = self.area_comps
        results['area_rentals'] = self.area_rentals
        
        print("DSDSDS<><><> get_results: results = ", results)
        return results   
# end FolioSubjectProperty

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