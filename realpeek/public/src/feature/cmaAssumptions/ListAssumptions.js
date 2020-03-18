import React from 'react';
import {Row, Col} from 'reactstrap';
import { FormattedValue } from "../common/Format";
import "./assumptions.css";

const cols = [
    {name: 'Purchase Price', field: 'purchase_price', type:'currency'},
    {name: 'Mortgage Interest', field: 'mortgage_interest_rate', type: 'percent', format: 'percent', decimals: 3},
    {name: 'Property Tax Rate', field: 'property_tax_rate', type: 'percent', format: 'percent', decimals: 3},
    {name: 'Vacancy Rate', field: 'vacancy_rate', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Closing Costs', field: 'closing_costs_percent', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Maintenance on Purchase Price', field: 'maintenance_percent', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Property Management', field: 'property_mgmt_percent', type: 'percent', format: 'percent', decimals: 1},
    {name: 'Amortization', field: 'amortization_yrs'},
    {name: 'Payments/year', field: 'payments_yr'},
    {name: 'Success Criteria', field: 'success_criteria'}
]

const critieriaNames = {
    cash_flow_criteria:"Cash Flow",
    cap_rate_criteria: "Cap Rate",
    rent_to_value_criteria: "Rent To Value"
}

const ListAssumptions = (props) => {
    if (!props.assumptions) {
        return null;
    }
    
    return <Row className="list-assumptions">
        {cols.map((col, i)=> {
            if (col.field in props.assumptions) {
                var value = props.assumptions[col.field];
                if (col.field == "success_criteria") {
                    value = critieriaNames[value];
                }
                return <Col sm={6} xs={12} key={i}>
                    <span className="data-label">{col.name}:</span> <span className="data-value"><FormattedValue {...col} value={value} /></span>
                </Col>
            }
        }
        )}
    </Row>
}

export default ListAssumptions