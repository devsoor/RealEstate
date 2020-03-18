import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom'
import { NavTab } from 'react-router-tabs';
import 'react-router-tabs/styles/react-router-tabs.css';
import PlatformAssumptions from '../admin/PlatformAssumptions';
import ManageSites from './ManageSites';
import ManageConfiguration from './ManageConfiguration';

const ManagePlatform = (props) => {
    
    let match=props.match;
    let childProps=props;

    return <div>
        <div className="noprint">
        <NavTab to={`${match.url}config`}>Platform Settings</NavTab>
        <NavTab to={`${match.url}sites`}>Manage Sites</NavTab>
        <NavTab to={`${match.url}taxes`}>Configuration</NavTab>
        </div>
        <Switch>
            <Redirect exact from={`${match.path}`} to={`${match.path}config`} />
            <Route path={`${match.path}config`} component={PlatformAssumptions} props={childProps} />
            <Route path={`${match.path}sites`} component={ManageSites} props={childProps} />
            <Route path={`${match.path}taxes`} component={ManageConfiguration} props={childProps} />
        </Switch>
    </div>
}

export default ManagePlatform
