import os

config = {
    'aws_region': os.environ['AWS_REGION'],
    'cognito_region': os.environ['AWS_REGION'],
    'account_id': '450322736372',
    # domain: process.env.SERVICE_URL,
    # service_url: prod.protocol + process.env.SERVICE_URL,
    # name: name,
    'domainName': 'invest.realpeek.com',
    'table': {
        'user': 'Users',
        'tenant': 'Tenants',
        'cma_criteria': 'CmaCriteria',
        'assumptions': 'Assumptions'
    },
    'userRole': {
        'systemAdmin' : 'SystemAdmin',
        'systemUser' : 'SystemUser',
        'tenantAdmin' : 'site_admin',
        'tenantMember' : 'site_member',
        'tenantUser' : 'site_user'
    }
}