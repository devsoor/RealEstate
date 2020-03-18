import React, { Component } from 'react';
import { Row, Col, Button, Card, CardBody, CardTitle} from 'reactstrap';

import { CmaCriteria } from '../../property/CmaCriteria';
import { Currency } from '../../common/Format';

import '../../property/property.css';

const normalizeBetweenTwoRanges = (val, minVal, maxVal, newMin, newMax) => {
  return newMin + (val - minVal) * (newMax - newMin) / (maxVal - minVal);
};
class PropertyAnalyzeSummaryCma extends Component {
    render() {
        let property = this.props.property;
        // let assumptions = this.props.assumptions;
        const criterion = [
          {"name": "CashFlow", "field": "Result_CashFlow_Monthly", "type": "cash_flow_criteria" }, 
          {"name": "Cap Rate", "field": "Result_CapRate", "type":"cap_rate_criteria"},
          {"name": "Rent2Value", "field": "Result_RentValueRatio", "type":"rent_to_value_criteria"}
        ];
        
        const cma = this.props.property.cma;
        if (cma) {
            const cma_results = cma.cma.cma_results;
    
            let style="default";
            let icon="ti-help";
            let max_rent_diff = null;
            if (cma_results && cma_results.criteria_result) {
              // style = cma_results.criteria_result.toLowerCase() == "success" ? "bg-success": "bg-danger";
              // const a = normalizeBetweenTwoRanges(cma_results.criteria_value, -Math.abs(this.props.limitValue), this.props.limitValue, 0, 120);
              const val = cma_results.criteria_value;
              const a = val > 0 ? normalizeBetweenTwoRanges(val, 0, this.props.maxValue, 60, 120) : val == 0 ? 0 : normalizeBetweenTwoRanges(val, this.props.minValue, 0, 0, 60);
              style = `hsl(${a},100%,30%,1)`;
              icon = cma_results.criteria_result.toLowerCase() == "success" ? "ti-thumb-up": "ti-thumb-down";
            }
            if (cma_results && cma_results.Result_MaxRentDiff) {
              max_rent_diff = cma_results.Result_MaxRentDiff;
            }
            return <div className="cma">
            <div className={"cma_criteria cma_criteria_" + style}>
                <Button style={{backgroundColor:`${style}`}}>
                  <span className="name">{cma_results.criteria_name}</span>
                  <span className="value"><CmaCriteria value={cma_results.criteria_value} type={cma_results.success_criteria} />
                  </span>
                </Button>
            </div>
          <div>
            {criterion.map((c)=> {
              if (c.type != cma_results.success_criteria) {
                return <Row key={c.name}>
                  <Col sm={6}>{c.name}</Col>
                  <Col sm={6}>
                    <CmaCriteria value={cma_results[c.field]} type={c.type} />
                  </Col>
                </Row>
              }
            })}
            <Row>
                  <Col sm={6}>Rent</Col>
                  <Col sm={6}>
                    <Currency value={cma_results['Result_EstMonthlyRent']}/>
                  </Col>
            </Row>
          </div>
        </div>
        }
        return null
    }
}

export default PropertyAnalyzeSummaryCma;