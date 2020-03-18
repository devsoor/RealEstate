import React from 'react';
import { Route, Switch, NavLink } from 'react-router-dom'
import EditSavedSearch from './EditSavedSearch'
import SavedSearchListContainer from './SavedSearchListContainer';
import {Breadcrumbs, BreadcrumbsItem} from "react-breadcrumbs-dynamic";

const SavedSearches = ({match}) => (
    <div>
        <Breadcrumbs
                separator={<b> / </b>}
                item={NavLink}
                finalItem={'b'}
            />
        <BreadcrumbsItem glyph='home' to={`${match.path}/saved-searches`}>Searches</BreadcrumbsItem>

        <Switch>
            <Route exact path={`${match.path}/saved-searches`} component={SavedSearchListContainer}/>
            <Route path={`${match.path}/saved-searches/:id/edit`} component={EditSavedSearch}/>
        </Switch>
    </div>
)

export default SavedSearches