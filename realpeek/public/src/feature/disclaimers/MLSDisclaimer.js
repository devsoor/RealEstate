
import React from "react"
import {Card, CardBody, CardTitle } from 'reactstrap';

import logo from './nwmls-300x144.jpg' // relative path to image 
import { withSettings } from "../../api/SettingsProvider";

const AgentDisclaimerComponent = (props) => {
    let firm_name = props.settings ? props.settings.office_name : '';
    let text = `Disclaimer: The information contained in this listing has not been verified by ${firm_name} and should be verified by the buyer.`
    return text;
}
export const AgentDisclaimer = withSettings(AgentDisclaimerComponent);

const MlsDislcaimerComponent = (props) => {
    let text = props.text || "Listing information is provided by the Northwest Multiple Listing Service (NWMLS). Property information is based on available data that may include MLS information, county records, and other sources. Listings marked with this symbol: provided by Northwest Multiple Listing Service, 2018. All information provided is deemed reliable but is not guaranteed and should be independently verified. All properties are subject to prior sale or withdrawal.";
    let copyright = props.copyright || "© "+`${new Date().getFullYear()}` + " NWMLS. All rights are reserved. ";
    return <CardBody>
        <CardTitle>
            MLS DISCLAIMER
        </CardTitle>
            <img src={logo} responsive="true" width={150} className="pull-left" style={{paddingRight: 20}} />
            <p>{text}</p>
            <p>{copyright}</p>
    </CardBody>
};

export const MlsDislcaimer = withSettings(MlsDislcaimerComponent);

const RealPeekSiteDisclaimerComponent = (props) => {
    const firm_name = props.settings ? props.settings.office_name : '';
    const text = `The material provided on this website is for informational purposes only and should not be considered legal 
    or financial advice. You should consult with your attorney, tax or financial advisor and perform your own research and due 
    diligence before making investment decisions. ${firm_name} does not make any guarantee or promise as to any results that may 
    be obtained from using our content. To the maximum extent permitted by law, ${firm_name} disclaims any and all liability in 
    the event any information, commentary, analysis, opinions, advice and/or recommendations prove to be inaccurate, incomplete or unreliable, 
    or result in any investment or other losses.`;

    return <Card>
        <strong>Disclaimer: </strong>{text}
    </Card>
}
export const RealPeekSiteDisclaimer = withSettings(RealPeekSiteDisclaimerComponent);

const RealPeekReportDisclaimerComponent = (props) => {
    const firm_name = props.settings ? props.settings.office_name : '';
    const text = `The material provided in this document is for informational purposes only and should not be considered legal 
    or financial advice. You should consult with your attorney, tax or financial advisor and perform your own research and due 
    diligence before making investment decisions. ${firm_name} does not make any guarantee or promise as to any results that may 
    be obtained from using our content. To the maximum extent permitted by law, ${firm_name} disclaims any and all liability in 
    the event any information, commentary, analysis, opinions, advice and/or recommendations prove to be inaccurate, incomplete or unreliable, 
    or result in any investment or other losses.`;

    return <Card>
        <CardBody><strong>Disclaimer: </strong>{text}</CardBody>
    </Card>
}
export const RealPeekReportDisclaimer = withSettings(RealPeekReportDisclaimerComponent);