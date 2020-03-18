<?php

namespace RealPeek;

use \SoapClient;
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
//
// The inspiration for the below technique came from a variety of
// resources, in particular the example at:
// http://www.binarytides.com/modify-soapclient-request-php/
//
//---------------------------------------------------------//

class NWMLSClient extends SoapClient {

	// Declare constant using Nowdoc notation
	const RETRIEVE_LISTING_SOAP_TEXT = <<<'RETRIEVE_LISTING_SOAP_TEXT'
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
<soap:Body>
<RetrieveListingDataResponse xmlns="http://www.nwmls.com/EverNetServices">
<RetrieveListingDataResult>
</RetrieveListingDataResult>
</RetrieveListingDataResponse>
</soap:Body>
</soap:Envelope>
RETRIEVE_LISTING_SOAP_TEXT;

	private $soap_curl = null;
	private $soap_filename = null;
	private $filep = null;
	private $soap_status = null;
	private $xml_segment = '';
	private $output_buffer = '';
	
	public function get_status() {
		return $this->soap_status;
	}
	
	public function get_nwmls_data_filename() {
		return $this->soap_filename;
	}
	
	public function clean_up() {
		if ($this->soap_curl) {
			curl_close($this->soap_curl);
			$this->soap_curl = null;
		}
		if ($this->filep) {
			fclose($this->filep);
			$this->filep = null;
		}
	}
	
	public function __construct($soap_filename, $wsdl, $test_mode) {
		
		$this->soap_filename = $soap_filename;
		
		// Open file for writing and init parent if not in test mode
		if (!$test_mode) {
			$this->filep = fopen($this->soap_filename, "wb");
			parent::__construct($wsdl);
		} else {
			// Flag soap content successfully retrieved (test mode)
			$this->soap_status = 'Success!';
		}
	}
	
	// This callback function is called by curl for each segment of
	// XML data returned (it can come in various sized segments).
	// Note that the XML data returned by NWMLS is encoded using
	// XML entities (e.g. &lt; &gt; &amp; and so on), which makes
	// processing impossible without being decoded first!  That's
	// why this technique had to be used.  Each call to this callback
	// will result in the segment being decoded and written to file,
	// so that the special html entities will be transformed to
	// normal characters.  This is also used to handle very large
	// XML responses (which can't fit in memory like a typical SOAP
	// response).  What makes this really tricky is that the size of
	// the segments, and where they break, can occur in the middle of
	// an XML entity.  Therefore, this callback function has to use
	// special logic to take that into account.  Fun! Fun! Fun!
	public function curl_write_callback($curlHandle, $incoming_segment) {
		
		try {
			
			$source_segment = null;
			$last_segment = false;
			$next_segment = null;
			$last_end_element_offset = 0;
			
			// Concat incoming segment to any previous remaining segment
			$this->xml_segment .= $incoming_segment;
			
			$xmlseg_len = strlen($this->xml_segment);
			
			// Flag for last segment (containing </soap:Envelope> element)
			if ($xmlseg_len >= 16) {
				$last_segment = strrpos($this->xml_segment, '</soap:Envelope>', -15) !== false;
			} else {
				$last_segment = false;
			}
			
			// Check for the last encoded </ ('&lt;/')in the segment, and keep
			// everything from that point on for the next segment.  This is a safe way
			// of processing segments, by breaking at XML end element boundaries.
			if ($xmlseg_len >= 5) {
				$last_end_element_offset = strrpos($this->xml_segment, '&lt;/', -4);
			} else {
				$last_end_element_offset = false;
			}
			
			// DEBUG
			/*
			println('incoming_segment size: ' . strlen($incoming_segment));
			println('incoming_segment:' . PHP_EOL . $incoming_segment);
			println('xml_segment:' . PHP_EOL . $this->xml_segment);
			println('last_segment = ' . $last_segment);
			println('last_end_element_offset = ' . $last_end_element_offset);
			*/

			
			/* FAULTY LOGIC!  REPLACED WITH SECTION BELOW.
			if (!$last_segment && $last_end_element_offset !== false) {
				// Get length of string that terminates just before last '&lt;/'
				$seglen = $last_end_element_offset;
				$next_segment = substr($this->xml_segment, $seglen);
				$source_segment = substr($this->xml_segment, 0, $seglen);
			} else {
				$source_segment = $this->xml_segment;
				$next_segment = '';
			}
			*/
			
			// Check if last segment, take appropriate action
			if ($last_segment) {
				// Last segment, take the whole thing for decode
				$source_segment = $this->xml_segment;
				$next_segment = '';
			} else {
				// Check for start of end element (use to break segment)
				if ($last_end_element_offset !== false) {
					// Get length of string that terminates just before last '&lt;/'
					$seglen = $last_end_element_offset;
					$next_segment = substr($this->xml_segment, $seglen);
					$source_segment = substr($this->xml_segment, 0, $seglen);
				} else {
					// No end of element for break, so don't decode, just keep for next round
					$next_segment = $source_segment;
					$source_segment = null;
				}
			}
			
			// Decode if appropriate
			if ($source_segment) {
				// Decode XML entities and add results to output buffer
				$this->output_buffer = htmlspecialchars_decode($source_segment);
				
				// Write output buffer to file
				$byte_count = fwrite($this->filep, $this->output_buffer);
				if ($byte_count === false) {
					throw new Exception("Error!  Could not write soap XML output to file: $this->soap_filename");
				} else if ($byte_count < strlen($this->output_buffer)) {
					throw new Exception("Error!  Incomplete write to soap XML output file: $this->soap_filename");
				}
			}
			
			// Set up for next callback
			$this->xml_segment = $next_segment;
			$this->output_buffer = '';
		
		} catch (Exception $e) {
			
			$errmsg = 'Error!  Problem in callback: ' . $e->getMessage() . PHP_EOL;
			$errmsg .= 'INCOMING SEGMENT: ' . PHP_EOL . $incoming_segment . PHP_EOL;
			$errmsg .= 'CURRENT SEGMENT: ' . PHP_EOL . $this->xml_segment . PHP_EOL;
			throw new Exception ($errmsg);
		}
		
		// Must always return length of incoming segment, otherwise
		// curl will exit with error!
		return strlen($incoming_segment);
	}
	
