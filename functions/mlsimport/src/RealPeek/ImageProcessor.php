<?php

namespace RealPeek;

use \DateTime;
use \DateInterval;
use \DateTimeZone;
use \Exception;
use \SoapClient;
use \SimpleXMLElement;
use \FilesystemIterator;
use \Aws\S3\S3Client;
use \Aws\Exception\AwsException;
use \Aws\Lambda\LambdaClient;
use \imagick;
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


// Earliest image date (no timezone for DB)
const EARLIEST_IMAGE_DATE = '1990-01-01T00:00:00';

class ImageProcessor
{
    public function __construct($logger, $rp_config) {

        $this->stage = getenv('stage');
        $this->logger = $logger;
        $this->rp_config = $rp_config;
        $s3client = new S3Client([
            'region' => 'us-west-2',
            'version' => '2006-03-01'
            ]);

        $this->lambdaclient = LambdaClient::factory([
            'version' => 'latest',
            'region'  => 'us-west-2',
        ]);

        // register the stream wrapper from an S3Client object
        $s3client->registerStreamWrapper();
    }

    function get_images_for_listing($ptype, $listing_number, $images_path) {
        // Make sure property options set
        if (!$ptype) {
            $this->logger->info('Invalid request!  You must specify the PropertyType option.');
            if (isweb()) {
                //$this->logger->('For example:&nbsp;&nbsp;&nbsp;' . $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'] . '?PropertyType=RESI');
                $this->logger->info('For example:   ' . ' { "PropertyType": "RESI"}');
            } else {
                $this->logger->info('For example:   ' . ' { "PropertyType": "RESI"}');
            }
            return;
        }
        $lower_ptype = strtolower($ptype);
        ///// CONFIG VARIABLES 
                // Retrieve all pending image data updates
        $listing_table = 'mp' . $ptype;
        $image_table = $listing_table . 'images';

        // Activate database
        $this->mpDB = new MP_Image_Database($this->rp_config);
        $image_data = $this->mpDB->get_listing_image_data($image_table, $listing_number);

        if (!$image_data) {
            $this->logger->error('image data not found for listing '.$listing_number);
            return;
        }
        else {
            $this->logger->info('got image data '. implode(" ", $image_data));            
        }

        $active_path = $images_path . $lower_ptype . '/active/';
        $staging_path = $images_path . $lower_ptype . '/staging/';

        // Get API username and pw from config
        $mlsUsername = $this->rp_config['nwmls']['api_user'];
        $mlsPassword = $this->rp_config['nwmls']['api_pw'];

        // Set up for accessing NWMLS via SOAP API
        $XML_image_url = 'http://images.idx.nwmls.com/imageservice/imagequery.asmx?WSDL';
        $xml_client = new SoapClient($XML_image_url);
        /////// END CONFIG VARIABLES


        // Get current listing number and status
        $ln = $image_data['ListingNumber'];
        $listing_status = $image_data['ListingStatus'];
            
        // Get type of request
        $request = $image_data['PendingRequest'];
            
        // Assume everything will be successful (Completed)
        $final_status = 'C';
            
        // Get appropriate query based on request
        if ($request == 'L') {
            // Get query for initial load
            $image_query = '<ByListingNumber>'.$ln.'</ByListingNumber>';
        } else {
            // Get query for update
            $beginDate = new DateTime($image_data['LatestUploadDT']);
            $beginDate->add(new DateInterval("PT1S"));
            $beginDateStr = get_image_format_datetime($beginDate);
            $image_query = '<ByModifiedDate><ListingNumber>'.$ln.'</ListingNumber><BeginDate>'.$beginDateStr.'</BeginDate></ByModifiedDate>';
        }
        
        // If Sold or Unlisted status set query to get only the first image
        if ($listing_status == 'S' || $listing_status == 'U') {
            $image_query = '<BySequence><ListingNumber>'.$ln.'</ListingNumber><Sequence>0</Sequence></BySequence>';
        }
                
        // Initialize image load for both types: initial load and subsequent updates
        $image_data = initialize_image_load($this->mpDB, $image_table, $image_data, $active_path, $staging_path);
        // close the connection while we load the images
        $this->mpDB->close(); 

        // Get number of image files currently active and available
        $active_count = $image_data['ActiveCount'];
        $update_count = $image_data['UpdateCount'];
        
        $this->logger->info($image_query);

        $xml_query = '<?xml version="1.0"?>
            <ImageQuery xmlns="NWMLS:EverNet:ImageQuery:1.0">
            <Auth>
                <UserId>'.$mlsUsername.'</UserId>
                <Password>'.$mlsPassword.'</Password>
            </Auth>
            <Query>'.$image_query.'</Query>
            <Results>
                <Schema>NWMLS:EverNet:ImageData:1.0</Schema>
            </Results>
            </ImageQuery>';
                
            
        $params = array ( 'query' => $xml_query );

        // Catch the SOAP errors and handle gracefully
        $success = FALSE;

        try {
            $result = $xml_client->RetrieveImages ( $params );
            $this->logger->info('got images from mls');
            $success = TRUE;
        }
        catch (Exception $e) {
            $success = FALSE;
            $errmsg  = 'ERROR!  Could not retrieve image files for listing: ' . $ln . PHP_EOL;
            $errmsg .= 'Detail: ' . $e->getMessage() . PHP_EOL;
            //fwrite($logfile, $errmsg);
            $this->logger->error($errmsg);
        }
            
            // If soap call was successful, process retrieved images
        if ($success) {
            $num_images_loaded = 0;
            $latest_date = EARLIEST_IMAGE_DATE;
            $xml = new SimpleXMLElement($result->RetrieveImagesResult);

            // DEBUG
            //$xml_record = $xml->asXML();
            //$this->logger->info($xml_record);
            //$xml_filename = $log_path . 'nwmls_' . $ln . '.xml';
            //$bytes = file_put_contents($xml_filename, $xml_record);
            
            // If images returned, loop over and process them
            if ($xml && isset($xml->Images)) {
                
                // Loop processing each image
                foreach ($xml->Images->Image as $img) {
                    
                    if ($img != null && $img->BLOB) {

                        // Get 2 digit image sequence
                        $imgnum = sprintf("%02d", (int)($img->ImageOrder));
                        
                        // DEBUG
                        //println("Inside image BLOG processing loop for image $imgnum");
                        
                        // If special case of Sold listing, make sure only image 0 is processed.
                        // Shouldn't have to do this, but need it in case nwmls doesn't process
                        // the request correctly (their api services are terrible).
                        if ($listing_status == 'S' && $imgnum != '00') continue;
                        
                        //$filename = 'nwmls_' . $ln . '_' . $imgnum . '.jpg';
                        $filename = 'nwmls_' . $lower_ptype . '_' . $ln . '_' . $imgnum . '.jpg';
                        $image_file_path = $staging_path . $ln . '/' . $filename;
                        
                        // Write image file in proper location
                        $bytes = file_put_contents($image_file_path, base64_decode($img->BLOB));

                        if ($bytes) {
                            
                            // Get image upload date/time
                            $image_date = (string)$img->UploadDt;
                            
                            // DEBUG
                            //println("Listing $ln image $imgnum DateTime: $image_date");
                            
                            // If a decimal with fractional second is included, remove it
                            if (($decimal_pos=strpos($image_date, '.')) !== false) {
                                $image_date = substr($image_date, 0, $decimal_pos);
                            }
                            
                            // Update latest date if appropriate
                            if (strcmp($image_date, $latest_date) > 0) $latest_date = $image_date;
                            
                            // Create new thumbnail if new 00 (feature) image file was just created
                            if ($imgnum == '00') {
                                
                                $thumb_filename = 'nwmls_' . $lower_ptype . '_' . $ln . '_thumbnail.jpg';
                                $thumb_file_path = $staging_path . $ln . '/' . $thumb_filename;
                                generate_thumbnail_via_im($image_file_path, $thumb_file_path, 135, 100);
                                
                            }
                            
                            $num_images_loaded++;
                        }

                        //println("Listing[" . $ln . "]A total of " . number_format($bytes) . " bytes written to image file:" . $staging_path . $filename);
                        
                        // If special case of Sold listing and image 0 was just processed, break out of loop.
                        // Shouldn't have to do this, but need it in case nwmls doesn't process
                        // the request correctly (their api services are terrible).
                        if ($listing_status == 'S' && $imgnum == '00') break;
                    }
                }
            }
            else {
                $this->logger->info('No images returned');
            }
                
            // Update counters
            $listing_num++;
            $total_images_loaded += $num_images_loaded;

            // Update log file
            $log_entry = "Listing $listing_num of $listing_count [LN=$ln] -- Total number of image files loaded=$num_images_loaded" . PHP_EOL;
            $this->logger->info($log_entry);
                
            // Update some things if image files were actually loaded
            if ($num_images_loaded > 0) {
                $image_data['LatestUploadDT'] = get_db_format_datetime($latest_date);
                $transfer_status = transfer_image_files($staging_path, $active_path, $ln);
            }
                    
            // Store how many image files were actually loaded during this update
            $image_data['LoadedCount'] = $num_images_loaded;
            
            // Remove staging dir since no longer needed
            remove_staging_dir($staging_path, $ln);
                
            // If new image count less than old, delete some image files
            if ($update_count < $active_count) {
                trim_image_files($active_path, $lower_ptype, $ln, $update_count, $active_count-1);
            }
                
            // Get number of physical files in active directory
            $active_dir = $active_path . $ln;
            $active_count = get_dir_file_count($active_dir);
            $image_data['ActiveCount'] = $active_count;
            
        } else {
            
            // Failed
            $final_status = 'F';
            
            //$xml = new SimpleXMLElement($result->RetrieveImagesResult);
            //$xml_record = $xml->asXML();
            //$filename = 'nwmls_' . $ln . '.xml';
            //$bytes = file_put_contents($staging_path . $filename, $xml_record);
        }
        
        // Finalize the image data in the DB
        $this->mpDB->connect(); // reopen the connection
        $updated_image_data = finalize_image_load($this->mpDB, $image_table, $image_data, $final_status);
        $this->mpDB->close(); // close the connection

        // update ElasticSearch with image info
        $payload = [
            'LN' => $ln,
            'active_count' => $updated_image_data['ActiveCount'],
            'availability' => $updated_image_data['Availability']
        ];

        $result = $this->lambdaclient->invoke([
            'FunctionName' => 'search-'.$this->stage.'-updateImagePaths',
            'Payload' => json_encode($payload)
        ]);
    }
    
