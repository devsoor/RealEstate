import json
from datetime import datetime

dictfilt = lambda x, y: dict([ (i,x[i]) for i in x if i in set(y) ])
notdictfilt = lambda x, y: dict([ (i,x[i]) for i in x if i not in set(y) ])
class Assumptions:
    user_params = ["success_criteria", 
        "cash_flow_criteria", 
        "cap_rate_criteria", 
        "rent_to_value_criteria",
		"improvements",
		"downpayment_percent",
		"mortgage_interest_rate",
		"property_tax_rate",
        "property_tax_rate_auto",
		"maintenance_percent",
		"vacancy_rate",
		"closing_costs_percent",
		"property_mgmt_percent",
		"insurance_rate",
		"hoa_yr",
		"amortization_yrs",
		"payments_yr",
		"monthly_rent",
        "downpayment_amount",
        "purchase_price_type", 
        "purchase_price",
        "comp_max_dist",
        "comp_max_days",
        "comp_max_num_props",
        "rental_max_dist",
        "rental_max_days",
        "rental_max_num_props"
    ]
    site_params = ['comp_max_dist', 'comp_max_age_diff', 'comp_max_days', 'comp_max_sqft_diff', 'comp_max_bed_diff', 'comp_max_num_props',
		'comp_max_bath_diff', 'rental_max_dist', 'rental_max_age_diff', 'rental_max_days','rental_max_sqft_diff', 'rental_max_bed_diff', 'rental_max_bath_diff', 'rental_max_num_props']

    def __init__(self, user, site_id, assumptions_dict):
        self.site_assumptions = dictfilt(assumptions_dict, self.site_params)
        self.global_criteria = assumptions_dict
        self.user_id = user
        self.site_id = site_id

        user_assumptions = dictfilt(assumptions_dict, self.user_params)
        self.user_assumptions = user_assumptions
        self.user_assumptions['userId'] = user
        self.site_assumptions['siteId'] = site_id
        self.date = datetime.now().isoformat()

