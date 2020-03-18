import React from 'react';
import { Route, Switch } from 'react-router-dom'
import { NavTab } from 'react-router-tabs';
import 'react-router-tabs/styles/react-router-tabs.css';
import SiteAssumptions from './SiteAssumptions';
import ViewSiteConfiguration from './ViewSiteConfiguration';
import EditAgentProfile from './EditAgentProfile';
import UserList from './UserList';
import {Authorization} from "../auth/Authorization/Can";
import BillingPlaceholder from './BillingPlaceholder';
import SiteMemberList from './SiteMemberList';
import { AgentLicenseAgreement } from '../disclaimers/RealPeekDisclaimers';

const ManageSite = (props) => {
    
    let match=props.match;
    let childProps=props;

    return <div>
        <div className="noprint">
        <NavTab to={`${match.url}/profile`}>Agent Profile</NavTab>
        <NavTab to={`${match.url}/site`}>Site Configuration</NavTab>
        <NavTab to={`${match.url}/members`}>Members</NavTab>
        <NavTab to={`${match.url}/users`}>Users</NavTab>
        <NavTab to={`${match.url}/comp`}>Comp Criteria</NavTab>
        <NavTab to={`${match.url}/license`}>License</NavTab>
        </div>
        <Switch>
            <Route path={`${match.path}/members`} component={SiteMemberList} props={childProps} />
            <Route path={`${match.path}/users`} component={UserList} props={childProps} />
            <Route path={`${match.path}/site`} component={ViewSiteConfiguration} props={childProps} />
            <Route path={`${match.path}/profile`} component={EditAgentProfile} props={childProps} />
            <Route path={`${match.path}/comp`} component={SiteAssumptions} props={childProps} />
            <Route path={`${match.path}/license`} component={AgentLicenseAgreement} props={childProps} />
        </Switch>
    </div>
}

export default Authorization(ManageSite, "manage", "site") 