    function start_images($argv, $images_path) {
        if (!file_exists($images_path)) {
            mkdir('s3://realpeekimages');
        }
        // Set default timezone
        date_default_timezone_set('America/Los_Angeles');

        $this->logger->info('start images');
        // Get current date/time
        $now = new DateTime();
        $nowStr = $now->format(DateTime::ATOM);


        // If command line, get CLI parameters into $_GET array
        if (!isweb()) {
            //parse_str(implode('&', array_slice($argv, 1)), $_GET);
            $_GET = $argv;
        }

        // Make sure property options set
        if (!isset($_GET['PropertyType'])) {
            println('Invalid request!  You must specify the PropertyType option.');
            if (isweb()) {
                println('For example:&nbsp;&nbsp;&nbsp;' . $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'] . '?PropertyType=RESI');
            } else {
                println('For example:   ' . $argv[0] . ' PropertyType=RESI');
            }
            return;
        } else {
            // Get specified propert type
            $ptype = $_GET['PropertyType'];
        }

        // Activate database
        $mpDB = new MP_Image_Database($this->rp_config);

        // Get paths to everything
        //$mls_path = '/mlsdata/nwmls/' . $ptype . '/';
        //$images_path = $mls_path . 'images/';
        //$log_path = $images_path;
        $active_path = $images_path . '/active/';
        $staging_path = $images_path . '/staging/';
        //$log_filename = $log_path . 'nwmls_' . $ptype . '_image_updates.log';

        // Initialize log file
        $log_entry = $nowStr . ' -- BEGIN IMAGE UPDATES --' . PHP_EOL;
        $this->logger->info($log_entry);

        // Retrieve all pending image data updates
        $listing_table = 'mp' . $ptype;
        $image_table = $listing_table . 'images';
        //$pending_image_data_count = $mpDB->get_pending_image_data_count($image_table);
        //$this->logger->info($pending_image_data_count);
        //return $pending_image_data_count;
        $pending_image_data = $mpDB->get_pending_image_data($image_table,' LIMIT 10000');
        $listing_count = count($pending_image_data);

        // Initialize counters
        $listing_num = 0;
        $total_images_loaded = 0;

        $log_entry = "Found $listing_count listing updates. Starting image processing." . PHP_EOL;
        $this->logger->info($log_entry);

        // Iterate over image data records, processing each pending request
        foreach ($pending_image_data as $image_data) {
            
            // Get current listing number and status
            $ln = $image_data['ListingNumber'];

            //$this->logger->info('processing listing '. $ln);
            $payload = [
                'PropertyType' => $ptype,
                'listing' => $ln
            ];

            $result = $this->lambdaclient->invoke([
                'FunctionName' => 'mlsimport-'.$this->stage.'-updateImagesForListing',
                'InvocationType' => 'Event',
                'Payload' => json_encode($payload)
            ]);
            $listing_num++;
        }

        // Write final log entry
        $log_entry = "Processed $listing_num listing updates with a total of $total_images_loaded image files loaded." . PHP_EOL;
        $this->logger->info($log_entry);
        $now = new DateTime(null, new DateTimeZone('America/Los_Angeles'));
        $nowStr = $now->format(DateTime::ATOM);
        $log_entry = $nowStr . ' -- END IMAGE UPDATES --' . PHP_EOL;
        //fwrite($logfile, $log_entry);
        $this->logger->info($log_entry);
        //fclose($logfile);
        //$mpDB->close();

        return;
    }
}












