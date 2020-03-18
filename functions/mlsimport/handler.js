'use strict';

var AWS = require('aws-sdk');
var child_process = require('child_process');

var rp_config = null;

function getConfig() {
  var ssm = new AWS.SSM({
      apiVersion: 'latest',
      region: 'us-west-2'
  });

  var params = {
    Names: ['nwmls_api_user', 'nwmls_api_pw', 'db_host', 'db_name', 'db_user', 'db_pw'],
    WithDecryption: true
  }

  var parameters = {};
  return new Promise((resolve, reject) => {
    if (rp_config) {
      console.log('found params - using cache');
      resolve(rp_config);
    }
    else {
      console.log('getting params from store');
      ssm.getParameters(params, (err, data) => {
        if (err) {
          console.log(err, err.stack);
          reject(err, err.stack);
        }
        else {
          data.Parameters.forEach((element) => {
            var key = element.Name;
            parameters[key] = element.Value;
          }, this);
    
          let config = {
            nwmls: {
              api_user: parameters['nwmls_api_user'],
              api_pw: parameters['nwmls_api_pw']
            },
            database: {
              host: parameters['db_host'],
              name: parameters['db_name'],
              user: parameters['db_user'],
              pw: parameters['db_pw']
            }
          }
          resolve(config);
        }
      });
    }
 
  });
}

module.exports.handle = (event, context, callback) => {

  var response = '';
  var php = './php';

  // get the config from ssm
  getConfig().then((config) => {
    rp_config = config;

    if (typeof event === 'string') {
      event = event ? JSON.parse(event) : {};
    }

    event['rp_config'] = rp_config;
    
    // When using 'serverless invoke local' use the system PHP binary instead
    if (typeof process.env.PWD !== "undefined") {
      php = 'php';
    }

    // Build the context object data
    var contextData = {};
    Object.keys(context).forEach(function(key) {
      if (typeof context[key] !== 'function') {
        contextData[key] = context[key];
      }
    });

    // Launch PHP
    var args = ['handler.php', JSON.stringify(event), JSON.stringify(contextData)];
    var options = {'stdio': ['pipe', 'pipe', 'pipe', 'pipe']};
    var proc = child_process.spawn(php, args, options);

    // Request for remaining time from context
    proc.stdio[3].on('data', function (data) {
      var remaining = context.getRemainingTimeInMillis();
      proc.stdio[3].write(`${remaining}\n`);
    });

    // Output
    proc.stdout.on('data', function (data) {
      response += data.toString()
    });

    // Logging
    proc.stderr.on('data', function(data) {
      console.log(`${data}`);
    })

    // PHP script execution end
    proc.on('close', function(code) {
      if (code !== 0) {
        return callback(new Error(`Process error code ${code}: ${response}`));
      }
      console.log(response);
      
      callback(null, JSON.parse(response));
    });
  });
};
