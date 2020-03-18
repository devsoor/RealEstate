import React, { Component } from 'react';
import { Auth } from "aws-amplify";
import { BrowserRouter, Route } from 'react-router-dom'
import Loader from 'react-loader-advanced';
import SiteRoutes from './SiteRoutes';
import { withSettings } from '../../api/SettingsProvider'

class Site extends Component {
  constructor(props) {
    super(props);
  
  }

  render() {
    const status = this.props.settings.registration_status;

    return <BrowserRouter basename={this.props.siteName}>
    
      <SiteRoutes {...this.props} status={status} /> 
    </BrowserRouter>
  }
}

export default withSettings(Site);
