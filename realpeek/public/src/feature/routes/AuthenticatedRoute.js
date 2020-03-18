import React from "react";
import { Route, Redirect } from "react-router-dom";

export default ({ component: Component, props: cProps, ...rest }) =>
  <Route
    {...rest}
    render={props =>
      cProps.isAuthenticated
        ? <Component {...props} {...cProps} />
        : <Redirect
            to={{
              pathname: '/login',
              search:`?redirect=${props.location.pathname}${props.location.search}`
            }}
          />}
  />;