    public function __doRequest($request, $location, $action, $version, $one_way = NULL) 
    {
        
		$soap_result = null;
		
		$soap_request = $request;
         
        $header = array(
            "Content-type: text/xml; charset=utf-8",
			"Connection: Keep-Alive",
            //"Accept: text/xml",
            //"Cache-Control: no-cache",
            //"Pragma: no-cache",
            "SOAPAction: \"$action\"",
            "Content-length: ".strlen($soap_request),
        );
        
		try {
			$this->soap_curl = curl_init();
			 
			$url = $location;
			
			$options = array( 

				CURLOPT_FOLLOWLOCATION   => true,
				CURLOPT_SSL_VERIFYHOST   => false,
				CURLOPT_SSL_VERIFYPEER   => false,
				
				// Register callback function to process segments
				CURLOPT_WRITEFUNCTION    => array($this, 'curl_write_callback'),
				 
				//CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0',
				CURLOPT_USERAGENT        => 'PHP-SOAP/' . phpversion(),
				
				//CURLOPT_VERBOSE        => true,
				
				CURLOPT_URL              => $url ,
				 
				CURLOPT_POSTFIELDS => $soap_request ,
				CURLOPT_HTTPHEADER => $header ,
			);
			 
			curl_setopt_array($this->soap_curl , $options);
			 
			$status = curl_exec($this->soap_curl);

			if( $status === false) 
			{
				$errmsg = 'Error!  SOAP request: ' . curl_error($this->soap_curl);
				$this->soap_status = $errmsg;
			} else {
				// Success!
				$this->soap_status = 'Success!';
			}
		}
		catch (Exception $e) {
			$errmsg = 'Error!  Exception in NWMLS soap request: ';
			$errmsg .= $e->getMessage();
			$this->soap_status = $errmsg;
		}
		finally {
			// Clean up resources
			$this->clean_up();
		}
		
		// Construct valid soap result specifying status
		$soap_result = self::RETRIEVE_LISTING_SOAP_TEXT;
		
		// DEBUG
		//println('NWMLSClient SOAP Result:' . PHP_EOL . $soap_result . PHP_EOL . PHP_EOL);
         
        //return $output;
		return $soap_result;
    }
}  // class NWMLSClient