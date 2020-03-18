import React from 'react';
import ReactDOM from 'react-dom';
import Amplify from "aws-amplify";
import config from "./api/config";

/* import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import $ from 'jquery';
import Popper from 'popper.js'; */

//import 'bootstrap/dist/css/bootstrap.css';
//import 'bootstrap/dist/css/bootstrap-theme.css';
import './index.css';
import App from './App';
import { unregister }  from './registerServiceWorker';
import {SettingsProvider} from '../src/api/SettingsProvider';
import {ThroughProvider} from 'react-through'
import './assets/scss/style.css';


Amplify.configure({
    // Auth: {
    //   mandatorySignIn: false,
    //   region: config.cognito.REGION,
    //   userPoolId: config.cognito.USER_POOL_ID,
    //   identityPoolId: config.cognito.IDENTITY_POOL_ID,
    //   userPoolWebClientId: config.cognito.APP_CLIENT_ID
    // },
    API: {
      endpoints: config.apiGateway.endpoints
    },
    Storage: {
      bucket: config.storage.BUCKET,
      region: config.storage.REGION
    }
  });

ReactDOM.render(<SettingsProvider>
  <ThroughProvider>
    <App />
    </ThroughProvider>
    </SettingsProvider>,
  document.getElementById('root'));
//registerServiceWorker();
unregister();
