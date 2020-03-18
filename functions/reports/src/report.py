import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
tenants_table = dynamodb.Table('Tenants')
from datetime import datetime
from user_object import UserObject

report_version = 1
prop_fields_to_save = [ "unique_id", "listing_id", "address", "street_address", "city", "state", "zipcode", "price", "bedrooms", "bathrooms", "sqft", "year_built", "hoa_dues", "ptype", "mp_style_name"]
def include_keys(dictionary, keys):
    """Filters a dict by only including certain keys."""
    if dictionary is None:
        return {}

    key_set = set(keys) & set(dictionary.keys())
    return {key: dictionary[key] for key in key_set}

class Report(UserObject):

    #def __init__(self):
        #use from_dict

    table_name = "Reports"

    @classmethod
    def from_dict(cls, adict):
        sanitized_properties = []
        for prop in adict["properties"]:
            cma_analysis = include_keys(prop.get("cma"), ["cma", "parameters"])
            sanitized_cma = {
                "cma": include_keys(cma_analysis.get("cma"), ["cma_calc", "cma_results", "subject_property"]),
                "parameters": cma_analysis.get("parameters")
            }

            sanitized_details = include_keys(prop.get("details"), prop_fields_to_save)
            sanitized_prop = {
                "cma": sanitized_cma,
                "details": sanitized_details
            }
            sanitized_properties.append(sanitized_prop)

        if len(sanitized_properties) > 100:
            print('user attempted to create report with more than 100 properties.')
            raise ValueError('Reports must have fewer than 100 properties')

        report_dict = include_keys(adict, ["assumptions", "name", "owner", "id"])
        report_dict["version"] = report_version
        report_dict["properties"] = sanitized_properties
        report = super(Report, cls).from_dict(report_dict)
        print("sanitized dict")
        print(report_dict)
        return report

    @classmethod
    def get_reports_for_user(cls, user):
        attributesToGet = ["id", "date", "name"]
        #For now, the only reports accessible to a particular user are those for which it is the owner
        reports = super().get_user_objects_for_user(Report.table_name, user, attributesToGet)

        reports.sort(key=lambda x: x["date"], reverse=True)
        # for report in reports:
        #     report["properties"] = Report.json_unescape(report["properties"])
        #     report["assumptions"] = Report.json_unescape(report.get("assumptions"))
        
        return reports

    @classmethod
    def get_report(cls, tenant_id, owner, report_id):
        # report = reports_table.query(KeyConditionExpression=Key('owner').eq(owner) & Key('id').eq(report_id))
        
        try:
            settings_response = tenants_table.get_item(Key={'tenant_id': tenant_id})
        except ClientError as e:
            print(e.response['Error']['Message'])
        else:
            settings = settings_response['Item']
            report = super().get_user_object(Report.table_name, owner, report_id)
            
            report["properties"] = Report.json_unescape(report["properties"])
            report["assumptions"] = Report.json_unescape(report.get("assumptions"))
            report["agent"] = settings
            report["columns"] = [
                    { 'name': 'Address', 'field': 'details.street_address'},
                    { 'name': 'City', 'field': 'details.city'},
                    { 'name': 'State', 'field': 'details.state'},
                    { 'name': 'Zipcode', 'field': 'details.zipcode'},
                    { 'name': 'MLS ID', 'field': 'details.listing_id'},
                    { 'name': 'Price', 'field': 'details.price', 'type': 'currency'},
                    { 'name': 'Bed', 'field': 'details.bedrooms'},
                    { 'name': 'Bath', 'field': 'details.bathrooms'},
                    { 'name': 'Sqft', 'field': 'details.sqft'},
                    { 'name': '$/Sqft', 'field': 'cma.cma.subject_property.price_sqft', 'type': 'currency'},
                    { 'name': 'Year', 'field': 'details.year_built'},
                    { 'name': 'HOA', 'field': 'details.hoa_dues', 'type': 'currency'},
                    { 'name': 'Cashflow', 'field': 'cma.cma.cma_results.Result_CashFlow_Monthly', 'type': 'currency'},
                    { 'name': 'Cap Rate', 'field': 'cma.cma.cma_results.Result_CapRate', 'type': 'percent'},
                    { 'name': 'Rent2Value', 'field': 'cma.cma.cma_results.Result_RentValueRatio', 'type': 'percent'},
                    { 'name': 'Cash-On-Cash Return', 'field': 'cma.cma.cma_results.Result_CashOnCashReturn', 'type': 'percent'},
                    { 'name': 'Est. Market Value', 'field': 'cma.cma.cma_results.Result_EstMarketValue', 'type': 'currency'},
                    { 'name': 'Est. Monthly Rent', 'field': 'cma.cma.cma_results.Result_EstMonthlyRent', 'type': 'currency'},
                ]
            if report.get("version") != report_version:
                report["columns"] = [
                        { 'name': 'Address', 'field': 'details.address'},
                        { 'name': 'Price', 'field': 'details.price', 'type': 'currency'},
                        { 'name': 'Bed', 'field': 'details.bedrooms'},
                        { 'name': 'Bath', 'field': 'details.bathrooms'},
                        { 'name': 'Sqft', 'field': 'details.sqft'},
                        { 'name': '$/Sqft', 'field': 'cma.cma.subject_property.price_sqft', 'type': 'currency'},
                        { 'name': 'Year', 'field': 'details.year_built'},
                        { 'name': 'HOA', 'field': 'details.hoa_dues', 'type': 'currency'},
                        { 'name': 'Cashflow', 'field': 'cma.cma.cma_results.Result_CashFlow_Monthly', 'type': 'currency'},
                        { 'name': 'Cap Rate', 'field': 'cma.cma.cma_results.Result_CapRate', 'type': 'percent'},
                        { 'name': 'Rent2Value', 'field': 'cma.cma.cma_results.Result_RentValueRatio', 'type': 'percent'},
                        { 'name': 'Cash-On-Cash Return', 'field': 'cma.cma.cma_results.Result_CashOnCashReturn', 'type': 'percent'},
                        { 'name': 'Est. Market Value', 'field': 'cma.cma.cma_results.Result_EstMarketValue', 'type': 'currency'},
                        { 'name': 'Est. Monthly Rent', 'field': 'cma.cma.cma_results.Result_EstMonthlyRent', 'type': 'currency'},
                    ]
            firmName = settings.get('office_name')
            report['mlsdisclaimer'] = 'Disclaimer: The material provided in this document is for informational purposes only and should not be considered legal or financial advice. You should consult with your attorney, tax or financial advisor and perform your own research and due diligence before making investment decisions. {firmName} does not make any guarantee or promise as to any results that may be obtained from using our content. To the maximum extent permitted by law, {firmName} disclaims any and all liability in the event any information, commentary, analysis, opinions, advice and/or recommendations prove to be inaccurate, incomplete or unreliable, or result in any investment or other losses.'.format(firmName=firmName)
            current_year = int(datetime.now().year)
            report['mlscopyright'] = 'COPYRIGHT {year} NORTHWEST MULTIPLE LISTING SERVICE. ALL RIGHTS RESERVED.'.format(year=current_year)


            return report

    @classmethod
    def delete_report(cls, owner, report_id):
        #For now, the only reports accessible to a particular user are those for which it is the owner
        super().delete(Report.table_name, owner, report_id)

    @classmethod
    def rename_report(cls, owner, report_id, new_name):
        #For now, the only reports accessible to a particular user are those for which it is the owner
        updated_report = super().update_user_object(Report.table_name, owner, report_id, {"name": new_name})
        return updated_report

    def save(self):
        #self.created_at = datetime.now().isoformat()
        self.date = datetime.now().isoformat()
        escaped_report = self.__dict__
        escaped_report["properties"] = Report.json_escape(escaped_report["properties"])
        escaped_report["assumptions"] = Report.json_escape(escaped_report["assumptions"])
        return super().save(Report.table_name, escaped_report)
