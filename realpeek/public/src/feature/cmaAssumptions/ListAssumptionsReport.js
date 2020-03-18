import React from 'react';
import {Row, Col, Card, CardBody} from 'reactstrap';
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
    {name: 'Success Criteria', field: 'success_criteria'}
]
const critieriaNames = {
    cash_flow_criteria:"Cash Flow",
    cap_rate_criteria: "Cap Rate",
    rent_to_value_criteria: "Rent To Value"
}
const ListAssumptionsReport = (props) => {
    if (!props.assumptions) {
        return null;
    }
    return <CardBody>
        <Row>
        {cols.map((col, i)=> {
            if (col.field in props.assumptions) {
                var value = props.assumptions[col.field];
                if (col.field == "success_criteria") {
                    value = critieriaNames[value];
                }
                return <Col xs={6} md={2} key={i}>
                    <Row className="mb-0 font-bold op-5">{col.name}:</Row>
                    <Row className="text-dark op-6" ><FormattedValue {...col} value={value} /></Row>&nbsp;
                </Col>
            }
        }
        )}
        </Row>
    </CardBody>
}

export default ListAssumptionsReport