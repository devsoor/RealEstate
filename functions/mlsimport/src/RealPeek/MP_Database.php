<?php

namespace RealPeek;

use \DateTime;
use \Exception;

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

class MP_Database
{

	private $mysqli = null;
	private $is_update = false;
	private $db_noreplace = false;
	private $prop_type = null;
	private $data_table_name = null;
	private $update_table_name = null;
	
	// These represent columns from the updates table for a given prop type
	private $update_type = null;  // M=Manual Load, U=Update, R=Resumed Update
	private $update_seq = null;
	private $update_status = null;
	private $update_started_time = null;
	private $update_incomplete_time = null;
	private $update_completed_time = null;
	private $update_duration = null;
	private $update_mls_filename = null;
	private $update_mls_begin_date = null;
	private $update_mls_end_date = null;
	private $update_mls_ln = null;
	
	// Used when querying/updating the listing data table for a given prop type
	private $data_query = null;
	private $data_result = null;
	
	public function __construct($prop_type, $is_update, $db_noreplace, &$mlsParameters, $rp_config) {
		
		// Get current date/time for later operations
		$now = new DateTime();
		
		// Property type
		$this->prop_type = $prop_type;

		// Update flag
		$this->is_update = $is_update;
		
		// DB noreplace flag
		$this->db_noreplace = $db_noreplace;
		
		// Update type based on update flag (false = Manual load, true = Update)
		$this->update_type = $is_update ? 'U' : 'M';
		
		// Store table name info
		$this->data_table_name = 'mp' . $prop_type;
		$this->update_table_name = $this->data_table_name . 'updates';
		
		// Get config file
		//$rp_config = [][];//parse_ini_file('/mlsdata/realpeek.ini', true);
		
		// Database credentials
		$db_host = $rp_config['database']['host'];
		$db_name = $rp_config['database']['name'];
		$db_user = $rp_config['database']['user'];
		$db_pass = $rp_config['database']['pw'];
		
		// Open DB connection
		$this->mysqli = new \mysqli($db_host, $db_user, $db_pass, $db_name);
		
		if ($this->mysqli->connect_errno) {
			$error_msg = 'Failed to connect to MySQL: ' . $this->mysqli->connect_errno;
			throw new Exception($error_msg);
		}
		
		// Set proper timezone for connection so date/time info
		// stored/retrieved to/from DB is same as PHP.
		$this->mysqli->query("SET `time_zone` = '".date('P')."'");
		
		// Get shorthand version of table name
		$table = $this->update_table_name;
		
		// If update mode, get last update record from updates table and take appropriate action
		if ($is_update) {
			
			// Get last update record from updates table
			$this->get_last_update_record();
			
			// Get latest update status
			$status = $this->update_status;
			
			// Try to Resume if previous update status is Started, Resumed, Failed, or Aborted.
			// Normally the 'if' statement would just be if ($status != 'C'), however, since we're
			// experimenting with how different statuses are handled, we're doing it this way for now.
			if ($status == 'S' or $status == 'R' || $status == 'F' || $status == 'A') {
				
				// Update MLS BeginDate and EndDate to be last BeginDate and EndDate, respectively
				$new_mls_begin_date_str = get_mls_format_datetime($this->update_mls_begin_date);
				$new_mls_end_date_str = get_mls_format_datetime($this->update_mls_end_date);
				$mlsParameters['BeginDate'] = $new_mls_begin_date_str;
				$mlsParameters['EndDate'] = $new_mls_end_date_str;
					
				// Check if dates are valid and MLS data file is still available and valid
				if (is_valid_mls_request_dates($mlsParameters) &&
				    $this->update_mls_filename != null && $this->update_mls_filename != '' &&
					soapfile_errors($this->update_mls_filename) == null) {
					
					// Set to Resumed Update type (for main level processing)
					$this->update_type = 'R';
					
					// Set the status to Resumed as well, including an
					// updated IncompleteTime.
					$this->set_update_status('R', $now);
					
				} else {
					
					// Something wrong with previous request or MLS file, so flag last as failure and start fresh
					
					// Don't set update_type, since it should be what was read in for the
					// last record. Set the status to Failed with updated IncompleteTime if
					// not already set to Failed (from previous execution).
					if ($status != 'F') $this->set_update_status('F', $now);
					
					// Delete the previous MLS file (prevent accumulation of xml data files)
					delete_file($this->update_mls_filename);
					
					// Start with a fresh update using last update BeginDate
					$new_mls_begin_date_str = get_mls_format_datetime($this->update_mls_begin_date);
					$new_mls_end_date_str = get_new_mls_end_date($now);
					$mlsParameters['BeginDate'] = $new_mls_begin_date_str;
					$mlsParameters['EndDate'] = $new_mls_end_date_str;
					
					// INSERT new entry in updates table
					$this->insert_fresh_update_record($now, $mlsParameters);
				}
			} else {  // Check last update status
			
				// Status is Completed
				if ($this->update_status == 'C') {
					// Completed, so set up fresh update (Started)
					// with BeginDate of last EndDate + 1 sec
					$new_mls_begin_date = new DateTime($this->update_mls_end_date);
					$new_mls_begin_date->add(new DateInterval("PT1S"));
					$new_mls_begin_date_str = get_mls_format_datetime($new_mls_begin_date);
					$new_mls_end_date_str = get_new_mls_end_date($now);
					$mlsParameters['BeginDate'] = $new_mls_begin_date_str;
					$mlsParameters['EndDate'] = $new_mls_end_date_str;
					
					// INSERT new entry in updates table
					$this->insert_fresh_update_record($now, $mlsParameters);
					
				}
				/*  After reviewing the logic further, it may be more appropriate to
				    try to have Failed or Aborted updates Resumed, instead of starting over.
					Therefore, the 'if' statement near the top was changed to include
					the 'F' and 'A' chars for Failed and Aborted (respectively).
				else
				{
					// Failed or Aborted, so set up fresh update
					// with BeginDate same as last BeginDate
					$new_mls_begin_date_str = get_mls_format_datetime($this->update_mls_begin_date);
					$new_mls_end_date_str = get_new_mls_end_date($now);
					$mlsParameters['BeginDate'] = $new_mls_begin_date_str;
					$mlsParameters['EndDate'] = $new_mls_end_date_str;
					
					// INSERT new entry in updates table
					$this->insert_fresh_update_record($now, $mlsParameters);
				}
				*/
			}
		}  else { // check if is_update
		
			// It's a Manual Load, not an Update.
			// Leave BeginDate & EndDate unchanged (user specified).
			$this->insert_fresh_update_record($now, $mlsParameters);
		}
	}

