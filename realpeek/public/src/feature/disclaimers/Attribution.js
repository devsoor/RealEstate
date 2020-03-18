import React from "react";
import mlslogo from './NWMLS_icon.png';

export const ListingFirmAttribution = (props) => {
    let logo = <img src={mlslogo} width="22px" />;
    if (props.hideLogo) {
        logo = null;
    }
    return <div className="attribution" className={props.fontsize}>{logo} Listing provided by <span className="listing-company">{props.name || props.value}</span></div>
}