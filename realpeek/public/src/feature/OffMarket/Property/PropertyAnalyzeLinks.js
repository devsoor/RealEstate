import React from "react";
import {Link} from "react-router-dom";
import queryString from "qs";
import { LinkContainer } from "react-router-bootstrap";

export const PropertyAnalyzeyDetailLink = (props) => {
    const property = props.property;
    const propertyID = props.property.listing_id;
    const assumptions = props.assumptions;
    const propertyLink = {
        pathname: '/propertyAnalyze/' + propertyID,
        search: queryString.stringify({property:property,assumptions:assumptions})
    }


     return <LinkContainer to={propertyLink} target="_blank">
         {props.children}
        </LinkContainer>
}
export const PropertyAnalyzeReportLink = (props) => {
    const property = props.property;
    const assumptions = props.assumptions;
    const propertyLink = {
        pathname: '/property/' + "report",
        search: queryString.stringify(assumptions)
    }
    return <LinkContainer to={propertyLink} target="_blank">
        {props.children}
    </LinkContainer>
}