	//---------------------------------------------------------//

	public function is_valid_mls_file() {
		
		$mls_filename = $this->update_mls_filename;
		$is_valid = false;
		
		if (file_exists($mls_filename)) {
			
			// A valid SOAP response with a listing will be more than 400 bytes
			if (filesize($mls_filename) > 400) {
				
				// check if it has closing </soap:Envelope> tag at end
				$fp = fopen($mls_filename, 'rb');
				fseek($fp, -16, SEEK_END);
				// must use 17 to read 16 bytes (see php doc for fgets for answer)
				$endstr = fgets($fp, 17);
				fclose($fp);
				
				if ($endstr == '</soap:Envelope>') {
					$is_valid = true;
				}
			}
				
		}
		
		return $is_valid;
	}
	
	//---------------------------------------------------------//
	
	public function insert_fresh_update_record($now, $mlsParameters) {
		
		// Don't set update_type, since that's done higher up the stack
		
		// Set the rest of the values for a fresh update
		$this->update_status = 'S';
		$this->update_started_time = get_db_format_datetime($now);
		$this->update_incomplete_time = null;
		$this->update_completed_time = null;
		$this->update_duration = null;
		$this->update_mls_filename = null;
		$this->update_mls_begin_date = get_db_format_datetime($mlsParameters['BeginDate']);
		$this->update_mls_end_date = get_db_format_datetime($mlsParameters['EndDate']);
		$this->update_mls_ln = '00000000';  // a string, not an int, to avoid db issues
		
		// INSERT new record in updates table
		$this->insert_update_record();
		 
		 return;
	}
	
	//---------------------------------------------------------//
	
