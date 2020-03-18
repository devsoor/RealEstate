import datetime
import json
from cma_folioproperty import FolioSubjectProperty


import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
from portfolio import PortFolio

dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
property_tax_table = dynamodb.Table('PropertyTaxRates')
property_taxbycity_table = dynamodb.Table('PropertyTaxByCityRates')

# parameters that the investor is allowed to override
user_param_list = [
		'improvements','downpayment_percent','closing_costs_percent','mortgage_interest_rate','insurance_rate', 
		'property_tax_rate','vacancy_rate','maintenance_percent','property_mgmt_percent','hoa_yr',
		'amortization_yrs','payments_yr','monthly_rent', 'monthly_rent_unit1', 'monthly_rent_unit2','monthly_rent_unit3','monthly_rent_unit4',
        'purchase_price_type', 'purchase_price','cash_flow_criteria', 'cap_rate_criteria', 'rent_to_value_criteria', 'success_criteria',
        'comp_max_dist', 'comp_max_days', 'comp_max_num_props', 'rental_max_dist', 'rental_max_days', 'rental_max_num_props'
]

# List of CMA parameters for calculations
req_param_list = [
        'market_vacancy_rate', 'market_cap_rate', 'purchase_price', 'closing_costs','original_loan', 'current_improvements', 'current_loan',
        'current_monthly_rent', 'current_monthly_rent_unit1', 'current_monthly_rent_unit2','current_monthly_rent_unit3','current_monthly_rent_unit4', 'current_other_monthly_income',
        'monthly_mortgage', 'annual_property_taxes', 'annual_insurance', 'annual_maintenance', 'annual_utilities',
		'property_mgmt_percent','monthly_hoa_dues', 'other_expenses', 'broker_commission', 'excise_tax',
        'improvements','downpayment_percent','closing_costs_percent','mortgage_interest_rate','insurance_rate',
		'property_tax_rate','property_tax_rate_auto','vacancy_rate','maintenance_percent','property_mgmt_percent','hoa_yr',
		'amortization_yrs','payments_yr','monthly_rent', 'monthly_rent_unit1', 'monthly_rent_unit2','monthly_rent_unit3','monthly_rent_unit4',
        'purchase_price_type', 'purchase_price','cash_flow_criteria', 'cap_rate_criteria', 'rent_to_value_criteria', 'success_criteria',
		'comp_max_dist', 'comp_max_age_diff', 'comp_max_days', 'comp_max_sqft_diff', 'comp_max_bed_diff',
		'comp_max_bath_diff','comp_min_num_props','comp_max_num_props','rental_max_dist', 'rental_max_age_diff',
		'rental_max_days','rental_max_sqft_diff', 'rental_max_bed_diff', 'rental_max_bath_diff',
		'rental_min_num_props','rental_max_num_props','comp_dist_score_weight','comp_age_score_weight',
		'comp_days_score_weight','comp_sqft_score_weight','comp_bed_score_weight','comp_bath_score_weight',
		'comp_style_score_weight','rental_dist_score_weight','rental_age_score_weight','rental_days_score_weight',
		'rental_sqft_score_weight','rental_bed_score_weight','rental_bath_score_weight','rental_style_score_weight', 'rental_adjustment_mult',
		'comp_style_match_type','rental_style_match_type'
]

