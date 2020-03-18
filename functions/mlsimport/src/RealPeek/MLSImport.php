<?php

namespace RealPeek;

use \DateTime;
use \DateTimeZone;
use \DateInterval;
use \Exception;
use \XMLReader;
use \SimpleXMLElement;
use \DOMDocument;
use \Aws\Exception\AwsException;
use \Aws\Lambda\LambdaClient;
use Aws\Sns\SnsClient;


/**************************************************************
(c)Copyright 2017, 2018 CAPSERVA, INC.  All Rights Reserved.
This code is the intellectual property of CAPSERVA, INC.
The code cannot be modified, distributed, or used for
derivative works without the express written permission
of CAPSERVA, INC.  Any use of the code without the express
written permission of CAPSERVA, INC is a violation of these
terms and subject to legal action.  Questions regarding
licensing of the code may be sent via email to
licensing@capserva.com
**************************************************************/
//---------------------------------------------------------//

const XML_PROLOG = '<?xml version="1.0" encoding="utf-8"?>';
const LISTINGS_ELEMENT = '<Listings xmlns="http://www.nwmls.com/Schemas/Standard/StandardXML1_5.xsd">';
$listings_header = XML_PROLOG . PHP_EOL . LISTINGS_ELEMENT . PHP_EOL;
$listings_footer = '</Listings>';

global $SnsClient, $snsTopic, $stage;
$SnsClient = new SnsClient([
    'region' => 'us-west-2',
    'version' => '2010-03-31'
]);

$snsTopic = getenv('listingUpdatedTopic');
$stage = getenv('stage');

function get_mls_path() {
    $mls_path = '/tmp/mlsdata/nwmls/';  
    return $mls_path;
}


// Set default timezone, primarily for proper syncing with database
date_default_timezone_set('America/Los_Angeles');

// Earliest date of MLS records
global $MLS_EARLIEST_DATE;
$MLS_EARLIEST_DATE = '1990-01-01T00:00:00' . date('P');
//$MLS_EARLIEST_DATE = '2015-01-01T00:00:00' . date('P');


// Earliest date for imfage records (no timezone)
const EARLIEST_IMAGE_DATE = '1990-01-01T00:00:00';

// Array definining valid args for this script (key),
// as well as if the arg is compatible with Database
// insert/update (true=compatible, false=incompatible).
global $valid_cli_args;
$valid_cli_args = array(
    'PropertyType'=>true,
    'Status'=>true,
    'BeginDate'=>true,
    'EndDate'=>true,
    'ListingNumber'=>false,
    'County'=>false,
    'Area'=>false,
    'City'=>false,
    'OfficeId'=>false,
    'AgentId'=>false,
    'Bedrooms'=>false,
    'Bathrooms'=>false,
    'Filter'=>false,
    'update'=>true,
    'db_noreplace'=>true,
    'skipdb'=>false,
    'forcedb'=>false,
    'skipimg'=>false,
    'keepdata'=>true,
    'soaptest'=>true,
    'allLN'=>false
);

$GLOBALS['logger'];

class MLSImport
{
    public function __construct($params, $logger, $rp_config) {
        $GLOBALS['logger'] = $logger;
		$this->rp_config = $rp_config;
		$this->logger = $logger;

		$this->lambdaclient = LambdaClient::factory([
            'version' => 'latest',
            'region'  => 'us-west-2',
        ]);
	}
	
	function initial_import($prop_type, $params, $intervalInDays) {
		//global $MLS_EARLIEST_DATE;
        $MLS_EARLIEST_IMPORT_DATE = '2015-01-01T00:00:00' . date('P');
		if (!$prop_type) {
			throw new Exception("Please specify property type");
		}
		if ($params['BeginDate'] != null) {
            if (strcasecmp($params['BeginDate'], 'Earliest') == 0) {
				$params['BeginDate'] = $MLS_EARLIEST_IMPORT_DATE;
			} 
			else {
				$params['BeginDate'] = $params['BeginDate'] . date('P');
 			}
		}
		else {
			throw new Exception('Please specify a start date or "Earliest"');
		}
		$startDate = new DateTime($params['BeginDate']);
		$endDate= clone $startDate;
		$endDate->add(new DateInterval('P' . $intervalInDays . 'D'));
		$now = new DateTime();

		while($endDate < $now) {
			//Kick off lambda function to process listings individually
			$payload = [
				'PropertyType' => $prop_type,
				'BeginDate' => $startDate->format(DateTime::ATOM),
				'EndDate' => $endDate->format(DateTime::ATOM)
			];
			$result = $this->lambdaclient->invoke([
				'FunctionName' => 'mlsimport-'.$stage.'-updateListings',
				'InvocationType' => 'Event',
				'Payload' => json_encode($payload)
			]);
			println(json_encode($payload));
			//println($result);

			$startDate = clone $endDate;
			$endDate->add(new DateInterval('P' . $intervalInDays . 'D'));
		}
		
    }
    
    function update_member_data() {
        $logger = $this->logger;
        $rp_config = $this->rp_config;       

        try {
            // Connect to DB and initialize everything
            $mpDB = new MP_Database_Simple($rp_config, $logger);

            // Retrieve current members
            $members = get_member_data($rp_config);

            // Create/Update each member record in the DB
            $table = 'NWMLS_Members';
            // $count_members = 0;
            // foreach($members as $member) {
            //     $db_result = $mpDB->update_table($table, $member);
            //     $count_members++;
            // }

            $members_array = iterator_to_array($members, false);
            $count_members = count($members_array);
            $logger->info('Found ' . $count_members . ' NWMLS members.' . PHP_EOL);
            $mpDB->bulk_update_table_batched($table, $members_array);
            

            $log_entry = 'Member data updated in DB table: ' . $table . PHP_EOL;
            $logger->info($log_entry);         
        }
        catch(Exception $e) {
            println('An error occurred updating member data in the DB');
            println($e->getMessage());
            throw $e;
        }
        finally {
            if ($mpDB) $mpDB->close();
        }
    }

    function update_office_data() {
        $logger = $this->logger;
        $rp_config = $this->rp_config;       

        try {
            // Connect to DB and initialize everything
            $mpDB = new MP_Database_Simple($rp_config, $logger);

            // Retrieve current offices
            $offices = get_office_data($rp_config);

            // Create/Update each member record in the DB
            $table = 'NWMLS_Offices';
            
            $offices_array = iterator_to_array($offices, false);
            $count_offices = count($offices_array);
            $logger->info('Found ' . $count_offices . ' NWMLS offices.' . PHP_EOL);
            //$mpDB->bulk_update_table($table, $offices_array);
            $mpDB->bulk_update_table_batched($table, $offices_array);

            $log_entry = 'Office data updated in DB table: ' . $table . PHP_EOL;
            $logger->info($log_entry);         
        }
        catch(Exception $e) {
            println('An error occurred updating member data in the DB');
            println($e->getMessage());
            throw $e;
        }
        finally {
            if ($mpDB) $mpDB->close();
        }
    }
    
