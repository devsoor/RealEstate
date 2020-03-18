import React from 'react';
import {Row, Col, Card, CardBody, CardTitle} from 'reactstrap';
import { FormattedValue } from "../common/Format";
import "./assumptions.css";

const cols = [
    {name: 'Purchase Price', field: 'purchase_price', type:'currency'},
    {name: 'Interest', field: 'mortgage_interest_rate', type: 'percent', format: 'percent', decimals: 3},
    {name: 'Property Tax Rate', field: 'property_tax_rate', type: 'percent', format: 'percent', decimals: 3},
    {name: 'Vacancy Rate', field: 'vacancy_rate', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Closing Costs', field: 'closing_costs_percent', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Maintenance', field: 'maintenance_percent', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Downpayment', field: 'downpayment_percent', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Insurance', field: 'insurance_rate', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Property Mgmt', field: 'property_mgmt_percent', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Amortization', field: 'amortization_yrs'},
    {name: 'Payments/year', field: 'payments_yr'},
]
const critieriaNames = {
    cash_flow_criteria:"Cash Flow",
    cap_rate_criteria: "Cap Rate",
    rent_to_value_criteria: "Rent To Value"
}
const AssumptionsData = (props) => {
    if (!props.assumptions) {
        return null;
    }
    return <div>
        <CardTitle className="bg-gradient-success border-bottom p-3 mb-1 text-white">
                Assumptions</CardTitle>
        <CardBody>
            <Row>
                {cols.map((col, i)=> {
                    if (col.field in props.assumptions) {
                        return <Row key={i}>
                            <Col md={12} className="mb-0 op-5">{col.name}:</Col>
                            <Col md={12} className="text-dark op-7" ><FormattedValue {...col} value={props.assumptions[col.field]} /></Col>
                        </Row>
                    }
                }
                )}
            </Row>
        </CardBody>

    </div>
}

export default AssumptionsData