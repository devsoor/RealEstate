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

class MP_Database_Simple
{
	private $mysqli = null;
	private $update_query = null;
	private $update_result = null;
	
	public function __construct($rp_config, $logger) {
		$this->logger = $logger;
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
	}
	
	public function close() {
		$this->mysqli->close();
	}
	
	public function bulk_update_table_batched($table_name, $records) {
		$dbColumns = [];
		$dbUpdates = [];
		
		// get the first record to find the column names so we can prepare the statement
		$record = $records[0];
		foreach($record as $field_name=>$field_value) {
			$dbColumns[] = $field_name;
			$dbUpdates[] ="$field_name=VALUES($field_name)";
		}

		$batches = array_chunk($records, 1000);
		foreach($batches as $batch) {
			$valueSets = [];
			foreach($batch as $records) {
				$values = [];
				foreach($records as $field_name=>$field_value) {
					if (strlen($field_value->__toString()) == 0) {
						$safe_value = 'NULL';
					} else {
						$escaped_value = $this->mysqli->real_escape_string($field_value);
						$safe_value = "'$escaped_value'";
					}
					$values[] = $safe_value;
				}
				$valueSets[] = "(" . implode(",", $values) . ")";
			}
			$valueSetsString = implode(",", $valueSets);
		
			$dbColumnString = implode(",", $dbColumns);
			$dbUpdateString = implode(",", $dbUpdates);
			$query = "INSERT INTO `$table_name` ($dbColumnString) VALUES $valueSetsString ON DUPLICATE KEY UPDATE $dbUpdateString;";
			// Update DB and handle any errors
			$this->update_result = $this->mysqli->query($query);
			if (!$this->update_result) {
				$errno = $this->mysqli->errno;
				$errmsg = $this->mysqli->error;
				$dberrmsg = "DB update error!  Table:$table_name, Code:$errno, Detail:$errmsg";
				throw new Exception($dberrmsg);
			}
		}
		$this->logger->info('commited transaction');
	}

	public function bulk_update_table($table_name, $records) {
		$dbColumns = [];
		$dbValues = [];
		$dbUpdates = [];
		$dbParamTypes = [];
		
		// get the first record to find the column names so we can prepare the statement
		$record = $records[0];
		foreach($record as $field_name=>$field_value) {
			$dbColumns[] = $field_name;
			$dbValues[] = "?";
			$dbParamTypes[] = "s";
			$dbUpdates[] ="$field_name=VALUES($field_name)";
		}
		$dbColumnString = implode(",", $dbColumns);
		$dbValueString = implode(",", $dbValues);
		$dbUpdateString = implode(",", $dbUpdates);
		$query= "REPLACE INTO `$table_name` ($dbColumnString) VALUES ($dbValueString);";
		//$query = "INSERT INTO `$table_name` ($dbColumnString) VALUES ($dbValueString) ON DUPLICATE KEY UPDATE $dbUpdateString;";
		$stmt = $this->mysqli->prepare($query);
		if ($stmt === false) {
			throw Exception('Error in SQL');
		}
		$dbParamTypesString = implode("", $dbParamTypes);

		$this->mysqli->query("START TRANSACTION");
		foreach($records as $record) {
			$a_params = array();
			foreach($record as $field_name=>$field_value) {
				// if (strlen($field_value->__toString()) == 0) {
				// 	$safe_value = 'NULL';
				// } else {
				// 	$escaped_value = $this->mysqli->real_escape_string($field_value);
				// 	$safe_value = "'$escaped_value'";
				// }
				$a_params[] = $field_value;
			}
			$stmt->bind_param($dbParamTypesString, ...$a_params);
			$stmt->execute();
			$res = $stmt->get_result();
		}
		$stmt->close();
		$this->mysqli->query("COMMIT");
		$this->logger->info('commited transaction');
	}
	public function update_table($table_name, $record) {
		
		// Initialize update strings and counter
		$dbColumnString = '(';
		$dbValueString = '(';
		$field_count = 0;
		
		// Loop getting properties (fields) of record,
		// appending field names and values to respective
		// strings required for DB update.
		foreach($record as $field_name=>$field_value) {
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
			$field_count++;
		}
		
		// Add closing paren for each
		$dbColumnString .= ')';
		$dbValueString .= ')';
		
		$this->update_query = "REPLACE INTO `$table_name` $dbColumnString VALUES $dbValueString;";
		//println('---------');
		//println('---------');
		//println('DB QUERY=>' . $this->update_query);
		
		// Update DB and handle any errors
		$this->update_result = $this->mysqli->query($this->update_query);
		if (!$this->update_result) {
			$errno = $this->mysqli->errno;
			$errmsg = $this->mysqli->error;
			$dberrmsg = "DB update error!  Table:$table_name, Code:$errno, Detail:$errmsg";
			throw new Exception($dberrmsg);
		}
		
		
		return $this->update_result;
	}
}