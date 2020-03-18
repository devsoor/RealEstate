import React from 'react';
import { Route, Switch } from 'react-router-dom'
import ReportListContainer from './ReportListContainer'
import ReportContainer from './ReportContainer'
import ReportPrintable from './ReportPrintable'

const ReportRoutes = ({match}) => (
    <Switch>
        <Route exact path={`${match.path}/reports`} component={ReportListContainer}/>
        <Route path={`${match.path}/reports/:id/p`} component={ReportPrintable}/>
        <Route path={`${match.path}/reports/:id`} component={ReportContainer}/>
    </Switch>
)

export default ReportRoutes