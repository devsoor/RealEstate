import React from "react";

import { Card, CardBody, CardTitle } from "reactstrap";
import '../../reports/Report.css';

const ReportSection = (props) => {
    return <div className="report-section">
        <CardTitle className="bg-info p-2 text-white mb-0"><h4>{props.title}</h4></CardTitle>
        {/* <b><b>{props.title}</b></b> */}
        <CardBody>{props.children}</CardBody>
        </div>
}

export default ReportSection;