class CmaCalculator:
    # Init dict to hold param:value pairs consisting of all params and their values
    req_param_values = []

    # request_options = {}
    # user_request_params = {} #parameters that the user can change
    # cma_pretty_option = False           # Init and check for presence of pretty_money option flag (monetary value formatting)
    # cma_properties_option = False
    # area_properties_option = False
    # market_value_option = False

    def __init__(self, session, database, site_id, user_id, assumptions):
        self.database = database
        tenant_connection = session.resource('dynamodb', region_name='us-west-2')
        self.criteria_table = tenant_connection.Table('CmaCriteria')
        self.site_id = site_id
        self.user_id = user_id
        self.req_param_values = []
        self.folio_property = []

        print("DSDSDSDS<><><><> CmaCalculator: init: assumptions = ", assumptions)
        self.req_param_values = assumptions
        print("DSDSDSDS<><><><>  CmaCalculator: init: self.req_param_values = ", self.req_param_values)

        # for param in req_param_list:
        #     print("DSDSDSDS<><><><>  CmaCalculator: init: param = ", param)
        #     self.req_param_values[param] = assumptions[param]
        #     print("DSDSDSDS<><><><>  CmaCalculator: init: self.req_param_values[param] = ", self.req_param_values[param])

        # print("CmaCalculator: init: self.req_param_values = ", self.req_param_values)

        # Check/init the other request options
        # request_options = request_options or {}
        # self.cma_pretty_option = bool(request_options.get('pretty_money'))
        # self.cma_properties_option = bool(request_options.get('cma_properties'))
        # self.area_properties_option = bool(request_options.get('area_properties'))
        # self.request_options = request_options
        self.__extractParams__()

    # lookup the missing params from the default values
    def __lookupParams__(self):
        criteria_table = self.criteria_table
        req_param_values = self.req_param_values
        try:
            response = criteria_table.get_item(Key={'siteId': '__DEFAULT__' })
            platform_assumptions = response['Item']
            response = criteria_table.get_item(Key={'siteId': self.site_id })
            # if the site assumptions haven't been overridden, then response will not have Item and just return an empty dictionary
            site_assumptions = response.get('Item', {})
        except ClientError as e:
            print(e.response['Error']['Message'])
            return None

        # return a merged dictionary with values from site_assumptions replacing those from platform_assumptions

        criteria = {**platform_assumptions, **site_assumptions}
        # Get property search, matching, and scoring options into arrays.
        # Note that the keys are the same between comp and rental options.
        # It's that way so that the cma code can use a common set of values,
        # regardless of whether the cma is being done for property value comp
        # or rental comp analysis.

        comp_prop_match_options = {
            'MaxDist':      int(criteria['comp_max_dist']),
            'MaxAgeDiff':   int(criteria['comp_max_age_diff']),
            'MaxDays':      int(criteria['comp_max_days']),
            'MaxSqftDiff':  int(criteria['comp_max_sqft_diff']),
            'MaxBedDiff':   int(criteria['comp_max_bed_diff']),
            'MaxBathDiff':  int(criteria['comp_max_bath_diff']),
            'MinNumProps':  int(criteria['comp_min_num_props']),
            'MaxNumProps':  int(criteria['comp_max_num_props']),
            'StyleMatchType':criteria['comp_style_match_type']
        }

        rental_prop_match_options = {
            'MaxDist':      int(criteria['rental_max_dist']),
            'MaxAgeDiff':   int(criteria['rental_max_age_diff']),
            'MaxDays':      int(criteria['rental_max_days']),
            'MaxSqftDiff':  int(criteria['rental_max_sqft_diff']),
            'MaxBedDiff':   int(criteria['rental_max_bed_diff']),
            'MaxBathDiff':  int(criteria['rental_max_bath_diff']),
            'MinNumProps':  int(criteria['rental_min_num_props']),
            'MaxNumProps':  int(criteria['rental_max_num_props']),
            'StyleMatchType':criteria['rental_style_match_type']
        }

        comp_scoring_weights = {
            'DistWeight':   int(criteria['comp_dist_score_weight']),
            'AgeWeight':    int(criteria['comp_age_score_weight']),
            'DaysWeight':   int(criteria['comp_days_score_weight']),
            'SqftWeight':   int(criteria['comp_sqft_score_weight']),
            'BedWeight':    int(criteria['comp_bed_score_weight']),
            'BathWeight':   int(criteria['comp_bath_score_weight']),
            'StyleWeight':  int(criteria['comp_style_score_weight'])
        }

        rental_scoring_weights = {
            'DistWeight':   int(criteria['rental_dist_score_weight']),
            'AgeWeight':    int(criteria['rental_age_score_weight']),
            'DaysWeight':   int(criteria['rental_days_score_weight']),
            'SqftWeight':   int(criteria['rental_sqft_score_weight']),
            'BedWeight':    int(criteria['rental_bed_score_weight']),
            'BathWeight':   int(criteria['rental_bath_score_weight']),
            'StyleWeight':  int(criteria['rental_style_score_weight']),
            'RentAdjustmentMult':  float(criteria['rental_adjustment_mult'])
        }


        # Add prop match options and scoring weights to param value array
        req_param_values['comp_prop_match_options'] = comp_prop_match_options
        req_param_values['rental_prop_match_options'] = rental_prop_match_options
        req_param_values['comp_scoring_weights'] = comp_scoring_weights
        req_param_values['rental_scoring_weights'] = rental_scoring_weights

    def __extractParams__(self):
        req_param_values = self.req_param_values

        # Convert percent values to actual percent for calculations and add to parameter values
        req_param_values['cap_rate_criteria_pcnt'] = float(req_param_values['cap_rate_criteria']) / 100.0
        req_param_values['rent_to_value_criteria_pcnt'] = float(req_param_values['rent_to_value_criteria']) / 100.0
        req_param_values['downpayment_percent_pcnt'] = float(req_param_values['downpayment_percent']) / 100.0
        req_param_values['insurance_rate_pcnt'] = float(req_param_values['insurance_rate']) / 100.0
        req_param_values['mortgage_interest_rate_pcnt'] = float(req_param_values['mortgage_interest_rate']) / 100.0
        req_param_values['property_tax_rate_pcnt'] = float(req_param_values['property_tax_rate']) / 100.0
        req_param_values['maintenance_percent_pcnt'] = float(req_param_values['maintenance_percent']) / 100.0
        req_param_values['vacancy_rate_pcnt'] = float(req_param_values['vacancy_rate']) / 100.0
        req_param_values['closing_costs_percent_pcnt'] = float(req_param_values['closing_costs_percent']) / 100.0
        req_param_values['property_mgmt_percent_pcnt'] = float(req_param_values['property_mgmt_percent']) / 100.0
        req_param_values['comp_max_dist'] = int(req_param_values['comp_max_dist'])
        req_param_values['comp_max_days'] = int(req_param_values['comp_max_days'])
        req_param_values['comp_max_num_props'] = int(req_param_values['comp_max_num_props'])
        req_param_values['rental_max_dist'] = int(req_param_values['rental_max_dist'])
        req_param_values['rental_max_days'] = int(req_param_values['rental_max_days'])
        req_param_values['rental_max_num_props'] = int(req_param_values['rental_max_num_props'])
        
        # try to get from the request, but if they aren't there, then look them up
        try:
            # Get property search, matching, and scoring options into arrays.
            # Note that the keys are the same between comp and rental options.
            # It's that way so that the cma code can use a common set of values,
            # regardless of whether the cma is being done for property value comp
            # or rental comp analysis.
            comp_prop_match_options = {
                'MaxDist':      int(req_param_values['comp_max_dist']),
                'MaxAgeDiff':   int(req_param_values['comp_max_age_diff']),
                'MaxDays':      int(req_param_values['comp_max_days']),
                'MaxSqftDiff':  int(req_param_values['comp_max_sqft_diff']),
                'MaxBedDiff':   int(req_param_values['comp_max_bed_diff']),
                'MaxBathDiff':  int(req_param_values['comp_max_bath_diff']),
                'MinNumProps':  int(req_param_values['comp_min_num_props']),
                'MaxNumProps':  int(req_param_values['comp_max_num_props']),
                'StyleMatchType':req_param_values['comp_style_match_type']
            }

            rental_prop_match_options = {
                'MaxDist':      int(req_param_values['rental_max_dist']),
                'MaxAgeDiff':   int(req_param_values['rental_max_age_diff']),
                'MaxDays':      int(req_param_values['rental_max_days']),
                'MaxSqftDiff':  int(req_param_values['rental_max_sqft_diff']),
                'MaxBedDiff':   int(req_param_values['rental_max_bed_diff']),
                'MaxBathDiff':  int(req_param_values['rental_max_bath_diff']),
                'MinNumProps':  int(req_param_values['rental_min_num_props']),
                'MaxNumProps':  int(req_param_values['rental_max_num_props']),
                'StyleMatchType':req_param_values['rental_style_match_type']
            }

            comp_scoring_weights = {
                'DistWeight':   int(req_param_values['comp_dist_score_weight']),
                'AgeWeight':    int(req_param_values['comp_age_score_weight']),
                'DaysWeight':   int(req_param_values['comp_days_score_weight']),
                'SqftWeight':   int(req_param_values['comp_sqft_score_weight']),
                'BedWeight':    int(req_param_values['comp_bed_score_weight']),
                'BathWeight':   int(req_param_values['comp_bath_score_weight']),
                'StyleWeight':  int(req_param_values['comp_style_score_weight'])
            }

            rental_scoring_weights = {
                'DistWeight':   int(req_param_values['rental_dist_score_weight']),
                'AgeWeight':    int(req_param_values['rental_age_score_weight']),
                'DaysWeight':   int(req_param_values['rental_days_score_weight']),
                'SqftWeight':   int(req_param_values['rental_sqft_score_weight']),
                'BedWeight':    int(req_param_values['rental_bed_score_weight']),
                'BathWeight':   int(req_param_values['rental_bath_score_weight']),
                'StyleWeight':  int(req_param_values['rental_style_score_weight']),
                'RentAdjustmentMult':  float(req_param_values['rental_adjustment_mult'])
            }

            # Add prop match options and scoring weights to param value array
            req_param_values['comp_prop_match_options'] = comp_prop_match_options
            req_param_values['rental_prop_match_options'] = rental_prop_match_options
            req_param_values['comp_scoring_weights'] = comp_scoring_weights
            req_param_values['rental_scoring_weights'] = rental_scoring_weights
        except (KeyError, TypeError):
            print('parameter not found.  looking up default values')
            self.__lookupParams__()

    def __extractUserParams__(self, property_id):
        f = PortFolio.get_folio_property(self.user_id, property_id)
        self.folio_property = f.folio_property
        print("DSDSDSDS<><><><> __extractUserParams__: self.folio_property = ", self.folio_property)

        for param in self.folio_property:
            self.req_param_values[param] = self.folio_property.get(param)
            
        # Convert percent values to actual percent for calculations and add to parameter values
        self.req_param_values['market_vacancy_rate'] = float(self.folio_property['market_vacancy_rate']) / 100.0
        self.req_param_values['market_cap_rate'] = float(self.folio_property['market_cap_rate']) / 100.0
        self.req_param_values['broker_commission'] = float(self.folio_property['broker_commission']) / 100.0
        self.req_param_values['excise_tax'] = float(self.folio_property['excise_tax']) / 100.0
        print("DSDSDSDS<><><><> __extractUserParams__: self.req_param_values = ", self.req_param_values)

    def __lookupPropertyTax__(self, county):
        print('looking up property tax for ' + county)
        try:
            prop_tax_response = property_tax_table.get_item(Key={'county': county })
        except ClientError as e:
            print(e.response['Error']['Message'])
            return None

        prop_tax = prop_tax_response['Item']['rate']
        print('found property tax for ' + county + ": " + str(prop_tax))
        return prop_tax
        
    def calculate(self, property_id, debug=False):
        # Get the subject listing
        print("cma:calculate: property_id = ", property_id)

        if (property_id):
            # Create Subject Property for listing and perform analysis
            self.__extractUserParams__(property_id)
            print("DSDSDSDS<><><><>  CmaCalculator: calculate: FINAL self.req_param_values = ", self.req_param_values)
            if 'property_tax_rate_auto' in self.req_param_values and self.req_param_values['property_tax_rate_auto']:
                tax_rate = self.__lookupPropertyTax__(self.folio_property['county'])
            if tax_rate:
                self.req_param_values['property_tax_rate_pcnt'] = tax_rate
            subject_property = FolioSubjectProperty(property_id, self.folio_property, self.req_param_values)
            subject_property.calculate_cma(debug)
            result = {
                'cma': subject_property.get_results()
            }

            # Check if pretty option is set
            # if (self.cma_pretty_option):			
                # Get pretty sections and their respective values
                # subject_property_values = subject_property.get_subject_property_values(null, $pretty_money);
                # $investment_analysis_results = $subject_property->get_subject_property_investment_analysis_results(null, $pretty_money);
                # $investment_analysis_data = $subject_property->get_subject_property_investment_analysis_data(null, $pretty_money);
                # $investment_criteria_results = $subject_property->get_subject_property_investment_criteria_results(null, $pretty_money);
			
                # result['subject_property_values'] = subject_property_values
                # $result['investment_analysis_results'] = $investment_analysis_results;
                # $result['investment_analysis_data'] = $investment_analysis_data;
                # $result['investment_criteria_results'] = $investment_criteria_results;
		
            print("calculate analyze: result = ", result)
            return result
        else:
            print('skipping CMA calculation')

