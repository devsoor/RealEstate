import sys
import logging
import pymysql
import boto3
import traceback

region_name='us-west-2'

# Create the SSM Client
# ssm = boto3.client('ssm',
#     region_name=region_name
# )

client = boto3.client('ssm', region_name='us-west-2')

logger = logging.getLogger()
class RpDatabase:
    db_host = ''
    db_username = ''
    db_password = ''
    db_name = ''
    conn = None

    def __init__(self):
        params = self.get_parameters(['db_host', 'db_name', 'db_user', 'db_pw'])
        self.db_host = params['db_host']
        self.db_username = params['db_user'] 
        self.db_password = params['db_pw']
        self.db_name = params['db_name']

    def get_connection(self):
        if (not self.conn or not self.conn.open):
            try:
                logger.info('connecting to ' + self.db_host)
                self.conn = pymysql.connect(self.db_host, user=self.db_username, passwd=self.db_password, db=self.db_name, connect_timeout=5)
            except:
                logger.error("ERROR: Unexpected error: Could not connect to MySql instance.")
                sys.exit()

            logger.info("SUCCESS: Connection to RDS mysql instance succeeded")
        else:
            logger.info("using existing connection")
        return self.conn

    def get_parameters(self, param_names):
        """
        This function reads a secure parameter from AWS' SSM service.
        The request must be passed a valid parameter name, as well as 
        temporary credentials which can be used to access the parameter.
        The parameter's value is returned.
        """
        # Get the requested parameter
        response = client.get_parameters(
            Names=param_names,
            WithDecryption=True
        )
        
        params = {}
        # Store the params in a variable
        for param in response['Parameters']:
            name = param['Name']
            params[name] = param['Value']

        return params

    def get_property(self, unique_id, ptype):
        conn = self.get_connection()
        table = conn.escape_string('mp' + ptype.upper())
        listing_id = unique_id.split('-')[1]
        try:
            with conn.cursor() as cursor:
                # Read a single record
                sql = "SELECT * FROM " + table + " WHERE LN=%s"
                cursor.execute(sql, (listing_id))
                result = cursor.fetchone()
                if (result):
                    prop = dict((cursor.description[i][0], value) for i, value in enumerate(result))
                    for field_name, field_type in resi_fields.items():
                        coded_values = prop.get(field_name)
                        if (coded_values):
                            decoded_values = self.decode_values(field_name, field_type, coded_values)
                            prop[field_name] = ", ".join(decoded_values)
                    return prop
        except:
            print("an error occurred executing the sql statement", sys.exc_info()[0])
            traceback.print_exc()
            raise

    def decode_values(self, field_name, field_type, valueStr):
        conn = self.get_connection()
        try:
            with conn.cursor() as cursor:
                if (field_type == 'Lookup'):
                    coded_values =  valueStr.split('|')
                    coded_values_ary = str(coded_values)[1:-1]
                    sql = "SELECT NWMLS_VALUE_CODE, NWMLS_VALUE_DESCR FROM NWMLS_Amenities WHERE NWMLS_Field_Name='{name}' AND NWMLS_Value_Code IN ({values})".format(name=field_name, values=coded_values_ary)
                    cursor.execute(sql)
                    rows = cursor.fetchall()
                    decoded_values = []
                    for row in rows:
                        decoded_values.append(row[1])

                    return decoded_values
        except:
            print("an error occurred decoding the values", sys.exc_info()[0])
            traceback.print_exc()
            raise

resi_fields = {
    'STY': 'Lookup',
    'FEA': 'Lookup',
    'FLS': 'Lookup',
    'APS': 'Lookup',
    'ENS': 'Lookup',
    'HTC': 'Lookup',
    'ECRT': 'Lookup',
    'EXT': 'Lookup',
    'FND': 'Lookup',
    'LTV': 'Lookup',
    'SWR': 'Lookup',
    'WAS': 'Lookup',
    'GR': 'Lookup',
    'ARC': 'Lookup',
    'SIT': 'Lookup',
    'LDE': 'Lookup',
    'VEW': 'Lookup',
    'POL': 'Lookup',
    'RF': 'Lookup',
    'TRM': 'Lookup',
    # COND
    'PKG': 'Lookup',
    'HOI': 'Lookup',
    'TOF': 'Lookup',
    'CMN': 'Lookup',
    # MANU
    'MHF': 'Lookup',
    'OTR': 'Lookup',
    'ANC': 'Lookup',
    'LEQ': 'Lookup',
    'PKA': 'Lookup',
    #MULT
    'GZC': 'Lookup',
    #VACL
    'FTR': 'Lookup',
    'ELE': 'Lookup',
    'WTR': 'Lookup',
}