    function delete_expired_listings($prop_type) {
        try {
                
            $logger = $this->logger;
            $rp_config = $this->rp_config;
            global $MLS_EARLIEST_DATE;
            $batch_years = 5;

            $now = new DateTime();
            // Get default EndDate to use for queries (most recent quarter hour boundary)
            $default_mls_end_date_str = get_new_mls_end_date($now);

            // Caller must provide non-null values for PropertyType, BeginDate, EndDate
            $mlsParameters = array(
                'PropertyType'=>'RESI',  // MUST BE NON-NULL
                'Status'=>null, // null = ALL statuses
                'BeginDate'=>$MLS_EARLIEST_DATE,  // MUST BE NON-NULL
                'EndDate'=>$default_mls_end_date_str,  // MUST BE NON-NULL
                'ListingNumber'=>null,
                'County'=>null,
                'Area'=>null,
                'City'=>null,
                'OfficeId'=>null,
                'AgentId'=>null,
                'Bedrooms'=>null,
                'Bathrooms'=>null,
                'Filter'=>'LN'
            );
            if ($prop_type) {
                $prop_type = strtoupper($prop_type);
                $mlsParameters['PropertyType'] = $prop_type;
            } else {
                $errmsg = 'Invalid request!  You must specify PropertyType.';
                $logger->error($errmsg);
                throw new Exception($errmsg);
            }

            // Connect to DB and initialize everything
            $mpDB = new MP_Database($prop_type, false, false, $mlsParameters, $rp_config);

            $logger->info('Creating TEMP table');
            $tmp_table = 'CURRENT_MLS_LISTINGS';
            $mpDB->create_temp_table($tmp_table);
            // retrieve MLS listings in batches
            $startDate = new DateTime($mlsParameters['BeginDate']);
            $now = new DateTime();
            $total_listings = 0;

            while ($startDate < $now) {
                $endDate= clone $startDate;
                $endDate->add(new DateInterval('P' . $batch_years . 'Y'));

                $mlsParameters['BeginDate'] = get_mls_format_datetime($startDate);
                $mlsParameters['EndDate'] = get_mls_format_datetime($endDate);
                $result_file='';
                $listing_xml_name='';
                $logger->info('getting listings from '.$startDate->format('Y-m-d') . ' to ' . $endDate->format('Y-m-d'));
                $listings = get_listing_data($rp_config, $mlsParameters, $result_file, $listing_xml_name);
    
                $num_listings = iterator_count($listings);
                $total_listings += $num_listings;
                $logger->info('Found ' . $num_listings . ' listings in NWMLS');
                $logger->info('Importing to temp table');
                $mpDB->import_to_temp_table($tmp_table, $result_file, $listing_xml_name);
                $startDate = $endDate;
            }

            $logger->info('Found ' . $total_listings . ' listings in NWMLS');

            $db_result = $mpDB->query_table($tmp_table, 'LN', null, null, null);
            $num_rows = $db_result->num_rows;
            $logger->info('Found ' . $num_rows . ' listings in NWMLS TMP TABLE');
            
            $table = 'mp' . $prop_type;
            $image_table = $table . 'images';
            $db_columns = 'LN';
            $db_filters = ["`mpStatus` != 'U'"];

            $log_entry .= "Analyzing differences between LNs in NWMLS and local database." . PHP_EOL;
            $logger->info($log_entry);

            $db_result = $mpDB->get_difference($table, $tmp_table, $db_columns, $db_filters);

            //$db_result = $mpDB->query_table($table, $db_columns, $db_filters, null, null);
            
            // Get DB listing numbes into array
            $ln_diff = array();
            for ($index = 0; $index < $db_result->num_rows; $index++) {
                $record = $db_result->fetch_assoc();
                $record_ln = $record['LN'];
                array_push($ln_diff, $record_ln);
                println($record_ln);
            }

            $ln_diff_count = count($ln_diff);

            // Update log
            $log_entry = "There are $ln_diff_count listings in the local DB that are not in NWMLS." . PHP_EOL;
            $logger->info($log_entry);

            // If there are differences, cull listings from local DB
            if ($ln_diff_count) {

                // Update log
                $log_entry = "Starting update of local DB." . PHP_EOL;
                $logger->info($log_entry);

                // Set up update record to set our internal status code to 'U' (Unlisted).
                // Note:  The status of 'U' is internal to our logic.  It is not a valid status code for NWMLS.
                // It is used to denote a listing that no longer exists in NWMLS.
                $update_data = array( 'mpStatus'=>'U' );
                $image_update_data = array( 'ListingStatus'=>'U' );
                
                // Iterate over every diff listing, setting mpStatus to 'U' (Unlisted)
                $unlist_count = 0;
                foreach ($ln_diff as $unlist_ln) {
                    $logger->info("Unlisting: " . $unlist_ln . PHP_EOL);
                    try {
                        // Update listing for property type
                        $mpDB->update_database($table, $update_data, $unlist_ln, 'U');
                        
                        // Update image data record
                        $mpDB->update_database($image_table, $image_update_data, $unlist_ln, 'U');
                    }
                    catch (Exception $e) {
                        
                        $errmsg  = 'ERROR!  Could not process listing: ' . $unlist_ln . PHP_EOL;
                        $errmsg .= 'Detail: ' . $e->getMessage() . PHP_EOL;
                            
                        $logger->error($errmsg);
                        
                        // If error on first iteration, there's probably something serious wrong,
                        // so break out of loop.
                        if ($unlist_count == 0) break;
                    }
                    
                    $unlist_count++;
                }

                // Update log
                $log_entry = "inished update of local DB." . PHP_EOL;
                $logger->info($log_entry);
            }

            $mpDB->delete_temp_table($tmp_table);
            $logger->info('DELETING TMP TABLE');
            
            $log_entry = ' -- END LISTING CULL --' . PHP_EOL;
            $logger->info($log_entry);
            $mpDB->close();
        }
        catch(Exception $e) {
            $logger->error($e->getMessage());
            throw $e;
        }
        finally {
            //if ($mpDB) $mpDB->close();
        }
        return;
    }