	public function set_update_status($status, $status_time) {
		
		$this->update_status = $status;
		$db_time_str = get_db_format_datetime($status_time);
		$table = $this->update_table_name;
		$duration_query = null;
		
		if ($status == 'C') {
			
			$this->update_completed_time = $db_time_str;
			$time_column = 'CompletedTime';
			$started_time = new DateTime($this->update_started_time);
			$duration = $started_time->diff($status_time);
			$duration_str = $duration->format("%H:%I:%S");
			$this->update_duration = $duration_str;
			$duration_query = ",`Duration`='$duration_str'";
			
			// DEBUG
			/*
			println("*********************************************************");
			println("update_completed_time: $this->update_completed_time");
			println("started_time:" . PHP_EOL . var_export($started_time, true));
			println("status_time:" . PHP_EOL . var_export($status_time, true));
			println("duration:" . PHP_EOL . var_export($duration, true));
			println("duration_str: $duration_str");
			*/
			
		} else {
			
			$this->update_incomplete_time = $db_time_str;
			$time_column = 'IncompleteTime';
			
		}
					
		// No need to include update_type since it doesn't change
		// when updating an existing record.
		
		// Set up the query and do it
		$query  = "UPDATE `$table` ";
		$query .= "SET `Status`='$status',";
		$query .= "`$time_column`='$db_time_str'";
		$query .= $duration_query;
		$query .= " WHERE `Seq`='$this->update_seq'";
		
		$this->query_updates_table($query);
		
		return;
	}
	
	//---------------------------------------------------------//
	
	/* Not needed.  Replaced by above set_update_status() function
	
	public function set_incomplete_status($status, $status_time) {

		$this->update_status = $status;
		$this->update_incomplete_time = get_db_format_datetime($status_time);
					
		// No need to include update_type since it doesn't change
		// when working with a previous update record.
		$query  = "UPDATE `$this->update_table_name` ";
		$query .= "SET `Status`='$this->update_status',";
		$query .= "`IncompleteTime`='$this->update_incomplete_time' ";
		$query .= "WHERE `Seq`='$this->update_seq'";
		
		$this->query_updates_table($query);
		
		return;
	}
	*/
	
//---------------------------------------------------------//
	
	public function insert_update_record() {
		
		$table = $this->update_table_name;
		
		$dbColumnString  = '(`Type`,`Status`,`StartedTime`,`IncompleteTime`,`CompletedTime`,`Duration`,';
		$dbColumnString .= '`MLS_Filename`,`MLS_BeginDate`,`MLS_EndDate`,`MLS_LN`)';
		
		$dbValueString = '(';
		$dbValueArray = array(
			$this->update_type,
			$this->update_status,
			$this->update_started_time,
			$this->update_incomplete_time,
			$this->update_completed_time,
			$this->update_duration,
			$this->update_mls_filename,
			$this->update_mls_begin_date,
			$this->update_mls_end_date,
			$this->update_mls_ln
		);
		
		// DEBUG
		//var_dump($dbValueArray);
		
		$count = 0;
		foreach($dbValueArray as $dbValue) {
			
			if ($count != 0) {
				$dbValueString .= ',';
			}
			if ($dbValue == null || $dbValue == '') {
				$safe_value = 'NULL';
			} else {
				$escaped_value = $this->mysqli->real_escape_string($dbValue);
				$safe_value = "'$escaped_value'";
			}
			$dbValueString .= $safe_value;
			$count++;
		}
		
		$dbValueString .= ')';
		
		// DEBUG
		//println("INSERT dbValueString: " . PHP_EOL . $dbValueString);
		
		$query = "INSERT INTO `$table` $dbColumnString VALUES $dbValueString;";
		$this->query_updates_table($query);
		$this->get_last_update_record();
		
		return;
	}

//---------------------------------------------------------//
	
