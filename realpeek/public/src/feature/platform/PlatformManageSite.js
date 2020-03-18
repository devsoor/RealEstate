import React from 'react';
import { Route, Switch } from 'react-router-dom'
import { NavTab } from 'react-router-tabs';
import 'react-router-tabs/styles/react-router-tabs.css';
import EditSiteConfiguration from './EditSiteConfiguration';
import EditAgentProfile from '../admin/EditAgentProfile';
import UserList from '../admin/UserList';
import {Authorization} from "../auth/Authorization/Can";
import SiteMemberList from '../admin/SiteMemberList';
import {BreadcrumbsItem} from 'react-breadcrumbs-dynamic';

const PlatformManageSite = (props) => {
    
    let match=props.match;
    let childProps=props;

    return <div>
        <div className="noprint">
        <NavTab to={`${match.url}/profile`}>Agent Profile</NavTab>
        <NavTab to={`${match.url}/site`}>Site Configuration</NavTab>
        <NavTab to={`${match.url}/members`}>Members</NavTab>
        <NavTab to={`${match.url}/users`}>Users</NavTab>
        </div>
        <Switch>
            <Route path={`${match.path}/members`} component={SiteMemberList} props={childProps} />
            <Route path={`${match.path}/users`} component={UserList} props={childProps} />
            <Route path={`${match.path}/site`} component={EditSiteConfiguration} props={childProps} />
            <Route path={`${match.path}/profile`} component={EditAgentProfile} props={childProps} />
        </Switch>
    </div>
}

export default Authorization(PlatformManageSite, "manage", "site") 