    function start_import($argv, $cli_params, $logger) {
		$rp_config = $this->rp_config;
        // This will always be run via command line (either interactive or cron),
        // but still combine params using '&' (as if web params), then parse into
        // array of key=>value pairs (parse_str depends on & as delim).
        //parse_str(implode('&', array_slice($argv, 1)), $cli_params);
        
        // Flag if update, instead of manual load
        $is_update = isset($cli_params['update']);
        
        // Flag if DB noreplace mode
        $db_noreplace = isset($cli_params['db_noreplace']);
        
        // Flag if skipping DB update (use for test retrieve without update)
        $skipdb = isset($cli_params['skipdb']);

        // Flag if forcing DB update
        // Use with args that are usually incompatible with DB update
        $forcedb = isset($cli_params['forcedb']);
        
        // Flag if skipping image processing
        $skipimg = isset($cli_params['skipimg']);
        
        // Flag if results are filtered
        $is_filtered = isset($cli_params['Filter']);
        
        // Flag if a single Listing is being requested
        $single_listing = isset($cli_params['ListingNumber']);
        
        // Flag if user wants to keep MLS XML data file
        $keepdata = isset($cli_params['keepdata']);
        
        // Check if using a test soap file for input instead of calling NWMLS API
        $soaptest = isset($cli_params['soaptest']) ? $cli_params['soaptest'] : null;
        
        // Flag to write all listing numbers into text file
        $allLN = isset($cli_params['allLN']);

            // Check for incompatible options
        if ($skipdb && $forcedb) {
            println("Error!  You cannot specify both skipdb and forcedb!  That's crazy!!");
            exit(1);
        }
        
        if ($is_filtered && (!$skipdb || $forcedb)) {
            // Invalid combo!
            println("Error!  The Filter option cannot be used when updating the database!");
            exit(1);
        }

        // Check if image processing is active and Filter option specified
        if (!$skipimg && $is_filtered) {
            // Since image processing is active, must make sure certain fields are included in the Filter
            $filters = explode(',', $cli_params['Filter']);
            if (!in_array('ST', $filters) || !in_array('PIC', $filters)) {
                println("Error!  You must include ST and PIC in the Filter for image processing to work.");
                println("        You can skip image processing by including the skipimg option.");
                exit(1);
            }
        }

        global $valid_cli_args;
        $logger->info('valid args ' . $valid_cli_args);
        foreach ($cli_params as $param => $value) {
            // Exit with message if not a valid parameter
            if (!array_key_exists($param, $valid_cli_args)) {
                println("Error!  Invalid parameter:  $param");
                exit(1);
            } else {
                // Check if conflict between arg and DB update
                $dbcompt = $valid_cli_args[$param];
                if (!$skipdb && !$dbcompt && !$forcedb) {
                    println("Error!  Parameter '$param' is not compatible with DB operations.");
                    println("Did you forget to include the skipdb or forcedb option?");
                    println("Carefully consider what you want to do, and try again.");
                    exit(1);
                }
            }
        }

        // Get current date/time
        $now = new DateTime();
        $nowStr = $now->format(DateTime::ATOM);
        
        // Get yesteray begin and end date/time to use as defaults
        // BE SURE to first assign $now clone to $yesterdayBegin,
        // because when sub() is called, it modifies the values in
        // the object it's called upon!
        $yesterdayBegin = clone $now;
        // Back 1 day, set time to beginning, and get as string
        $yesterdayBeginStr = $yesterdayBegin->sub(new DateInterval('P1D'))->setTime(0,0,0)->format(DateTime::ATOM);
        //$yesterdayEnd = clone $yesterdayBegin;  // DON'T invoke setTime() here!
        // Set time to end and get as string
        //$yesterdayEndStr = $yesterdayEnd->setTime(23,59,59)->format(DateTime::ATOM);
        
        // Get default EndDate to use for queries (most recent quarter hour boundary)
        $default_mls_end_date_str = get_new_mls_end_date($now);
        
        // Caller must provide non-null values for PropertyType, BeginDate, EndDate
        $mlsParameters = array(
            'PropertyType'=>'RESI',  // MUST BE NON-NULL
            'Status'=>null,
            'BeginDate'=>$yesterdayBeginStr,  // MUST BE NON-NULL
            'EndDate'=>$default_mls_end_date_str,  // MUST BE NON-NULL
            'ListingNumber'=>null,
            'County'=>null,
            'Area'=>null,
            'City'=>null,
            'OfficeId'=>null,
            'AgentId'=>null,
            'Bedrooms'=>null,
            'Bathrooms'=>null,
            'Filter'=>null
        );

        // Loop looking for command line args to replace defaults
        foreach ($mlsParameters as $param => $default) {
            if (array_key_exists($param, $cli_params)) {
                $incoming = $cli_params[$param];
                if ($incoming != null && $incoming != '') {
                    // Allow for Status=ALL (change to null for NWMLS requirements)
                    if ($param == 'Status' && $incoming == 'ALL') $incoming = null;
                    $mlsParameters[$param] = $incoming;
                }
            }
        }

		global $MLS_EARLIEST_DATE;
        // Check for special 'Earliest' word for beginning date
        if ($mlsParameters['BeginDate'] != null) {
            if (strcasecmp($mlsParameters['BeginDate'], 'Earliest') == 0) {
				$mlsParameters['BeginDate'] = $MLS_EARLIEST_DATE;
            }
        }

        // Get PropertyType specified into separate variable,
        // since it's checked often.
        $prop_type = $mlsParameters['PropertyType'];
        
        // Get full command line request as one string, for logging
        $full_request = implode(' ', $argv);
        
        // Get proper status string to use in filenames
        $statusVal = $mlsParameters['Status'];
        $statusStr = ($statusVal == null) ? 'ALL' : $statusVal;

        $mls_path = get_mls_path();

        // create the directory if it doesn't exist
        if (!file_exists($mls_path . $prop_type)) {
            mkdir($mls_path . $prop_type, 0777, true);
        }
        // Get filename for storing result XML data
        $result_filename = $mls_path . $prop_type . '/nwmls_' . $prop_type . '_' . $statusStr;
        if ($single_listing) {
            $listing_number = $mlsParameters['ListingNumber'];
            $result_filename  .= "_$listing_number";
        } else if ($is_filtered) {
            $result_filename  .= '_filtered';
        }
        
        // Tack on extension to result filename
        $result_filename .= '.xml';
        
        // Get filename for storing listing numbers for image processing
        $image_ln_filename = $mls_path . $prop_type . '/nwmls_' . $prop_type . '_A_listings.txt';
        
        // Get filename for storing all listing numbers (used only if allLN flag is set)
        $all_ln_filename = $mls_path . $prop_type . '/nwmls_' . $prop_type . '_ALL_LN.txt';
        
        // Get filename for logging
        $log_filename = $mls_path . $prop_type . '/nwmls_' . $prop_type . '.log';
        
        // Init file & DB pointers before entering try/catch
        $logfile = null;
        $image_ln_file = null;
        $all_ln_file = null;
        $result_filep = null;
        $output_file_mode = 'wb';
        $mpDB = null;
        $nwmls_reader = null;
        $process_listings = true;
        $last_ln = 0;
        
        // Set processing mode, which depends on whether 'update' option is specified.
        // M=Manual Load, U=Update, R=Resumed Update
        $processing_mode = $is_update ? 'U' : 'M';
        $processing_mode_lookup = array('M'=>'Manual Load', 'U'=>'Update', 'R'=>'Resumed Update');

            
        // DEBUG
        //println("Processing Mode #1: '$processing_mode'");
        
        // Put most operations in try/catch, to handle possible exceptions
        try {
        
            // Initialize log file
            /////$logfile = fopen($log_filename, 'ab');
            $log_entry = $nowStr . ' -- BEGIN XML RETRIEVAL --' . PHP_EOL;
            $log_entry .= 'REQUEST="' . $full_request . '"' . PHP_EOL;
            /////fflush($logfile);
            
            // Connect to DB and get info needed before proceeding
            if (!$skipdb || $forcedb) {
                
                // Connect to DB and initialize everything
                $mpDB = new MP_Database($prop_type, $is_update, $db_noreplace, $mlsParameters, $rp_config);
                
                // Get processing mode value after DB init, in case it was changed
                // to Resumed Update (due to incomplete previous update).
                $processing_mode = $mpDB->get_processing_mode();
                
                // DEBUG
                //println("Processing Mode #2: '$processing_mode'");
                
                // Special init if Resumed mode
                if ($processing_mode == 'R') {
                    // If resuming a previous update, set file mode to append
                    $output_file_mode = 'ab';
                    
                    // Disable full processing of listings until LN of last
                    // update is reached.
                    $process_listings = false;
                    
                    // Get last LN processed in last update
                    $last_ln = $mpDB->get_update_mls_ln();
                    
                    // If last ln is 0 (never advanced in file last time), turn on processing
                    if ( ((int)$last_ln) == 0) $process_listings = true;
                }
            }
        
            $processing_mode_log_str = $processing_mode_lookup[$processing_mode];
            
            $log_entry .= "Processing Mode: $processing_mode_log_str" . PHP_EOL;
            $log_entry .= 'MLS PARAMETERS: ';
            $log_entry .= var_export($mlsParameters, true) . PHP_EOL;
            $logger->info($log_entry);  // replace log file writes with logger
            /////fwrite($logfile, $log_entry);
            /////fflush($logfile);
            
            // Make sure the mls request dates are valid
            if (!$single_listing && !is_valid_mls_request_dates($mlsParameters)) {
                $errmsg = "Error!  The EndDate must be later than the BeginDate.";
                throw new Exception($errmsg);
            }
            
            // If not Resume Update mode, retrieve XML from NWMLS
            if ($processing_mode != 'R') {
                
                // Retrieve the MLS data as XML
                $nwmls_client = get_nwmls_property_data($rp_config, $mlsParameters, $soaptest);
                $nwmls_status = $nwmls_client->get_status();
                if (substr($nwmls_status, 0, 6) == 'Error!') {
                    // Exit if MLS data retrieval failed
                    throw new Exception($nwmls_status);
                }
                $nwmls_data_filename = $nwmls_client->get_nwmls_data_filename();
                
                // If DB mode is active, store MLS filename in case something goes wrong,
                // and we need to Resume later.
                if (!$skipdb || $forcedb) {
                    $mpDB->set_update_mls_filename($nwmls_data_filename);
                }
            } else {
                // Resume mode, so just get MLS filename from last update record
                $nwmls_data_filename = $mpDB->get_update_mls_filename();
            }
            
            // Open result file to receive results as each listing processed
            $result_filep = fopen($result_filename, $output_file_mode);
            
            // If not Resume Update mode, write header
            if ($processing_mode != 'R') {
                
                $result_bytes = fwrite($result_filep, $listings_header);
                
            } else {
                
                // Resume Update mode, so get number of bytes already written.
                // According to PHP docs, ftell(fp) is unreliable, so use
                // filesize with filename to get current #bytes.
                $result_bytes = filesize($result_filename);
            }
        
            // Check if query includes listings that need to have images
            // retrieved. If so, open file to store listing numbers, which
            // will be used by image retrieval tool.
            $statusStrChar = substr($statusStr, 0, 1);
            if (($statusStrChar == 'A' || $statusStrChar == 'P') && !$skipimg) {
                $image_ln_file = fopen($image_ln_filename, $output_file_mode);
            }
            
            // If allLN option is set, open output file to store all listing numbers
            if ($allLN) {
                $all_ln_file = fopen($all_ln_filename, 'wb');
            }
            
            // Set up XMLReader to process the listings
            $nwmls_reader = new XMLReader();
            $nwmls_reader->open($nwmls_data_filename);
            
            if ($nwmls_reader === false) {
                $errmsg  = 'Error!  Unable to open mls data file for processing:' . PHP_EOL;
                $errmsg .= $nwmls_data_filename;
                throw new Exception ($errmsg);
            }
            
            // Fast forward to <Listings>
            while ($nwmls_reader->read()) {
                if ($nwmls_reader->nodeType == XMLReader::ELEMENT) {
                    // DEBUG
                    //println("XMLReader->localName = '$nwmls_reader->localName'");
                    if ($nwmls_reader->localName == 'Listings') break;
                }
            }
            
            // Track listing count
            $listing_count = 0;
            
            // Set up image path that will be used in additional <IMAGE> elements
            $images_path = $mls_path . $prop_type . '/images/active/';
            
            $total_active = 0;
            $total_contingent = 0;
            $total_pending = 0;
            $total_sold = 0;
            $total_imgs = 0;
            $total_active_imgs = 0;
            $total_contingent_imgs = 0;
            $total_pending_imgs = 0;
            $total_placeholders = 0;
            $total_db_updates = 0;
            
            $time_before_listing_loop = new DateTime();
                
            // Iterate over each listing, updating DB then adding image path info
            //foreach($nwmls_result->children() as $listing) {
            //while ($nwmls_reader->read()) {
            for ($success = $nwmls_reader->read(); $success; $success = $nwmls_reader->next()) {
        
                // Skip if not beginning of an element
                if ($nwmls_reader->nodeType != XMLReader::ELEMENT) continue;
                
                $elementStr = $nwmls_reader->readOuterXML();
				// Kick off lambda function to process listings individually
				$payload = [
					'listing' => $elementStr,
					'PropertyType' => $prop_type,
					'MlsParameters' => $mlsParameters
                ];
                global $stage;
				$result = $this->lambdaclient->invoke([
                    'FunctionName' => 'mlsimport-'.$stage.'-updateSingleListing',
					'InvocationType' => 'Event',
					'Payload' => json_encode($payload)
				]);
				

        		// Bump the count
        		$listing_count++;
                $total_db_updates++;
            }
            
            // Finish output file with closing </Listings> element
            $result_bytes += fwrite($result_filep, $listings_footer . PHP_EOL);
            
            // Output duration for processing all listings
            $finish_time = new DateTime();
            $processing_duration = $time_before_listing_loop->diff($finish_time);
            println('Listing Processing Duration: ' . $processing_duration->format("%I:%S (min:sec)"));
            
            // Log total counts
            $log_entry = "A total of $listing_count listings were written to output file: $result_filename" . PHP_EOL;
            $log_entry .= "Total active listings: $total_active" . PHP_EOL;
            $log_entry .= "Total contingent listings: $total_contingent" . PHP_EOL;
            $log_entry .= "Total pending listings: $total_pending" . PHP_EOL;
            $log_entry .= "Total sold listings: $total_sold" . PHP_EOL;
            
            if (!$skipdb || $forcedb) {
                $db_table = $mpDB->get_data_table_name();
                $log_entry .= "Total database updates in table $db_table: $total_db_updates" . PHP_EOL;
            } else {
                $log_entry .= "No database updates!" . PHP_EOL;
            }
            
            $log_entry .= "------------------------------------------------" . PHP_EOL;
            
            // Log image processing totals
            $log_entry .= "Total listing images: $total_imgs" . PHP_EOL;
            $log_entry .= "Total active listing images: $total_active_imgs" . PHP_EOL;
            $log_entry .= "Total contingent listing images: $total_contingent_imgs" . PHP_EOL;
            $log_entry .= "Total pending listing images: $total_pending_imgs" . PHP_EOL;
            $log_entry .= "Total placeholder images: $total_placeholders" . PHP_EOL;
            
            // Update DB status as Completed if appropriate
            if (!$skipdb || $forcedb) {
                
                $mpDB->set_update_status('C', $finish_time);
                
                // Update log with DB status of Completed
                $log_entry .= "Database update status: COMPLETED!" . PHP_EOL;
        
            }
                
            // Close the XML reader
            if ($nwmls_reader) {
                $nwmls_reader->close();
                $nwmls_reader = null;
            }
                
            // Delete the MLS data file, unless flag is set
            if (!$keepdata) {
                delete_file($nwmls_data_filename);
            }
            
            // Write final log entry
            $logger->info($log_entry);  // replace log file writes with logger
            //fwrite($logfile, $log_entry);
            //fflush($logfile);
            
            // Display the log entry
            //println($log_entry);
            
        } catch(Exception $e) {
        
            $finish_time = new DateTime();
            
            // Error!
            $log_entry  = 'Error!  Unable to complete MLS processing:' . PHP_EOL;
            $log_entry .= $e->getMessage() . PHP_EOL;
            
            // Update DB status as Failed if appropriate
            if (!$skipdb || $forcedb) {
                
                // Update DB status as Failed (if mpDB exists yet)
                if ($mpDB) $mpDB->set_update_status('F', $finish_time);
                
                // Update log with DB status of Failed
                $log_entry .= "Database update status: FAILED!" . PHP_EOL;
            }
            
            // Write final log entry
            //if ($logfile) {
                $logger->error($log_entry); // replace log file writes with logger
                //fwrite($logfile, $log_entry);
                //fflush($logfile);
            //}
            
            // Display the log entry
            //println($log_entry);
            
        } finally {
            
            // Wrap up log file
            // Note:  $finish_time is set in both try and catch blocks, so
            //        it should be set to something valid.
            $finishTimeStr = $finish_time->format(DateTime::ATOM);
            //if ($logfile) {
                $log_entry = $finishTimeStr . ' -- END XML RETRIEVAL --' . PHP_EOL;
                $logger->info($log_entry);  // replace log file writes with logger
                //fwrite($logfile, $log_entry);
                //fclose($logfile);
            //}
            
            // Clean up
            if ($mpDB) $mpDB->close();
            if ($nwmls_reader) $nwmls_reader->close();
            if ($image_ln_file) fclose ($image_ln_file);
            if ($all_ln_file) fclose ($all_ln_file);
            if ($result_filep) fclose ($result_filep);
            
        }
        
        return;
    }