	public function get_last_update_record() {
		
		$result = $this->query_updates_table("SELECT * FROM `$this->update_table_name` ORDER BY Seq DESC LIMIT 1;");
		
		if ($result->num_rows === 0) {
			
			$errmsg = "Error!  There is no data in the updates table: $this->update_table_name";
			throw new Exception($errmsg);
			
		} else {
			
			// Get the values into array
			$row = $result->fetch_assoc();
			
			$this->update_seq = $row['Seq'];
			
			// Don't load 'Type', since that would overwrite the update_type currently set
			
			$this->update_status = $row['Status'];
			$this->update_started_time = $row['StartedTime'];
			$this->update_incomplete_time = $row['IncompleteTime'];
			$this->update_completed_time = $row['CompletedTime'];
			$this->update_duration = $row['Duration'];
			$this->update_mls_filename = $row['MLS_Filename'];
			$this->update_mls_begin_date = $row['MLS_BeginDate'];
			$this->update_mls_end_date = $row['MLS_EndDate'];
			$this->update_mls_ln = $row['MLS_LN'];
		}
		
		return;
	}
	
//---------------------------------------------------------//
	
	public function close() {
		
		$this->mysqli->close();
		
		return;
	}

//---------------------------------------------------------//
	
	public function get_processing_mode() {
		
		// The reason the function is called get_processing_mode
		// instead of get_update_type is that to the high
		// level code making the requet, it is the mode of
		// processing the listings.  But in this class, it
		// indicates the type of DB update.  This is what
		// makes classes so great (abstraction).
		return $this->update_type;
	}

//---------------------------------------------------------//
	
	public function get_update_mls_filename() {
		
		return $this->update_mls_filename;
	}

//---------------------------------------------------------//
	
	public function set_update_mls_filename($filename) {

		$this->update_mls_filename = $filename;
		
		$query  = "UPDATE `$this->update_table_name` ";
		$query .= "SET `MLS_Filename`='$this->update_mls_filename' ";
		$query .= "WHERE `Seq`='$this->update_seq'";
		
		$this->query_updates_table($query);
	}

//---------------------------------------------------------//
	
	public function get_data_table_name() {
		
		return $this->data_table_name;
	}
	
//---------------------------------------------------------//
	
	public function get_update_table_name() {
		
		return $this->update_table_name;
	}
	
//---------------------------------------------------------//
	
	public function get_update_mls_ln() {
		
		return $this->update_mls_ln;
	}
	
//---------------------------------------------------------//
	
	public function set_update_mls_ln($ln) {
		
		$this->update_mls_ln = $ln;
		$table = $this->update_table_name;
		
		$query = "UPDATE `$table` SET `MLS_LN`='$this->update_mls_ln' WHERE `Seq`='$this->update_seq'";
		$this->query_updates_table($query);
		
		return;
	}

//---------------------------------------------------------//

	public function query_updates_table($query) {
		
		$result = $this->mysqli->query($query);
		
		// Handle errors
		if ($result === false) {
			
			$errno = $this->mysqli->errno;
			$errmsg = $this->mysqli->error;
			$dberrmsg  = 'DB update error!  Table:' . $this->update_table_name . ', Code:' . $errno . ', Detail:' . $errmsg . PHP_EOL;
			$dberrmsg .= 'Query: ' . $query . PHP_EOL;
			throw new Exception($dberrmsg);
				
		}
		
		return $result;
	}
	public function delete_temp_table($table) {
		$deleteTmpTableQuery = "DROP TABLE " . $table;
		$this->mysqli->query($deleteTmpTableQuery);
	}

	public function get_difference($source_table, $diff_table, $column, $filters) {
		
		array_push($filters, '('. $column . ' NOT IN (SELECT ' . $column . ' FROM ' .$diff_table . '))');
		$filterStr = implode(' AND ', $filters);
		$query = 'SELECT ' . $column . ' FROM ' . $source_table . 
			' WHERE ' . $filterStr;
		println($query);
		return $this->query_updates_table($query);
	}
	public function create_temp_table($table) {
		$createTmpTableQuery = "CREATE TEMPORARY TABLE " . $table . " (LN int(8) NOT NULL)";
		$this->mysqli->query($createTmpTableQuery);		
	}

    public function import_to_temp_table($table, $xmlfile, $listing_xml_name) {
        $this->mysqli->query("START TRANSACTION");
		$query = "LOAD XML LOCAL INFILE '" . $xmlfile . "' INTO TABLE " . $table . 
			" ROWS IDENTIFIED BY '<". $listing_xml_name .">'";
		$this->mysqli->query($query);
		// $query = "INSERT INTO ". $table . " (LN) VALUES (?)";
		// println($query);
        // $stmt = $this->mysqli->prepare($query);
        // $stmt->bind_param("i", $one);


        // foreach ($listings as $one) {
        //     $stmt->execute();
        // }
        // $stmt->close();
        $this->mysqli->query("COMMIT");
    }
//---------------------------------------------------------//
	