    //---------------------------------------------------------//

    /**
     * Create a thumbnail image from $src_filename
     */
    function generate_thumbnail_via_im($src_filename, $thumbnail_filename, $new_width, $new_height)
    {

        /* Read the image */
        //$im = new imagick($src_filename);
        
        /* create the thumbnail */
        //$im->cropThumbnailImage($new_width, $new_height);
        
        /* Write to thumbnail file */
        //$im->writeImage($thumbnail_filename);
        
    }


    //---------------------------------------------------------//

    function initialize_image_load($mpDB, $table, $image_data, $image_active_path, $image_staging_path) {

        $update_data = array();
        $ln = $image_data['ListingNumber'];
        $request = $image_data['PendingRequest'];
        $startTime = new DateTime();
        $update_data['ReqStatus'] = 'S';
        $update_data['ReqStartedTime'] = get_db_format_datetime($startTime);
        $update_data['ReqCompletedTime'] = null;
        $update_data['ReqFailedTime'] = null;

        // Update the DB
        $mpDB->update_listing_image_data($table, $update_data, $ln, 'U');
        
        // Get full row after update
        $updated_image_data = $mpDB->get_listing_image_data($table, $ln);
        
        // Create subdirs for images as needed
        $image_active_dir = $image_active_path . $ln;
        if (!is_dir($image_active_dir)) {
            mkdir($image_active_dir, 0775, true);
        }
        $image_staging_dir = $image_staging_path . $ln;
        if (!is_dir($image_staging_dir)) {
            mkdir($image_staging_dir, 0775, true);
        }
        
        return $updated_image_data;
    }

