import React from "react";
import { Route, Redirect } from "react-router-dom";
import { MasterPage } from '../common/MasterPage';

export default ({ component: Component, props: cProps, ...rest }) =>
    <Route
    {...rest}
    render={props =><Component {...props} {...cProps} />}
    />;
//   <Route
//     {...rest}
//     render={props =>
//       !cProps.isAuthenticated
//         ? <Component {...props} {...cProps} />
//         : <Redirect to="/" />}
//   />;