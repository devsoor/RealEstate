import React, { Component } from 'react';

import AuthenticatedRoute from "../routes/AuthenticatedRoute";
import PublicRoute from "../routes/PublicRoute";
import { BrowserRouter, Route } from 'react-router-dom'
import { MasterPage, withMaster } from '../common/MasterPage';
import { withSettings } from '../../api/SettingsProvider'
import ManagePlatform from './ManagePlatform';
import Login from '../auth/Login/LoginPage';
import Switch from 'react-router-dom/Switch';


class Platform extends Component {
    constructor(props) {
        super(props);
  
    }

    render() {
        const childProps = this.props.childProps;
        return <BrowserRouter basename="admin">
                <Switch>
                    <PublicRoute exact path={`/login`} component={withMaster(Login, childProps, "dark")} props={childProps} />
                    <AuthenticatedRoute path="/" component={withMaster(ManagePlatform)} props={childProps}/>
                </Switch>
        </BrowserRouter>
    }
}

export default withSettings(Platform);