    //---------------------------------------------------------//

    function finalize_image_load($mpDB, $table, $image_data, $status) {

        $update_data = array();
        $ln = $image_data['ListingNumber'];	
        $endTime = new DateTime();
        $endTimeStr = get_db_format_datetime($endTime);
        
        // Update status to Completed or Failed
        $update_data['ReqStatus'] = $status;
        
        // Update other values as appropriate for status
        if ($status == 'C') {
            $update_data['LastRequest'] = $image_data['PendingRequest'];
            $update_data['PendingRequest'] = 'N';
            $update_data['ReqCompletedTime'] = $endTimeStr;
            $update_data['ReqFailedTime'] = null;
            $update_data['ActiveCount'] = $image_data['ActiveCount'];
            $update_data['LoadedCount'] = $image_data['LoadedCount'];
            $update_data['LatestUploadDT'] = $image_data['LatestUploadDT'];
            $update_data['Availability'] = ($image_data['ActiveCount'] > 0) ? 'A' : 'U';
        } else if ($status == 'F') {
            // Request failed (probably due to NWMLS issue), so leave
            // Pending request as is for future processing.
            // Update appropriate time fields.
            $update_data['ReqFailedTime'] = $endTimeStr;
            $update_data['ReqCompletedTime'] = null;
            
            // If some images are still loaded, flag as Available
            if ($image_data['ActiveCount'] > 0) {
                $update_data['Availability'] = 'A';
            }  // Don't need else, since it should be 'U' if count is 0
        }

        // Update the DB
        $mpDB->update_listing_image_data($table, $update_data, $ln, 'U');
        
        // Get full row after update
        $updated_image_data = $mpDB->get_listing_image_data($table, $ln);
        
        return $updated_image_data;
    }