	public function update_database($table, $updates, $id, $style) {
		
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
				
			} else if (strpos($table, 'wp') !== false) {
				
				$where_col = 'UniqueID';
				
			} else {
				
				$where_col = 'LN';
			}
			
			// Surround $id for where clause with quotes if not a number
			if (is_numeric($id)) {
				
				$id_val = $id;
				
			} else {
				
				$id_val = "'$id'";
				
			}
			$query = "UPDATE $table SET $dbSetString WHERE `$where_col` = $id_val;";
			
		}
		
		// DEBUG
		//println("******* update_database function call" . PHP_EOL);
		//println("table: $table");
		//println("query: $query" . PHP_EOL);
		
		// Execute the query
		$result = $this->mysqli->query($query);
		
		// Handle issues
		if (!$result) {
			$errno = $this->mysqli->errno;
			$errmsg = $this->mysqli->error;
			$dberrmsg = 'DB update error!  Table:' . $table . ', Code:' . $errno . ', Detail:' . $errmsg . PHP_EOL;
			$dberrmsg .= "Query: $query" . PHP_EOL;
			throw new Exception($dberrmsg);
		}
		
		return $result;
	}
	
//---------------------------------------------------------//
	
	public function update_data_table($listing) {
		
		// Initialize update strings and counter
		$dbColumnString = '(';
		$dbValueString = '(';
		$field_count = 0;
		
		// Loop getting properties (fields) of listing,
		// appending field names and values to respective
		// strings required for DB update.
		foreach($listing as $field_name=>$field_value) {
			
			if ($field_count != 0) {
				$dbColumnString .= ',';
				$dbValueString .= ',';
			}
			$dbColumnString .= '`' . $field_name . '`';
			if (strlen($field_value->__toString()) == 0) {
				$safe_value = 'NULL';
			} else {
				$escaped_value = $this->mysqli->real_escape_string($field_value);
				$safe_value = "'$escaped_value'";
			}
			$dbValueString .= $safe_value;
			//println($field_name . '=>' . $safe_value);
			$field_count++;
		}
		
		// Add mpGeoPos to enable proximity search
		$lng = $listing->LONG;
		$lat = $listing->LAT;
		$dbColumnString .= ',`mpGeoPos`';
		$dbValueString .= ",ST_GeomFromText('POINT($lng $lat)')";
		
		// Add closing paren for each
		$dbColumnString .= ')';
		$dbValueString .= ')';
		
		// Complete the query string
		$table_name = $this->data_table_name;
		
		// Execute the query using the appropriate command
		if ($this->db_noreplace) {
			$this->data_query = "INSERT IGNORE INTO `$table_name` $dbColumnString VALUES $dbValueString;";
		} else {
			$this->data_query = "REPLACE INTO `$table_name` $dbColumnString VALUES $dbValueString;";
		}
		
		// DEBUG
		//println('---------');
		//println('---------');
		//println('DB QUERY=>' . $this->data_query);
		
		// Execute the query
		$this->data_result = $this->mysqli->query($this->data_query);
		
		// Handle issues
		if (!$this->data_result) {
			$errno = $this->mysqli->errno;
			$errmsg = $this->mysqli->error;
			$dberrmsg  = 'DB update error!  Table:' . $table_name . ', Code:' . $errno . ', Detail:' . $errmsg . PHP_EOL;
			$dberrmsg .= 'Query: ' . $query . PHP_EOL;
			throw new Exception($dberrmsg);
		}
		
		return $this->data_result;
	}

