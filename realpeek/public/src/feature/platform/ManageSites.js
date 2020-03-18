import React from 'react';
import { Route } from 'react-router-dom'
import {NavLink } from 'react-router-dom';
import 'react-router-tabs/styles/react-router-tabs.css';
import ViewSiteList from './ViewSiteList';
import CreateSite from '../admin/CreateSite';
import {Breadcrumbs, BreadcrumbsItem} from 'react-breadcrumbs-dynamic'
import PlatformManageSite from './PlatformManageSite';

const ManageSites = (props) => {
    
    let match=props.match;
    let childProps=props;

    return <div>
            <Breadcrumbs
                separator={<b> / </b>}
                item={NavLink}
                finalItem={'b'}
            />
            <BreadcrumbsItem glyph='home' to={'/sites'}>Sites</BreadcrumbsItem>
            <Route exact path={`${match.path}/`} component={ViewSiteList} props={childProps} />
            <Route path={`${match.path}/register`} component={CreateSite} props={childProps} />
            <Route path={`${match.path}/:id`} component={PlatformManageSite} props={childProps} />
            {/* <Route path={`${match.path}/:id/users`} component={UserList} props={childProps} /> */}
    </div>
}

export default ManageSites