    //---------------------------------------------------------//

    function transfer_image_files($staging_path, $active_path, $ln) {
        //$source = $staging_path . $ln . '/*';
        $source = $staging_path . $ln;
        $target = $active_path . $ln;
        //$command = "mv -f $source $target";
        //$output = shell_exec($command);

        $iter= \Aws\recursive_dir_iterator($source);
        foreach ($iter as $filename) {
            $newname = $target . '/' . basename($filename);
            $success = rename($filename, $newname);
            if (!$success) {
                throw new Exception("error renaming file!");
            }
        }
        // DEBUG
        //println("mv output: $output" . PHP_EOL);
        
        //return $output;
        return;
    }

    //---------------------------------------------------------//

    function remove_staging_dir($staging_path, $ln) {
        
        // Remove the directory
        $staging_dir = $staging_path . $ln;
        rmdir($staging_dir);	
    }

    //---------------------------------------------------------//

    function trim_image_files($active_path, $lower_ptype, $ln, $start, $end) {
        
        $image_dir = $active_path . $ln . '/';
        for ($filenum = $start; $filenum <= $end; $filenum++) {
            $imgnum = sprintf("%02d", $filenum);
            $filename = $image_dir . 'nwmls_' . $lower_ptype . '_' . $ln . '_' . $imgnum . '.jpg';
            
            // Double-check if file exists, and delete if it does
            if (file_exists($filename)) {
                unlink($filename);
            }
        }
    }

    //---------------------------------------------------------//
        
    // Get DB formatted DateTime
    // Note:  Arg can be a string or a DateTime object.
    // If a string is passed in, it must be a format
    // that the DateTime constructor can handle.
    function get_db_format_datetime2($arg) {
        
        if (is_object($arg) && get_class($arg) == 'DateTime') {
            $in_date = $arg;
        } else if (is_string($arg)) {
            $in_date = new DateTime($arg);
        } else {
            $errmsg = 'Invalid argument for method MP_Image_Database::get_db_format_datetime()';
            throw new Exception ($errmsg);
        }

        $db_format_date = $in_date->format('Y-m-d H:i:s');
        
        return $db_format_date;
    }
    //---------------------------------------------------------//
        
    // Get image formatted DateTime
    // Note:  Arg can be a string or a DateTime object.
    // If a string is passed in, it must be a format
    // that the DateTime constructor can handle.
    function get_image_format_datetime($arg) {
        
        if (is_object($arg) && get_class($arg) == 'DateTime') {
            $in_date = $arg;
        } else if (is_string($arg)) {
            $in_date = new DateTime($arg);
        } else {
            $errmsg = 'Invalid argument for method MP_Image_Database::get_image_format_datetime()';
            throw new Exception ($errmsg);
        }

        $db_format_date = $in_date->format('Y-m-d\TH:i:s');
        
        return $db_format_date;
    }

    //---------------------------------------------------------//

    function get_dir_file_count($dir) {
        
        $file_count = 0;
        $fi = new FilesystemIterator($dir, FilesystemIterator::SKIP_DOTS);
        $file_count = iterator_count($fi);

        return $file_count;
    }

