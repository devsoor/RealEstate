import React, {Component} from "react";
import { API, Auth } from "aws-amplify";
import {getTenantSettings, getSiteSettings, getPlatformSettings} from "./PropertyApi"

export const TenantContext = React.createContext();

export class SettingsProvider extends Component {
    state = {
        siteName: null,
        settings: null
    };
  
    refreshSettings = async() => {
        this.fetchSettings(this.state.siteName);
    }

    fetchSettings = async (site_name) => {
        let settings = null;
        try {
            if (site_name) {
                settings = await getSiteSettings(site_name);
            }
            else {
                settings = await getPlatformSettings();
            }
        }
        catch (err) {
            console.log(err);
        }
        this.setState({settings, siteName: site_name});
    };

    previewSettings = async (tenant_id) => {
      let settings = null;
      try {
          settings = await getTenantSettings(tenant_id);
      }
      catch (err) {
          console.log('no current user');
      }
      this.setState({settings});
  };
  
    render() {
      return (
        <TenantContext.Provider
          value={{ ...this.state, fetchSettings: this.fetchSettings, previewSettings: this.previewSettings, refreshSettings: this.refreshSettings }}
        >
          {this.props.children}
        </TenantContext.Provider>
      );
    }
}


export function withSettings(Component) {
    return function ThemedComponent(props) {
      return (
        <TenantContext.Consumer>
          {value => <Component {...props} {...value} />}
        </TenantContext.Consumer>
      );
    };
}
