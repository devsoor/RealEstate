import React from "react";
import {Link} from "react-router-dom";
import queryString from "qs";
import AuthenticatedRoute from "../routes/AuthenticatedRoute";
import { MasterPage, withMaster } from '../common/MasterPage';
import {PropertyContainer, SinglePropertyReportContainer} from './PropertyDetail';
import ThemeRoutes from '../common/themeroutes.jsx.js';
import { LinkContainer } from "react-router-bootstrap";



export const PropertyDetailLink = (props) => {
    const propertyId = props.propertyId;
    const assumptions = props.assumptions;
    const propertyLink = {
        pathname: '/property/' + propertyId,
        search: queryString.stringify(assumptions)
    }

     return <LinkContainer to={propertyLink} target="_blank">
         {props.children}
        </LinkContainer>
}
export const PropertyReportLink = (props) => {
    const propertyId = props.propertyId;
    const assumptions = props.assumptions;
    const propertyLink = {
        pathname: '/property/' + "report",
        search: queryString.stringify(assumptions)
    }
    return <LinkContainer to={propertyLink} target="_blank">
        {props.children}
    </LinkContainer>
}