    //---------------------------------------------------------//

    function isweb() {
        
        $is_web = http_response_code() !== FALSE;
        
        return $is_web;
    }


//---------------------------------------------------------//
//---------------------------------------------------------//

class MP_Image_Database
{
	
	const dbRESI = 'mpRESI';
	const dbCOND = 'mpCOND';
	const dbMANU = 'mpMANU';
	const dbRENT = 'mpRENT';
	
	const std_resi_columns =
	'`LN`,`PTYP`,`ST`,`LP`,`SP`,`OLP`,`HSN`,`DRP`,`STR`,`SSUF`,`DRS`,`UNT`,`CIT`,`STA`,`ZIP`,`BR`,`BTH`,`ASF`,`UD`,`LDR`,`LD`,`CLO`,`PARQ`,`BREO`,`BDC`,`YBT`,`LONG`,`LAT`,`EffectiveYearBuilt`,`EffectiveYearBuiltSource`,`mpStatus`,`mpStyle`,`mpGeoPos`';
	const std_cond_columns =
	'`LN`,`PTYP`,`ST`,`LP`,`SP`,`OLP`,`HSN`,`DRP`,`STR`,`SSUF`,`DRS`,`UNT`,`CIT`,`STA`,`ZIP`,`BR`,`BTH`,`ASF`,`UD`,`LDR`,`LD`,`CLO`,`PARQ`,`BREO`,`YBT`,`LONG`,`LAT`,`EffectiveYearBuilt`,`EffectiveYearBuiltSource`,`mpStatus`,`mpStyle`,`mpGeoPos`';
	const std_manu_columns =
	'`LN`,`PTYP`,`ST`,`LP`,`SP`,`OLP`,`HSN`,`DRP`,`STR`,`SSUF`,`DRS`,`UNT`,`CIT`,`STA`,`ZIP`,`BR`,`BTH`,`ASF`,`UD`,`LDR`,`LD`,`CLO`,`PARQ`,`BREO`,`BDC`,`YBT`,`LONG`,`LAT`,`mpStatus`,`mpStyle`,`mpGeoPos`';
	const std_rent_columns =
	'`LN`,`PTYP`,`ST`,`LP`,`SP`,`HSN`,`DRP`,`STR`,`SSUF`,`DRS`,`UNT`,`CIT`,`STA`,`ZIP`,`BR`,`BTH`,`ASF`,`UD`,`LDR`,`CLO`,`YBT`,`LONG`,`LAT`,`EffectiveYearBuilt`,`EffectiveYearBuiltSource`,`mpStatus`,`mpStyle`,`mpGeoPos`';
	
	public static $std_db_columns = array (self::dbRESI=>self::std_resi_columns,
	                                       self::dbCOND=>self::std_cond_columns,
										   self::dbMANU=>self::std_manu_columns,
					        			   self::dbRENT=>self::std_rent_columns);
	
	// The connection
	private $mysqli = null;

	public function __construct($rp_config) {
		
		// Get current date/time for later operations
		$now = new DateTime();
		
		// Get config file
		//$rp_config = parse_ini_file('/mlsdata/realpeek.ini', true);
		$this->rp_config = $rp_config;

		// Database credentials
		$db_host = $rp_config['database']['host'];
		$db_name = $rp_config['database']['name'];
		$db_user = $rp_config['database']['user'];
		$db_pass = $rp_config['database']['pw'];
		
		// Open DB connection
		$this->mysqli = new \mysqli($db_host, $db_user, $db_pass, $db_name);
		
		// Handle errors
		if ($this->mysqli->connect_errno) {
			$error_msg = 'Failed to connect to MySQL: ' . $this->mysqli->connect_errno;
			throw new Exception($error_msg);
		}
		
		// Set proper timezone for connection so date/time info
		// stored/retrieved to/from DB is same as PHP.
		$this->mysqli->query("SET `time_zone` = '".date('P')."'");

	}

//---------------------------------------------------------//

