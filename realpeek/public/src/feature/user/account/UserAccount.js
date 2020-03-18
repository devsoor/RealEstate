import React from "react"
import { Switch } from 'react-router-dom';
import { NavTab } from 'react-router-tabs';
import 'react-router-tabs/styles/react-router-tabs.css';

import AuthenticatedRoute from "../../routes/AuthenticatedRoute";
import ReportRoutes from "../../reports/ReportRoutes";
import UserProfileContainer from "../profile/UserProfileContainer";
import AssumptionsContainer from '../../cmaAssumptions/AssumptionsContainer';
import SavedSearches from "../../saved-searches/SavedSearches";

const UserAccount = (props) => {
    let match=props.match;
    let childProps=props;
    return <div>
        <Switch>
            <AuthenticatedRoute path={`${match.path}/profile`} component={UserProfileContainer} props={childProps} />
            <AuthenticatedRoute path={`${match.path}/reports`} component={ReportRoutes} props={childProps}/>
            <AuthenticatedRoute path={`${match.path}/saved-searches`} component={SavedSearches} props={childProps}/>
            <AuthenticatedRoute path={`${match.path}/assumptions`} component={AssumptionsContainer} props={childProps} />
        </Switch>
    </div>
}

export default UserAccount;
