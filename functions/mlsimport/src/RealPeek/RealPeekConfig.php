<?php

namespace RealPeek;

use Aws\Ssm\SsmClient;
use \Exception;

const param_names =['nwmls_api_user', 'nwmls_api_pw', 'db_host', 'db_name', 'db_user', 'db_pw'];

class RealPeekConfig {

	public function __construct($config) {

	}
	// public function __construct() {
		
	// 	$client = new SsmClient([
    //         'version' => 'latest',
    //         'region' => 'us-west-2',
    //     ]);
    //     $result = $client->getParameters([
    //         'Names' => param_names,
    //         'WithDecryption' => true
    //     ]);
    //     $this->params = $result['Parameters'];
	// }

	// public function get_config() {
	// 	$rp_config = [
	// 		'nwmls'=>[
	// 			'api_user'=>$this->get_config_value('nwmls_api_user'),
	// 			'api_pw'=>$this->get_config_value('nwmls_api_pw')
	// 		],
	// 		'database'=>[
	// 			'host'=>$this->get_config_value('db_host'),
	// 			'name'=>$this->get_config_value('db_name'),
	// 			'user'=>$this->get_config_value('db_user'),
	// 			'pw'=>$this->get_config_value('db_pw')
	// 		]
    //     ];
    //     return $rp_config;
	// }
	// public function get_config_value($config_name) {
	// 	foreach($this->params as $param) {
	// 		if ($param['Name'] == $config_name) {
	// 			return $param['Value'];
	// 		}
	// 	}
	// 	throw new Exception('config value not found for "' . $config_name . '"');
	// }
}