//---------------------------------------------------------//
	
	public function update_wp_sync_table($listing) {
		
		// Update the WP sync table to include the latest info for the listing
		$table = $this->data_table_name . 'wp';
		
		// Set up update record
		$ln = $listing->LN->__toString();
		$unique_id = 'nwmls-' . $ln;
		$mpStatus = $listing->mpStatus->__toString();
		$property_date = $listing->UD->__toString();
		
		$update_data = array( 'UniqueID'=>$unique_id, 'MLS_Vendor'=>'NWMLS', 'LN'=>$ln, 'Status'=>$mpStatus, 'PropertyDate'=>$property_date );
		
		// Default to Insert style for updating record
		$update_style = 'I';
		
		// See if record already exists, and use appropriate method for insert/update
		$columns = '`LN`';
		$filters = array( "LN=$ln" );
		
		// Query sync table to see if record already exists
		$db_result = $this->query_table($table, $columns, $filters, null, null);
		if ($db_result->num_rows) {
			
			// Use Update style since record already exists
			$update_style = 'U';

		}

		// Update the record in the WP sync table if listing is not Sold/Unlisted, or if the record already exists in the
		// WP sync table (update style is 'U').  Updating a Sold/Unlisted listing in the WP sync table will cause it to
		// eventually be deleted from both WP & the sync table.  The update style will be set to 'U' if the listing
		// already exists in the WP sync table, in which case it needs to have the status updated (even if Sold/Unlisted).
		// A listing may have been put in the WP sync table before it was sold/unlisted, and therefore potentially added as a
		// post in the WP DB.  So when the status changes to sold/unlisted, that status needs to be updated in the WP sync
		// table so that the sync logic can take appropriate steps to remove it from the WP DB and from the sync table.
		// Note:  The status of 'U' is internal to our logic.  It is not a valid status code for NWMLS.  It is used to denote
		// a listing that no longer exists in NWMLS.  In theory the mpStatus should never be 'U' at this point, since this
		// logic is processing a listing being imported (updated) from NWMLS (after requesting updates via the SOAP API).
		// Nevertheless, the check for mpStatus of 'U' is included here for completeness.
		if (($mpStatus != 'S' && $mpStatus != 'U') || $update_style == 'U') {
			
			try {

				$this->update_database($table, $update_data, $unique_id, $update_style);
				
			}
			catch (Exception $e) {
				
				$errmsg  = 'ERROR!  Could not update record:' . PHP_EOL;
				$errmsg .= 'Detail: ' . $e->getMessage() . PHP_EOL;
				throw new Exception($errmsg);		
			}
			
		}
			
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
			$dberrmsg  = 'DB error!  Table:' . $table . ', Code:' . $errno . ', Detail:' . $errmsg . PHP_EOL;
			$dberrmsg .= 'Query: ' . $query . PHP_EOL;
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
		
		$listingColumns = '`LN`,`PIC`,`mpStatus`,`UD`';
		
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
	
	public function update_listing_image_data($table, $imagedata, $ln, $style) {
		
		// Initialize update strings and counter
		$dbColumnString = '';
		$dbValueString = '';
		$dbSetString = '';
		$field_count = 0;
		
		// Loop getting properties (fields) of listing,
		// appending field names and values to respective
		// strings required for DB update.
		foreach($imagedata as $field_name=>$field_value) {
			
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
			$query = "UPDATE $table SET $dbSetString WHERE `ListingNumber` = $ln;";
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
			$dberrmsg  = 'DB update error!  Table:' . $table . ', Code:' . $errno . ', Detail:' . $errmsg . PHP_EOL;
			$dberrmsg .= 'Query: ' . $query . PHP_EOL;
			throw new Exception($dberrmsg);
		}
		
		return $result;
	}
	
}  // class MP_Database



    //---------------------------------------------------------//
        
    // Get DB formatted DateTime
    // Note:  Arg can be a string or a DateTime object.
    // If a string is passed in, it must be a format
    // that the DateTime constructor can handle.
    function get_db_format_datetime($arg) {
        
        if (is_object($arg) && get_class($arg) == 'DateTime') {
            $in_date = $arg;
        } else if (is_string($arg)) {
            $in_date = new DateTime($arg);
        } else {
            $errmsg = 'Invalid argument for method MP_Database::get_db_format_datetime()';
            throw new Exception ($errmsg);
        }
    
        $db_format_date = $in_date->format('Y-m-d H:i:s');
        
        return $db_format_date;
    }


    //---------------------------------------------------------//
    //---------------------------------------------------------//
    //---------------------------------------------------------//
    
    function println($string_message) {
        global $logger;
        $logger->info($string_message . PHP_EOL);
        //print "$string_message" . PHP_EOL;
            
        return;
    }