	public function query_table($table, $columns, $filters, $order, $limit) {
		
		// Build query string
		$query  = "SELECT $columns from $table";
		
		// If filters specified, add them in
		if ($filters) {
			// Get the full list of filters with AND between each
			$imploded_filters = implode(' AND ', $filters);
			
			// Replace any occurences of AND  AND (due to null for any filter)
			$clean_filters = str_replace('AND  AND', 'AND', $imploded_filters);
			
			// Assemble the final filter string
			$query .= ' WHERE ' . $clean_filters;
		}
		
		// If order specified, tack it on the end
		if ($order) {
			$query .= ' ' . $order;
		}
		
		// If limit specified, tack it on the end
		if ($limit) {
			$query .= ' ' . $limit;
		}
		
		// Remember to terminate it with final semi-colon!
		$query .= ";";
        
        //print($query);
		// DEBUG
		//println("******* query_table function call" . PHP_EOL);
		//println("table: $table");
		//println("query: $query" . PHP_EOL);
		
		// Table name already in the query string.
		// We use $table for error message further down.
		$result = $this->mysqli->query($query);
		
		// Handle errors
		if ($result === false) {
			
			$errno = $this->mysqli->errno;
			$errmsg = $this->mysqli->error;
			$dberrmsg = 'DB error!  Table:' . $table . ', Code:' . $errno . ', Detail:' . $errmsg;
			throw new Exception($dberrmsg);
				
		}
		
		return $result;
	}

//---------------------------------------------------------//

	public function get_listings($table, $columns, $filters, $order, $limit) {
		
		$listings = null;
		
		// Execute query via query_table(), which takes care
		// of error handling.
		$result = $this->query_table($table, $columns, $filters, $order, $limit);
		
		// Get rows if any returned
		if ($result->num_rows) {
			$listings = array();
			for ($index = 0; $index < $result->num_rows; $index++) {
				$listings[$index] = $result->fetch_assoc();
			}
		}
		
		return $listings;
	}

//---------------------------------------------------------//

	public function get_single_listing($table, $ln, $columns) {
		
		// Set columns and filter for listing
		$query_filter = array("`LN`=$ln");
		
		// Get the listing via get_listings() - array is returned
		$listings = $this->get_listings($table, $columns, $query_filter, null, null);
		
		// Get the individual listing from the array
		if ($listings) {
			$listing = $listings[0];
		} else {
			$listing = null;
		}
		
		return $listing;
	}

//---------------------------------------------------------//

	public function get_listing_info($table, $ln) {
		
		$listingColumns = '`LN`,`PIC`,`mpStatus`';
		
		$listing = $this->get_single_listing($table, $ln, $listingColumns);
		
		return $listing;
	}

//---------------------------------------------------------//

	public function get_listing_image_data($table, $ln) {
		
		$rows = null;
		$imageColumns = '`ListingNumber`,`ListingStatus`,`ActiveCount`,`UpdateCount`,`LoadedCount`,`PendingRequest`,`ReqStatus`,`LastRequest`,`ReqStartedTime`,`ReqCompletedTime`,`Availability`,`LatestUploadDT`';
		
		// Set columns and filter for listing
		$query_filter = array("`ListingNumber`=$ln");
		
		// Execute query via query_table(), which takes care
		// of error handling.
		$result = $this->query_table($table, $imageColumns, $query_filter, null, null);
		
		// Get rows if any returned
		if ($result->num_rows) {
			$rows = array();
			for ($index = 0; $index < $result->num_rows; $index++) {
				$rows[$index] = $result->fetch_assoc();
			}
		}
		
		// Get the individual listing from the array
		if ($rows) {
			$image_data = $rows[0];
		} else {
			$image_data = null;
		}
		
		return $image_data;
	}

    //---------------------------------------------------------//

    public function get_pending_image_data_count($table) {
            
        $rows = array();
        $imageColumns = 'count(*)';

        // Set columns and filter for listing
        $query_filter = array("`PendingRequest`!='N'");
        
        // Execute query via query_table(), which takes care
        // of error handling.
        $result = $this->query_table($table, $imageColumns, $query_filter, null, null);
        
        // Get rows if any returned
        if ($result->num_rows) {
            for ($index = 0; $index < $result->num_rows; $index++) {
                $rows[$index] = $result->fetch_assoc();
            }
        }
        $count = $rows[0][$imageColumns];
        
        return $count;
    }

//---------------------------------------------------------//

