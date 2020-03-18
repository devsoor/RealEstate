import json
import sys  
import traceback
sys.path.append('vendor')
sys.path.append('src')

from random import randint
from lambda_decorators import cors_headers
from datetime import datetime
import uuid

from report import Report
from saved_search import SavedSearch

def get_claims(event):
    claims =  event['requestContext']['authorizer']['claims']
    return json.loads(claims)

def get_user(event):
    try:
        claims =  get_claims(event)
        user = claims['cognito:username']
        return user
    except KeyError:
        traceback.print_exc()
        return None

def get_tenant(event):
    try:
        claims =  get_claims(event)
        tenant_id = claims['custom:tenantid']
        return tenant_id
    except KeyError:
        traceback.print_exc()
        return None

@cors_headers
def create_report(event, context):
    try:
        if ("body" in event):
            report_data = json.loads(event["body"])
        else:
            raise ValueError("No Event Body")
        
        user = get_user(event)
        if (not user):
            response = {
                "statusCode": 403,
                "body": "You must be logged in to create a report"
            }
            return response

        # report_data["properties"] = report_data.pop("results")

        report_data["owner"] = user
        report_data["id"] = str(uuid.uuid4())
        
        report = Report.from_dict(report_data)
        report.save()
        print("saving report")

        response = {
            "statusCode": 200,
            "body": json.dumps(report.__dict__, default=str)
        }
        return response
    except ValueError as e:
        body = {
            "error": str(e)
        }
        response = {
            "statusCode": 500,
            "body": json.dumps(body)
        }
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        body = {
            "message": "Your function encountered an error",
            "input": event
        }
        response = {
            "statusCode": 500,
            "body": json.dumps(body)
        }
    return response

@cors_headers
def update_report(event, context):
    user = get_user(event)
    if (not user):
        response = {
            "statusCode": 403,
            "body": "Authorized user not found"
        }
        return response
    if ("body" in event):
        report_data = json.loads(event["body"])
    else:
        raise ValueError("No Event Body")

    try:
        report_id = event['pathParameters']['id']
        print("UPDATE REPORT  user:" +user+  " id:" + report_id )
        
        new_name = report_data.get("name")
        report = Report.rename_report(user, report_id, new_name)
        response = {
            "statusCode": 200,
            "body": json.dumps(report, default=str)
        }

        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 404,
            "body": "Report not found"
        }
        return response

@cors_headers
def update_saved_search(event, context):
    user = get_user(event)
    if ("body" in event):
        new_settings = json.loads(event["body"])
    else:
        raise ValueError("No Event Body")

    try:
        saved_search_id = event['pathParameters']['id']
        print("UPDATE SAVED SEARCH  user:" +user+  " id:" + saved_search_id )

        saved_search = SavedSearch.get_saved_search(user, saved_search_id)
        saved_search.update_settings(new_settings)
        saved_search.save()
        response = {
            "statusCode": 200,
            "body": json.dumps(saved_search.__dict__, default=str)
        }

        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 404,
            "body": "Saved Search not found"
        }
        return response

@cors_headers
def get_report(event, context):
    user = get_user(event)
    tenant_id = get_tenant(event)

    if (not user or not tenant_id):
        response = {
            "statusCode": 403,
            "body": "Authorized user not found"
        }
        return response
    
    try:
        report_id = event['pathParameters']['id']
        print("GET REPORT  user:" +user+  " id:" + report_id )
        report = Report.get_report(tenant_id, user, report_id)
        response = {
            "statusCode": 200,
            "body": json.dumps(report, default=str)
        }

        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 404,
            "body": "Report not found"
        }
        return response
    

@cors_headers
def get_reports(event, context):
    user = get_user(event)
    if (not user):
        response = {
            "statusCode": 403,
            "body": "Authorized user not found"
        }
        return response

    reports = Report.get_reports_for_user(user)
    print(json.dumps(reports, default=str))

    response = {
        "statusCode": 200,
        "body": json.dumps(reports, default=str)
    }

    return response

@cors_headers
def delete_report(event, context):
    user = get_user(event)
    if (not user):
        response = {
            "statusCode": 403,
            "body": "Authorized user not found"
        }
        return response
    
    try:
        report_id = event['pathParameters']['id']
        print("DELETE REPORT  user:" +user+  " id:" + report_id )
        Report.delete_report(user, report_id)
        response = {
            "statusCode": 200
        }

        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 404,
            "body": "Report not found"
        }
        return response

@cors_headers
def create_saved_search(event, context):
    try:
        if ("body" in event):
            saved_search_data = json.loads(event["body"])
        else:
            raise ValueError("No Event Body")
        
        user = get_user(event)
        saved_search = SavedSearch.create(user, saved_search_data)
        
        saved_search_save_debug = saved_search.save()
        print(saved_search_save_debug)

        response = {
            "statusCode": 200,
            "body": json.dumps(saved_search.__dict__, default=str)
        }
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        body = {
            "message": "Your function encountered an error",
            "input": event
        }
        response = {
            "statusCode": 500,
            "body": json.dumps(body)
        }
    return response

@cors_headers
def get_saved_search(event, context):
    user = get_user(event)
    if (not user):
        response = {
            "statusCode": 403,
            "body": "Authorized user not found"
        }
        return response
    
    try:
        saved_search_id = event['pathParameters']['id']
        print("GET SAVED SEARCH  user:" +user+  " id:" + saved_search_id )
        saved_search = SavedSearch.get_saved_search(user, saved_search_id)
        response = {
            "statusCode": 200,
            "body": json.dumps(saved_search.__dict__, default=str)
        }

        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 404,
            "body": "Saved Search not found"
        }
        return response
    

@cors_headers
def get_saved_searches(event, context):
    user = get_user(event)
    if (not user):
        response = {
            "statusCode": 403,
            "body": "Authorized user not found"
        }
        return response

    saved_searches = SavedSearch.get_saved_searches_for_user(user)
    print(json.dumps(saved_searches, default=str))

    response = {
        "statusCode": 200,
        "body": json.dumps(saved_searches, default=str)
    }

    return response

@cors_headers
def delete_saved_search(event, context):
    user = get_user(event)

    try:
        id = event['pathParameters']['id']
        print("DELETE SAVED SEARCH  user:" +user+  " id:" + id )
        SavedSearch.delete_saved_search(user, id)
        response = {
            "statusCode": 200
        }

        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        traceback.print_exc()

        response = {
            "statusCode": 404,
            "body": "Saved Search not found"
        }
        return response