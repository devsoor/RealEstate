import React, { Component } from 'react';
import { Auth } from "aws-amplify";
import Loader from 'react-loader-advanced';
import config from "./api/config";

import './App.css';
import { withSettings } from './api/SettingsProvider'
import Site from './feature/site/Site';
import Platform from './feature/platform/Platform';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      siteName: null,
      siteExists: false,
      isAuthenticated: false,
      isAuthenticating: true
    }
  }

  isAdminSite = (siteName) => {
    siteName = siteName.toLowerCase();
    return !siteName || (siteName === "admin" || siteName === "login");
  }

  async componentDidMount () {
    const pathArray = window.location.pathname.split('/');
    const siteName = pathArray[1];
    if (this.isAdminSite(siteName)) {
      await this.props.fetchSettings();
    }
    else {
      await this.props.fetchSettings(siteName);
    }
    if (this.props.settings) {
      const settings = this.props.settings;
      this.setState({siteName, siteExists: true, isAuthenticating: true});
      Auth.configure(
        {
          Auth: {
            mandatorySignIn: false,
            region: config.cognito.REGION,
            userPoolId: settings.user_pool_id,
            userPoolWebClientId: settings.appclient_id,
            identityPoolId: settings.identity_pool_id
          }
        });

        try {
          let session = await Auth.currentAuthenticatedUser();
          if (session) {
            this.userHasAuthenticated(true);
          }
        }
        catch(e) {
          console.log(e);
          this.userHasAuthenticated(false);
        }
      
        this.setState({ isAuthenticating: false });
    }

    this.setState({loading: false});
  }

  userHasAuthenticated = async (authenticated) => {
    if (!authenticated) {
      console.log('logging out');
      try {
        await Auth.signOut();
        console.log('logged out');
      }
      catch(err) {
        console.log(err);
        console.log('error logging out');
      };
    }
    this.setState({ isAuthenticated: authenticated });
  }


  render() {
    if (this.state.loading) {
      return null;
    }
    if (!this.state.siteExists) {
      return "SITE NOT FOUND";
    }

    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated
    };

    if (this.state.isAuthenticating) {
      return <Loader show={this.state.isAuthenticating} message={'loading'}></Loader>
    }

    if (this.isAdminSite(this.state.siteName)) {
      return <Platform childProps={childProps} />
    }
    else if (this.state.siteName) {
      return <Site siteName={this.state.siteName} childProps={childProps} />
    }
  }
}

export default withSettings(App);