	public function get_pending_image_data($table, $limit) {
		
		$rows = array();
		$imageColumns = '`ListingNumber`,`ListingStatus`,`ActiveCount`,`UpdateCount`,`LoadedCount`,`PendingRequest`,`ReqStatus`,`LastRequest`,`ReqStartedTime`,`ReqCompletedTime`,`Availability`,`LatestUploadDT`';
		
		// Set columns and filter for listing
		$query_filter = array("`PendingRequest`!='N'", "`ListingStatus` in ('A', 'P')", "`ActiveCount`=0");
		
		// Execute query via query_table(), which takes care
		// of error handling.
		$result = $this->query_table($table, $imageColumns, $query_filter, null, $limit);
		
		// Get rows if any returned
		if ($result->num_rows) {
			for ($index = 0; $index < $result->num_rows; $index++) {
				$rows[$index] = $result->fetch_assoc();
			}
		}
		
		return $rows;
	}
	
//---------------------------------------------------------//
	
	public function update_listing_image_data($table, $updates, $ln, $style) {
		
		// Initialize update strings and counter
		$dbColumnString = '';
		$dbValueString = '';
		$dbSetString = '';
		$field_count = 0;
		
		// Loop getting properties (fields) of listing,
		// appending field names and values to respective
		// strings required for DB update.
		foreach($updates as $field_name=>$field_value) {
			
			if ($field_count != 0) {
				if ($style == 'U') {
					$dbSetString .= ',';
				} else {
					$dbColumnString .= ',';
					$dbValueString .= ',';
				}
			}
			
			if (strlen($field_value) == 0) {
				$safe_value = 'NULL';
			} else {
				$escaped_value = $this->mysqli->real_escape_string($field_value);
				$safe_value = "'$escaped_value'";
			}
			
			if ($style == 'U') {
				$dbSetString .= '`' . $field_name . '`' . '=' . $safe_value;
			} else {
				$dbColumnString .= '`' . $field_name . '`';
				$dbValueString .= $safe_value;
			}
			//println($field_name . '=>' . $safe_value);
			$field_count++;
		}
		
		// Execute the query using the appropriate command
		if ($style == 'I') {
			$query = "INSERT INTO `$table` ($dbColumnString) VALUES ($dbValueString);";
		} else if ($style == 'R') {
			$query = "REPLACE INTO `$table` ($dbColumnString) VALUES ($dbValueString);";
		} else if ($style == 'U') {
			// Use the correct column for WHERE clause
			if (strpos($table, 'images') !== false) {
				$where_col = 'ListingNumber';
			} else {
				$where_col = 'LN';
			}
			$query = "UPDATE $table SET $dbSetString WHERE `$where_col` = $ln;";
		}
		
		// DEBUG
		//println("******* update_listing_image_data function call" . PHP_EOL);
		//println("table: $table");
		//println("query: $query" . PHP_EOL);
		
		// Execute the query
		$result = $this->mysqli->query($query);
		
		// Handle issues
		if (!$result) {
			$errno = $this->mysqli->errno;
			$errmsg = $this->mysqli->error;
			$dberrmsg = 'DB update error!  Table:' . $table . ', Code:' . $errno . ', Detail:' . $errmsg;
			throw new Exception($dberrmsg);
		}
		
		return $result;
	}

//---------------------------------------------------------//
    
    public function connect() {
        
                // Database credentials
        $db_host = $this-> rp_config['database']['host'];
        $db_name = $this-> rp_config['database']['name'];
        $db_user = $this-> rp_config['database']['user'];
        $db_pass = $this-> rp_config['database']['pw'];
        
        // Open DB connection
        $this->mysqli = new \mysqli($db_host, $db_user, $db_pass, $db_name);

        return;
    }

//---------------------------------------------------------//
	
	public function close() {
		$this->mysqli->close();
		
		return;
	}
	
//---------------------------------------------------------//
	
	public function cleanup() {

		$this->close();
	}	
	
}  // class MP_Image_Database

?>