    function process_listing($elementStr, $prop_type, $mlsParameters, $images_path) {
        global $SnsClient, $snsTopic;
		$process_listings = true;
		$skipimg = false;

        $listing = new SimpleXMLElement($elementStr);
                
        // Correct misspelling of county name Pend Orielle - change to Pend Oreille (ie->ei)
        if ( isset($listing->COU) && $listing->COU->__toString() == 'Pend Orielle') $listing->COU = 'Pend Oreille';
        
        $ln = $listing->LN->__toString();
        $this->logger->info('Processing listing: '. $ln);
		
		$num_images = (int) $listing->PIC->__toString();
        
		// Connect to DB and initialize everything
		$mpDB = new MP_Database($prop_type, false, false, $mlsParameters, $this->rp_config);
        // // Write listing number to text file if flag is set
        // if ($allLN) {
            
        //  fwrite($all_ln_file, $ln . PHP_EOL);
        //  fflush($all_ln_file);
                
        // }
        
        // Create any custom mp fields that should be included in XML,
        // but only if it's a non-filtered query.  This is because the
        // custom fields depend on certain MLS fields being present.
        //if (!$is_filtered) {
        create_custom_fields($listing);
        //}
        
        // Get listing info currently in local DB, compare, and make
        // adjustments if necessary.
        if ($process_listings) {
            $listing_table = 'mp' . $prop_type;
            $listing_info = $mpDB->get_listing_info($listing_table, $ln);
            if ($listing_info != null) {
                $existing_img_count = $listing_info['PIC'];
            } else {
                $existing_img_count = 0;
            }

            // If new image count == 0 but existing is > 0, set to minimum of 1 in
            // order to keep the feature image of the listing, for future reference.
            if ($num_images == 0 && $existing_img_count > 0) {
                $num_images = 1;
                $listing->PIC = $num_images;
                $listing_info['PIC'] = $num_images;
            }
            
            $last_update_date = $listing_info['UD'];
            $this->logger->info('last update date' . $last_update_date);
            $this->logger->info('new update date' . $listing->UD);
            
            // Update listing in local DB before adding IMAGES/IMAGE elements further down,
            // since we can't have the images ouput to the database.
            $mpDB->update_data_table($listing);
            if ($prop_type != 'RENT') $mpDB->update_wp_sync_table($listing);
        
            $SnsClient->publish([
                'Message' => json_encode($listing),
                'TopicArn' => $snsTopic
            ]);

            // Re-fetch listing data from local DB after the above update, in order
            // for the image_data logic to work properly.
            $listing_info = $mpDB->get_listing_info($listing_table, $ln);

            // Get existing listing image data (if any)
            $image_table = $listing_table . 'images';
            $image_data = $mpDB->get_listing_image_data($image_table, $ln);
            
            // Create new image data if needed, or set up update of existing
            if ($image_data == null) {
                // Nothing yet for the listing, so create a new entry. This will
                // also set PendingRequest to 'L' (load) if the listing
                // has PIC set to a non-zero value.
                $image_data = create_image_data($mpDB, $image_table, $ln, $listing_info);
            } else {
                // Entry already exists, so set up for update
                $image_data = setup_image_update($mpDB, $image_table, $ln, $listing_info, $image_data);
            }
            
        }
        
        // Perform image processing if appropriate (typically if Active/Contingent or Pending listing)
        // This only works if ST is present.  If Filter option used, it needs to include
        // both ST and PIC for this logic to work properly.
        $listingStatus = $listing->ST->__toString();
        $listingStatusChar = substr($listingStatus, 0, 1);
        if ($listingStatusChar == 'A' || $listingStatusChar == 'P') {
            
            // Add IMAGE records if appropriate
            if ($process_listings && !$skipimg) {
                // Add <IMAGES> element no matter what, even if no imgs (will add placeholder)
                $images = $listing->addChild('IMAGES');
                
                // Either add placeholder reference if no imgs, or loop adding actual img references
                if ($num_images == 0) {
                    //$image_filename = $images_path . 'placeholder.jpg';
                    $image_filename = 'nwmls_placeholder.jpg';
                    $image = $images->addChild('IMAGE', $image_filename);
                    $image->addAttribute('ID', '00');
                    $total_placeholders++;
                } else {
                    //$image_dir = $images_path . $ln . '/';
                    $lower_ptype = strtolower($prop_type);
                    for ($imgnum = 0; $imgnum < $num_images; $imgnum++) {
                        $imgnum_str = sprintf("%02d", $imgnum);
                        //$image_filename = $image_dir . 'nwmls_' . $ln . '_' . $imgnum_str . '.jpg';
                        $image_filename = 'nwmls_' . $lower_ptype . '_' . $ln . '_' . $imgnum_str . '.jpg';
                        $image = $images->addChild('IMAGE', $image_filename);
                        $image->addAttribute('ID', $imgnum);
                    }
                }
            }
            
            // Update total imgs for type and for all imgs that will be retrieved.
            if ($listingStatusChar == 'A') {
                $total_active++;
                $total_active_imgs += $num_images;
            } else if ($listingStatus == 'CT') {
                $total_contingent++;
                $total_contingent_imgs += $num_images;
            } else if ($listingStatusChar == 'P') {
                $total_pending++;
                $total_pending_imgs += $num_images;
            }
            
            // Add imgs to total (notice this only counts active/contingent/pending).
            // That's because this represents the total number of images that need to
            // be retrieved for those types of properties (sold images not tracked).
            // Valid count only if no filter used, or if PIC field included in filter.
            $total_imgs += $num_images;
            
            $this->logger->info('Starting image import: '. $ln);
            $image_processor = new ImageProcessor($this->logger, $this->rp_config);
            $image_processor->get_images_for_listing($prop_type, $ln, $images_path);
            $this->logger->info('Finished image import: '. $ln);
            // // Write out listing to the active listing file
            // if ($process_listings && !$skipimg) {
            //  fwrite($image_ln_file, $ln . PHP_EOL);
            //  fflush($image_ln_file);
            // }
            
        } // Active or Pending listing
        else
        {
            // Check for sold
            if ($listingStatus == 'S') $total_sold++;
        }
        
        // // Get and write XML for element if appropriate
        // if ($process_listings) {
        //  // Get element without prolog and namespace
        //  $listing_xml_no_namespace = get_listing_xml_no_namespace($listing);
            
        //  // Write listing to result file
        //  $result_bytes += fwrite($result_filep, $listing_xml_no_namespace);
        //  fflush($result_filep);
        // }
        
        // Update database status as appropriate
        if ($process_listings) {
            
            if (!$skipdb || $forcedb) { 
                // Store latest LN processed in update table
                $mpDB->set_update_mls_ln($ln);
            }
            
        } else {
            
            // Processing not active.  Check if this listing was the
            // last listing of the last update.  If so, flip the
            // flag to process listings!
            if ($last_ln == $ln) {
                $process_listings = true;
            }
        }
		$this->logger->info('Done processing listing: '. $ln);
    }

}  // class MLSImport

    
    //---------------------------------------------------------//
    
    function delete_file($filename) {
        
        // Delete the file if it exists
        if (file_exists($filename)) {
            unlink($filename);
        }
    }
        
    //---------------------------------------------------------//
        
    function create_custom_fields($listing) {
        
        static $mpStatusDir = [
            'A'=>'A',
            'CT'=>'D',
            'INC'=>'D',
            'PB'=>'P',
            'PF'=>'P',
            'PI'=>'P',
            'PS'=>'P',
            'P'=>'P',
            'SFR'=>'D',
            'CA'=>'D',
            'T'=>'D',
            'E'=>'D',
            'S'=>'S',
            'R'=>'R'
        ];
    
        static $mpStyleDir = [
            0=>null, 10=>1, 11=>1, 12=>1, 13=>1, 14=>1, 15=>1, 16=>1, 17=>1,
            18=>1, 20=>4, 21=>4, 22=>4, 24=>9, 30=>3, 31=>3, 32=>2,
            33=>10, 34=>3, 52=>7, 53=>7, 54=>7, 55=>8, 56=>8, 63=>6, 72=>5, 
            40=>13, 41=>13, 42=>13, 43=>11, 44=>12
        ];
        
        $mlsStatus = $listing->ST->__toString();;
        $mlsStyle =  (int) $listing->STY->__toString();
        
        // DEBUG
        //println("***********ST =  '$mlsStatus'");
        //println("**********STY =  '$mlsStyle'");
        
        // Map MLS status to MP status
        $mpStatus = $listing->addChild('mpStatus', $mpStatusDir[$mlsStatus]);
        
        // Map MLS style to MP style
        if (isset($mpStyleDir[$mlsStyle])) {
            $mpStyleVal = $mpStyleDir[$mlsStyle];
        } else {
            $mpStyleVal = 0;
        }
        $mpStyle = $listing->addChild('mpStyle',  $mpStyleVal);
        
        // DEBUG
        /*
        $mpStatusStr = $mpStatus->__toString();
        $mpStyleStr = $mpStyle->__toString();
        println("***********ST =  '$mlsStatus'");
        println("*****mpStatus =  '$mpStatusStr'" . PHP_EOL);
        println("**********STY =  '$mlsStyle'");
        println("******mpStyle =  '$mpStyleStr'" . PHP_EOL);
        */
        
        return;
    }


    
    //---------------------------------------------------------//
    
    // Get MLS formatted DateTime
    // Note:  Arg can be a string or a DateTime object.
    // If a string is passed in, it must be a format
    // that the DateTime constructor can handle.    
    function get_mls_format_datetime($arg) {
    
        if (is_object($arg) && get_class($arg) == 'DateTime') {
            $in_date = $arg;
        } else if (is_string($arg)) {
            $in_date = new DateTime($arg);
        } else {
            $errmsg = 'Invalid argument for method MP_Database::get_mls_format_datetime()';
            throw new Exception ($errmsg);
        }
    
        $mls_format_date = $in_date->format(DateTime::ATOM);
        
        return $mls_format_date;
    }
    
    //---------------------------------------------------------//
        
    function get_new_mls_end_date($in_datetime) {
        
        // Start by copying incoming date/time, to
        // make sure we don't inadvertantly change
        // the date/time stored in the passed object.
        $base_time = clone $in_datetime;
        
        // Get hour and minute values
        $hour = (int) $base_time->format("H");
        $minutes = (int) $base_time->format("i");
        
        // Compute most recent quarter hour (15 min boundary)
        $last15 = intval(($minutes / 15)) * 15;
        
        // Set end date to that 15 min boundary
        $end_date = $base_time->setTime($hour, $last15);
        
        // Format for MLS
        $end_date_str = get_mls_format_datetime($end_date);
        
        return $end_date_str;
    }
        
    //---------------------------------------------------------//
    
    function is_valid_mls_request_dates($mlsParameters) {
        
        $is_valid = true;
        
        // Check validity of BeginDate and EndDate.
        // Note that it's possible for the BeginDate to be later
        // than the EndDate if the 'update' option is used for
        // execution too soon after the previous, not allowing at
        // least 15 minutes to pass.
        $begin_date = new DateTime($mlsParameters['BeginDate']);
        $end_date   = new DateTime($mlsParameters['EndDate']);
        $begin_ts   = $begin_date->getTimestamp();
        $end_ts     = $end_date->getTimestamp();
        if ($end_ts <= $begin_ts) {
            $is_valid = false;
        }
        
        return $is_valid;
    }
    
    //---------------------------------------------------------//
    
    function get_listing_xml_no_namespace($listing) {
        
        //Format XML to save indented tree rather than one line
        $dom = new DOMDocument('1.0');
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput = true;
        $dom->loadXML($listing->asXML());
        
        // Remove prolog and namespace
        $listing_xml = $dom->saveXML();
        $prolog_length = strpos($listing_xml, '?>') + 2;
        $ns_start = strpos($listing_xml, ' xmlns="');
        $ns_end = strpos($listing_xml, '"', $ns_start + 8);
        $listing_xml_no_namespace  = ltrim(substr($listing_xml, $prolog_length, $ns_start - $prolog_length));
        $listing_xml_no_namespace .= substr($listing_xml, $ns_end + 1);
        
        return $listing_xml_no_namespace;
    }
    
    //---------------------------------------------------------//
    
    function create_image_data($mpDB, $table, $ln, $listing) {
        
        $image_data = array();
        $update_count = $listing['PIC'];
        $request = $update_count > 0 ? 'L' : 'N';
        $image_data['ListingNumber'] = $ln;
        $image_data['ListingStatus'] = $listing['mpStatus'];
        $image_data['ActiveCount'] = 0;
        $image_data['PendingRequest'] = $request;
        $image_data['UpdateCount'] = $update_count;
        $image_data['LoadedCount'] = 0;
        $image_data['ReqStatus'] = 'N';
        $image_data['ReqStartedTime'] = null;
        $image_data['ReqCompletedTime'] = null;
        $image_data['ReqFailedTime'] = null;
        $image_data['Availability'] = 'U';
        $image_data['LatestUploadDT'] = EARLIEST_IMAGE_DATE;
    
        $mpDB->update_listing_image_data($table, $image_data, $ln, 'I');
        
        // Get full row after update
        $updated_image_data = $mpDB->get_listing_image_data($table, $ln);
        
        return $updated_image_data;
    }
    
    //---------------------------------------------------------//
    
    function setup_image_update($mpDB, $table, $ln, $listing, $image_data) {
        
        // Update image data record
        $update_data = array();
        $update_count = $listing['PIC'];
        $update_data['ListingStatus'] = $listing['mpStatus'];
        $update_data['UpdateCount'] = $update_count;
        $update_data['ReqStatus'] = 'N';
        
        //$update_data['ReqStartedTime'] = null;
        //$update_data['ReqCompletedTime'] = null;
        //$update_data['ReqFailedTime'] = null;
        
        // Set up for image file update only if new count > 0
        if ($update_count) {
            $update_data['PendingRequest'] = 'U';
        } else {
            $update_data['PendingRequest'] = 'N';
        }
    
        // Update the DB
        $mpDB->update_listing_image_data($table, $update_data, $ln, 'U');
        
        // Get full row after update
        $updated_image_data = $mpDB->get_listing_image_data($table, $ln);
        
        return $updated_image_data;
    }
    
    function get_member_data($rp_config) {
        global $logger;
        try {
            $logger->info('starting SOAP query');
            // Get API username and pw from config
            $mlsUsername = $rp_config['nwmls']['api_user'];
            $mlsPassword = $rp_config['nwmls']['api_pw'];

            $client=new \SoapClient('http://evernet.nwmls.com/evernetqueryservice/evernetquery.asmx?WSDL');
            
            $XMLProlog = "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n";
        
            $XMLQuery =$XMLProlog;
            $XMLQuery .="<EverNetQuerySpecification xmlns='urn:www.nwmls.com/Schemas/General/EverNetQueryXML.xsd'>\r\n";
            $XMLQuery .="\t<Message>\r\n";
            $XMLQuery .="\t\t<Head>\r\n";
            $XMLQuery .="\t\t\t<UserId>" . $mlsUsername . "</UserId>\r\n";
            $XMLQuery .="\t\t\t<Password>" . $mlsPassword . "</Password>\r\n";
            $XMLQuery .="\t\t\t<SchemaName>EverNetMemberXML</SchemaName>\r\n";
            $XMLQuery .="\t\t</Head>\r\n";
            $XMLQuery .="\t\t<Body>\r\n";
            $XMLQuery .="\t\t\t<Query>\r\n";
            $XMLQuery .="\t\t\t\t<MLS>NWMLS</MLS>\r\n";
            $XMLQuery .="\t\t\t</Query>\r\n";
            $XMLQuery .="\t\t</Body>\r\n";
            $XMLQuery .="\t</Message>\r\n";
            $XMLQuery .="</EverNetQuerySpecification>\r\n";
            
            $params = array ('v_strXmlQuery' => $XMLQuery);
            $result = $client->RetrieveMemberData($params);     
            $access = $result->RetrieveMemberDataResult;
            $members = new SimpleXMLElement($access);
            
            foreach ($members->member as $member) {
                yield $member;
            }
            $now = new DateTime(null, new DateTimeZone('America/Los_Angeles'));
            $nowStr = $now->format(DateTime::ATOM);
            $log_entry = $nowStr . ' -- END XML RETRIEVAL --' . PHP_EOL;
            $logger->info($log_entry);
        } catch(Exception $e) {
            
            println('An error occurred getting member data from NWMLS');
            println($e->getMessage());
            throw $e;
        }
    }

    function get_office_data($rp_config) {
        global $logger;
        try {
            $logger->info('starting SOAP query');
            // Get API username and pw from config
            $mlsUsername = $rp_config['nwmls']['api_user'];
            $mlsPassword = $rp_config['nwmls']['api_pw'];

            $client=new \SoapClient('http://evernet.nwmls.com/evernetqueryservice/evernetquery.asmx?WSDL');
            
            $XMLProlog = "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n";
        
            $XMLQuery =$XMLProlog;
            $XMLQuery .="<EverNetQuerySpecification xmlns='urn:www.nwmls.com/Schemas/General/EverNetQueryXML.xsd'>\r\n";
            $XMLQuery .="\t<Message>\r\n";
            $XMLQuery .="\t\t<Head>\r\n";
            $XMLQuery .="\t\t\t<UserId>" . $mlsUsername . "</UserId>\r\n";
            $XMLQuery .="\t\t\t<Password>" . $mlsPassword . "</Password>\r\n";
            $XMLQuery .="\t\t\t<SchemaName>EverNetOfficeXML</SchemaName>\r\n";
            $XMLQuery .="\t\t</Head>\r\n";
            $XMLQuery .="\t\t<Body>\r\n";
            $XMLQuery .="\t\t\t<Query>\r\n";
            $XMLQuery .="\t\t\t\t<MLS>NWMLS</MLS>\r\n";
            $XMLQuery .="\t\t\t</Query>\r\n";
            $XMLQuery .="\t\t</Body>\r\n";
            $XMLQuery .="\t</Message>\r\n";
            $XMLQuery .="</EverNetQuerySpecification>\r\n";
            
            $params = array ('v_strXmlQuery' => $XMLQuery);
            $result = $client->RetrieveOfficeData($params);     
            $access = $result->RetrieveOfficeDataResult;
            $offices = new SimpleXMLElement($access);
            
            foreach ($offices->office as $office) {
                yield $office;
            }
            $now = new DateTime(null, new DateTimeZone('America/Los_Angeles'));
            $nowStr = $now->format(DateTime::ATOM);
            $log_entry = $nowStr . ' -- END XML RETRIEVAL --' . PHP_EOL;
            $logger->info($log_entry);
        } catch(Exception $e) {
            
            println('An error occurred getting office data from NWMLS');
            println($e->getMessage());
            throw $e;
        }
    }

    function get_listing_data($rp_config, $mlsParameters, &$result_file, &$listing_xml_type) {
        // Retrieve the MLS data as XML
        $nwmls_client = get_nwmls_property_data($rp_config, $mlsParameters, false);
        $nwmls_status = $nwmls_client->get_status();
        if (substr($nwmls_status, 0, 6) == 'Error!') {
            // Exit if MLS data retrieval failed
            throw new Exception($nwmls_status);
        }
                
        $nwmls_data_filename = $nwmls_client->get_nwmls_data_filename();
        $result_file .= $nwmls_data_filename;
        
        // Set up XMLReader to process the listings
        $nwmls_reader = new XMLReader();
        $nwmls_reader->open($nwmls_data_filename);

        if ($nwmls_reader === false) {
            $errmsg  = 'Error!  Unable to open mls data file for processing:' . PHP_EOL;
            $errmsg .= $nwmls_data_filename;
            throw new Exception ($errmsg);
        }

        	// Fast forward to <Listings>
        while ($nwmls_reader->read()) {
            if ($nwmls_reader->nodeType == XMLReader::ELEMENT) {
                if ($nwmls_reader->localName == 'Listings')	break;
            }
        }
        for ($success = $nwmls_reader->read(); $success; $success = $nwmls_reader->next()) {
            // Skip if not beginning of an element
            if ($nwmls_reader->nodeType != XMLReader::ELEMENT) continue;
            $elementStr = $nwmls_reader->readOuterXML();
            $listingXML = new SimpleXMLElement($elementStr);
            $listing_xml_type = ($nwmls_reader->name);

            // Correct misspelling of county name Pend Orielle - change to Pend Oreille (ie->ei)
            if ( isset($listingXML->COU) && $listingXML->COU->__toString() == 'Pend Orielle') $listingXML->COU = 'Pend Oreille';

            $listing = [];            
            foreach($listingXML as $field_name=>$field_value) {
                $listing[$field_name] = $field_value->__toString();
            }
            yield $listing;
        }
    }
    //---------------------------------------------------------//
    
    function get_nwmls_property_data($rp_config, $mlsParameters, $soaptest) {
        
        $mls_path = get_mls_path();
        $prop_type = $mlsParameters['PropertyType'];
        
        // create the directory if it doesn't exist
        if ($prop_type && !file_exists($mls_path . $prop_type)) {
            mkdir($mls_path . $prop_type, 0777, true);
        }
        // Get config file
        /////$rp_config = parsex_ini_file('/mlsdata/realpeek.ini', true);
    
        // Get API username and pw from config
        $mlsUsername = $rp_config['nwmls']['api_user'];
        $mlsPassword = $rp_config['nwmls']['api_pw'];
        
        $nwmls_client = null;
        
        try {
            
            // Get a UUID string
            //$uuid = bin2hex(openssl_random_pseudo_bytes(8));
            $now = new DateTime();
            $uuid = $now->format('Ymd-His');  // Not a true uuid, but good enough for this use case, and more readable/sortable
            
            // Use test soap file if provided via command line, otherwise set up for API call
            if ($soaptest) {
                $soap_result_file = $soaptest;
                $test_mode = true;
            } else {
                $soap_result_file = $mls_path . $mlsParameters['PropertyType'] . '/nwmls_soap_result_' . $uuid . '.xml';
                $test_mode = false;
            }
            
            $nwmls_client=new NWMLSClient($soap_result_file, 'http://evernet.nwmls.com/evernetqueryservice/evernetquery.asmx?WSDL', $test_mode);
            //$nwmls_client=new SoapClient('http://evernet.nwmls.com/evernetqueryservice/evernetquery.asmx?WSDL', array('trace'=>true));
            
            // Call NWMLS API if not in test mode (soap file via command line)
            if (!$test_mode) {
                $XMLProlog = "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\r\n";
    
                $XMLQuery =$XMLProlog;
                $XMLQuery .="<EverNetQuerySpecification xmlns='urn:www.nwmls.com/Schemas/General/EverNetQueryXML.xsd'>\r\n";
                $XMLQuery .="\t<Message>\r\n";
                $XMLQuery .="\t\t<Head>\r\n";
                $XMLQuery .="\t\t\t<UserId>" . $mlsUsername . "</UserId>\r\n";
                $XMLQuery .="\t\t\t<Password>" . $mlsPassword . "</Password>\r\n";
                $XMLQuery .="\t\t\t<SchemaName>StandardXML1_5</SchemaName>\r\n";
                $XMLQuery .="\t\t</Head>\r\n";
                $XMLQuery .="\t\t<Body>\r\n";
                $XMLQuery .="\t\t\t<Query>\r\n";
                $XMLQuery .="\t\t\t\t<MLS>NWMLS</MLS>\r\n";
                $XMLQuery .="\t\t\t\t<ListingNumber>" . $mlsParameters['ListingNumber'] . "</ListingNumber>\r\n";
                $XMLQuery .="\t\t\t\t<PropertyType>" . $mlsParameters['PropertyType'] . "</PropertyType>\r\n";
                $XMLQuery .="\t\t\t\t<Status>" . $mlsParameters['Status']. "</Status>\r\n";
                $XMLQuery .="\t\t\t\t<BeginDate>" . $mlsParameters['BeginDate'] . "</BeginDate>\r\n";
                $XMLQuery .="\t\t\t\t<EndDate>" . $mlsParameters['EndDate'] . "</EndDate>\r\n";
                $XMLQuery .="\t\t\t\t<County>" . $mlsParameters['County']. "</County>\r\n";
                $XMLQuery .="\t\t\t\t<Area>" . $mlsParameters['Area']. "</Area>\r\n";
                $XMLQuery .="\t\t\t\t<City>" . $mlsParameters['City']. "</City>\r\n";
                if ($mlsParameters['OfficeId'] != null) $XMLQuery .="\t\t\t\t<OfficeId>" . $mlsParameters['OfficeId']. "</OfficeId>\r\n";
                if ($mlsParameters['AgentId'] != null) $XMLQuery .="\t\t\t\t<AgentId>" . $mlsParameters['AgentId']. "</AgentId>\r\n";
                if ($mlsParameters['Bedrooms'] != null) $XMLQuery .="\t\t\t\t<Bedrooms>" . $mlsParameters['Bedrooms']. "</Bedrooms>\r\n";
                if ($mlsParameters['Bathrooms'] != null) $XMLQuery .="\t\t\t\t<Bathrooms>" . $mlsParameters['Bathrooms']. "</Bathrooms>\r\n";
                $XMLQuery .="\t\t\t</Query>\r\n";
                $XMLQuery .="\t\t\t<Filter>" . $mlsParameters['Filter']. "</Filter>\r\n";
                $XMLQuery .="\t\t</Body>\r\n";
                $XMLQuery .="\t</Message>\r\n";
                $XMLQuery .="</EverNetQuerySpecification>\r\n";
                
                $params = array ('v_strXmlQuery' => $XMLQuery);
                $time_before_soap = new DateTime();  // DEBUG
                $result = $nwmls_client->RetrieveListingData($params);
                $time_after_soap = new DateTime();  // DEBUG
                //$access = $result->RetrieveListingDataResult;
                //$time_after_retrieve_result = new DateTime();  // DEBUG
                // DEBUG
                //println("access: '$access'" . PHP_EOL);
                
                //$simple_xml_result = new SimpleXMLElement($access);
                //$time_after_simple_xml = new DateTime();  // DEBUG
                
                // DEBUG: Get and print duration of each operation
                //println('!!!!!');
                println('NWMLS API Call Duration: ' . $time_before_soap->diff($time_after_soap)->format("%I:%S (min:sec)"));
                //println('Retrieve Result Duration: ' . $time_after_soap->diff($time_after_retrieve_result)->format("%I.%S (min.sec)"));
                //println('Simple XML Duration: ' . $time_after_retrieve_result->diff($time_after_simple_xml)->format("%I.%S (min.sec)"));
                
                // DEBUG:  Get and print SOAP data used in actual http call
                //println('SOAP Call Result:' . PHP_EOL . $simple_xml_result->asXML());
                /*
                println('SOAP Call REQUEST HEADERS:' . PHP_EOL . $nwmls_client->__getLastRequestHeaders() . PHP_EOL . PHP_EOL);
                println('SOAP Call REQUEST Data:' . PHP_EOL . $nwmls_client->__getLastRequest() . PHP_EOL . PHP_EOL);
                println('SOAP Call RESPONSE Data:' . PHP_EOL . $nwmls_client->__getLastResponse() . PHP_EOL . PHP_EOL);
                */
            }
            
            // Check if any NWMLS error.  If so, throw exception
            $nwmls_error = soapfile_errors($soap_result_file);
            if ($nwmls_error != null) {
                
                $errmsg = 'NWMLS responded with the following message:' . PHP_EOL;
                $errmsg .= $nwmls_error;
                throw new Exception ($errmsg);
                
            }
            
        } catch(Exception $e) {
            
            $errmsg = 'Error!  The NWMLS data could not be retrieved:' . PHP_EOL;
            $errmsg .= $e->getMessage();
            throw new Exception ($errmsg);
        }
        
        return $nwmls_client;
        
    }  // function get_nwmls_property_data($mlsParameters)
    
    function soapfile_errors($soap_filename) {
        
        static $nwmls_message_regex = '/<\?xml version="1.0" encoding="utf-8"\?>.+<Listings xmlns=".+\.xsd">\s*<ResponseMessages>\s*<Message>(.+)<\/Message>\s*<\/ResponseMessages>\s*<\/Listings>.+/';
        
        $result = null;
        
        // Check if file exists and examine contents for NWMLS error message
        if (file_exists($soap_filename)) {
            
            // A valid SOAP response will be more than 400 bytes
            $fsize = filesize($soap_filename);
            if ($fsize > 400) {
                
                // check if it has closing </soap:Envelope> tag at end
                $fp = fopen($soap_filename, 'rb');
                fseek($fp, -16, SEEK_END);
                $endstr = fread($fp, 16);
                
                // If valid soap envelope close, check for any NWMLS messages (problems)
                if ($endstr == '</soap:Envelope>') {
                
                    // Read 2K bytes or entire file, whichever is less
                    $matches = array();
                    $readlen = min($fsize, 2048);
                    fseek($fp,0);
                    $begstr = fread($fp, $readlen);
                        
                    // Check for message from NWMLS (means there's a problem)
                    $is_message = preg_match($nwmls_message_regex, $begstr, $matches);
                    
                    // preg_match returns false for error (invalid something), 0 = no match, 1 = match
                    if ($is_message === false) {
                        
                        fclose($fp);
                        $errmsg = "Error!  Invalid regex search in function soapfile_errors()";
                        throw new Exception($errmsg);
                        
                    } else {
                        
                        // If NWMLS message exists there's a problem
                        if ($is_message) {
                            
                            // Return the message
                            $result = $matches[1];
                            
                        }
                    }
                    
                } else {
                    
                    $result = "Error!  SOAP file '$soap_filename' appears to be invalid.";
                    
                }
                
                // Close the soap file
                fclose($fp);
                
            } else {
                
                $result = "Error!  SOAP file '$soap_filename' appears to be invalid.";
                
            }
            
        } else {
            
            $result = "Error!  SOAP file '$soap_filename' not found.";
            
        }
        
        return $result;
    }

