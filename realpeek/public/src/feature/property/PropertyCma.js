import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Row, Col, Card, CardTitle, CardSubtitle, CardBody, Form, FormGroup, Input, InputGroup, InputGroupAddon, Button, Alert, UncontrolledTooltip } from 'reactstrap';

import './property.css';
import { Currency, PercentDecimal, Percent } from '../common/Format';
import CmaFormControl from './CmaFormControl';
import { CmaCriteria } from './CmaCriteria';

class PropertyCma extends Component {
    constructor(props) {
        super(props);
        this.state = {
            assumptions: this.props.assumptions
        }
    }

    handleChange = (e) => {
        this.setState(prevState => {
            const newAssumptions = Object.assign({}, prevState.assumptions);
            newAssumptions[e.id] = e.value;
            if (e.id === "property_tax_rate") {
                if (e.value) {
                    newAssumptions["property_tax_rate_auto"] = false;
                }
                else {
                    newAssumptions["property_tax_rate_auto"] = true;
                }
            }
            return { assumptions: newAssumptions}
        })
    }

    handleAssumptionsChanged = () => {
        //const assumptions = {...this.state};
        this.props.onAssumptionsChanged(this.state.assumptions);
    }

    renderSuccessCriteria(name, type, value, result) {
        // if (name.toLowerCase() === "cash flow") {
        //     value = (Number(value) ).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits : 2, minimumFractionDigits : 2 });
        // }
        const formattedValue = ReactDOMServer.renderToString(<CmaCriteria type={type} value={value} />)
        let valid = null;
        if (result) {
            valid = result.toLowerCase() == "failure" ? "error" : "success";
        }
        return <FormGroup validationstate={valid}>
            <Col sm={4}>
                {name}
            </Col>
            <Col sm={8}>
                <InputGroup>
                    <Input type="text" placeholder="#" value={formattedValue} readOnly />
                    <InputGroupAddon addonType="prepend">{result}</InputGroupAddon>
                </InputGroup>
            </Col>
        </FormGroup>
    }

    renderSuccessMetric(id, name, type, value, result, tip) {
        const formattedValue = ReactDOMServer.renderToString(<CmaCriteria type={type} value={value} />)
        let valid = null;
        let style = "bg-secondary";
        if (result) {
            valid = result.toLowerCase() == "failure" ? "error" : "success";
            style = valid == "success" ? "bg-success": "bg-danger";
        }
        return <Card body id={id} className={style}>
                <div className="d-flex align-self-center">
                    <div>
                        <h3 className="text-white">{name}</h3>
                        {/* <CardSubtitle className="text-white op-6 text-center">
                            {subtitle}
                        </CardSubtitle> */}
                    </div>
                </div>
                <Row className="mt-2">
                    <Col xs="12" className="text-center">
                    <h2 className="font-light text-white">{formattedValue}</h2>
                    </Col>
                </Row>
                <UncontrolledTooltip placement="top" target={id}>
                    {tip}
                </UncontrolledTooltip>
        </Card>
    }

    renderMetric(id, name, subtitle, type, value, tip) {
        var formattedValue = value;

        if (type === "currency") {
            formattedValue = <Currency value={value} />
        }
        if (type === "percent") {
            formattedValue = <Percent value={value} />
        }
        // const formattedValue = ReactDOMServer.renderToString(<CmaCriteria type={type} value={value} />)

        return <Card body id={id} className="bg-gradient-primary">
                <div className=" align-self-center">
                    <div>
                        <h3 className="text-white">{name}</h3>
                        {/* <CardSubtitle className="text-white op-6 text-center">
                            {subtitle}
                        </CardSubtitle> */}
                    </div>
                </div>
                <Row className="mt-2">
                    <Col xs="12" className="text-center">
                    <h2 className="font-light text-white">{formattedValue}</h2>
                    </Col>
                </Row>
                <UncontrolledTooltip placement="top" target={id}>
                    {tip}
                </UncontrolledTooltip>
        </Card>
    }

    renderRent(cma_results) {
        if (cma_results.Result_EstMonthlyRent_Units) {
            return <div>
                <CmaFormControl name='Est. Rent Total' id='Result_EstMonthlyRent' value={cma_results.Result_EstMonthlyRent} readOnly={true} type="currency" period="monthly" />
                {
                    cma_results.Result_EstMonthlyRent_Units.map((unit) => {
                        const id = 'Result_EstMonthlyRent_' + unit.UnitNum;
                        const rowName = `Est. Rent Unit ${unit.UnitNum} (${unit.bed}br/${unit.bath}ba)`;
                        return <CmaFormControl name={rowName} key={id} id={id} value={unit.EstMonthlyRent} readOnly={true} type="currency" period="monthly" />
                    })
                }
            </div>
        }
        else {
            return <CmaFormControl name='Est. Rent' id='Result_EstMonthlyRent' value={cma_results.EstMonthlyRent} readOnly={true} type="currency" period="monthly" />
        }
    }

    renderRentInput(cma_results) {
        let assumptions = Object.assign({}, this.state.assumptions);
        if (this.props.cma) {
            if (assumptions['monthly_rent'] == 0) {
                assumptions['monthly_rent'] = this.props.cma.params.monthly_rent
            }
        }

        if (cma_results.Result_EstMonthlyRent_Units) {
            return <div>
                <FormGroup>
                    <Row>
                        <Col sm={4}></Col>
                        <Col sm={4}>Current</Col>
                        <Col sm={4}>Estimated</Col>
                    </Row>
                </FormGroup>
                {
                    cma_results.Result_EstMonthlyRent_Units.map((unit) => {
                        const id = 'monthly_rent_unit' + unit.UnitNum;
                        //const rowName = `Est. Rent Unit ${unit.UnitNum} (${unit.bed}br/${unit.bath}ba)`;
                        let rowName = `Est. Rent Unit ${unit.UnitNum} (${unit.bed}br/${unit.bath}ba)`;
                        if (!unit.bed && !unit.bath) {
                            rowName = `Est. Rent ${unit.UnitNum} (WARNING: No unit information found)`;
                        }

                        const currentRent = unit.CurrentRent;
                        return <CmaFormControl name={rowName} id={id} key={id} value={assumptions[id]} current={currentRent} type="currency" decimals={0} period="monthly" onChange={this.handleChange} />
                    })
                }
            </div>
        }
        else {
            return <CmaFormControl name='Est. Monthly Rent' id='monthly_rent' value={assumptions.monthly_rent} type="currency" decimals={0} period="monthly" onChange={this.handleChange} />
        }
    }
    render() {
        var property = this.props.property;

        var cma = this.props.cma;

        var cma_results = cma.cma_results;
        var cma_calc = cma.cma_calc;
        var has_current_values = cma.current_cma != undefined;
        var cma_current = cma.current_cma || {};

        let assumptions = Object.assign({}, this.state.assumptions);
        if (cma) {
            if (!assumptions['purchase_price']) {
                assumptions['purchase_price'] = cma.params.purchase_price
            }
        }
        return <div className="single-property" id="cma_results">
         {/*   <div className="pull-right">
                <PropertyReportLink propertyId={property.unique_id} assumptions={this.props.assumptions}>
                <Button>Print Investment Report</Button>
                </PropertyReportLink>
            </div> */}
            {
                cma_results.error &&
                <Alert color="danger">
                    {cma_results.error}
                </Alert>
            }
            <Row>
                <Col sm={12} md={4}>
                 {this.renderSuccessMetric(
                    "successmetric-id",
                    cma_results.criteria_name,
                    cma_results.success_criteria,
                    cma_results.criteria_value,
                    cma_results.criteria_result,
                    "Net Operating Income (NOI) - Mortgage payments",
                    )}
                </Col>
                <Col sm={12} md={4}>
                {this.renderMetric(
                    "rentvalue-id",
                    "Rent",
                    "(Estimated)",
                    "currency",
                    cma_results.Result_EstMonthlyRent,
                    "Estimated Rent"
                    )}
                </Col>
                <Col sm={12} md={4}>
                {this.renderMetric(
                    "marketvalue-id",
                    "Market Value",
                    "(Estimated)",
                    "currency",
                    cma_results.Result_EstMarketValue,
                    "Estimate market value based on comparables"
                    )}
                </Col>
            </Row>

            
            <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">Performance Metrics</CardTitle>

                <CardBody>
                    <Form>
                        {/* {this.renderSuccessCriteria(cma_results.criteria_name, cma_results.success_criteria, cma_results.criteria_value, cma_results.criteria_result)} */}
                        {
                            has_current_values &&
                            <FormGroup>
                                <Row>
                                    <Col sm={4}></Col>
                                    <Col sm={4}>Current</Col>
                                    <Col sm={4}>Estimated</Col>
                                </Row>
                            </FormGroup>
                        }
                        <UncontrolledTooltip placement="top" target="Result_CashFlow_Monthly">
                            Net Operating Income - Mortgage payments
                        </UncontrolledTooltip>
                        <UncontrolledTooltip placement="top" target="Result_CapRate">
                            Net Operating Income / Property Value
                        </UncontrolledTooltip>
                        <UncontrolledTooltip placement="top" target="Result_RentValueRatio">
                            Monthly Rent / Property Purchase Price
                        </UncontrolledTooltip>
                        <UncontrolledTooltip placement="top" target="Result_CashIn">
                            Downpayment + Improvements + Closing Costs
                        </UncontrolledTooltip>
                        <UncontrolledTooltip placement="top" target="Result_CashOnCashReturn">
                            Annual Cash Flow / Cash In
                        </UncontrolledTooltip>
                        <CmaFormControl name='Cash Flow' id='Result_CashFlow_Monthly' value={cma_results.Result_CashFlow_Monthly} current={cma_current.Result_Current_CashFlow_Monthly} readOnly={true} type="currency" period="monthly" decimals={2} />
                        <CmaFormControl name='Cap Rate' id='Result_CapRate' value={cma_results.Result_CapRate} current={cma_current.Result_Current_CapRate} readOnly={true} type="percent" />
                        <CmaFormControl name='Rent2Value Ratio' id='Result_RentValueRatio' value={cma_results.Result_RentValueRatio} current={cma_current.Result_Current_RentValueRatio}  readOnly={true} type="percent" />
                        <CmaFormControl name='Cash-In' id='Result_CashIn' value={cma_results.Result_CashIn} readOnly={true} type="currency" />
                        <CmaFormControl name='Cash-On-Cash Return' id='Result_CashOnCashReturn' value={cma_results.Result_CashOnCashReturn} readOnly={true} type="percent" decimals={2} />
                    </Form>
                </CardBody>

                <Card className="">
                  <CardTitle className="bg-success border-bottom p-3 mb-0 text-white">Edit Scenarios</CardTitle>

                    <CardBody>
                    <Form>
                        <CmaFormControl name='Closing Costs' id='closing_costs_percent' value={assumptions.closing_costs_percent} type="percent" decimals={1} onChange={this.handleChange} />
                        <CmaFormControl name='Down Payment' id='downpayment_percent' value={assumptions.downpayment_percent} type="percent" decimals={1} onChange={this.handleChange} />
                        <CmaFormControl name='Mortgage Interest Rate' id='mortgage_interest_rate' value={assumptions.mortgage_interest_rate} type="percent" decimals={3} onChange={this.handleChange} />
                        <CmaFormControl name='Maintenance' id='maintenance_percent' value={assumptions.maintenance_percent} type="percent" decimals={0} onChange={this.handleChange} />
                        <CmaFormControl name='Improvements' id='improvements' value={assumptions.improvements} type="currency" decimals={0} onChange={this.handleChange} />
                        <CmaFormControl name='Property Tax Rate' id='property_tax_rate' value={assumptions.property_tax_rate} type="percent" decimals={3} onChange={this.handleChange} />
                        <CmaFormControl name='Vacancy Rate' id='vacancy_rate' value={assumptions.vacancy_rate} type="percent" decimals={1} onChange={this.handleChange} />
                        <CmaFormControl name='Prop. Management' id='property_mgmt_percent' value={assumptions.property_mgmt_percent} type="percent" decimals={1} onChange={this.handleChange} />
                        <CmaFormControl name='Insurance Rate' id='insurance_rate' value={assumptions.insurance_rate} type="percent" decimals={1} onChange={this.handleChange} />
                        <CmaFormControl name='Purchase Price' id='purchase_price' value={assumptions.purchase_price} type="currency" onChange={this.handleChange} />

                        {/* <CmaFormControl name='HOA Annually' id='hoa_yr' value={this.state.hoa_yr} type="currency" onChange={this.handleChange} /> */}
                        {/* <CmaFormControl name='Est. Monthly Rent' id='monthly_rent' value={this.state.monthly_rent} type="currency" decimals={0} period="monthly" onChange={this.handleChange} /> */}
                        {
                            this.renderRentInput(cma_results)
                        }

                        <div className="text-center">
                            <Button color="primary" onClick={this.handleAssumptionsChanged}>Apply Changes</Button>
                        </div>

                    </Form>
                    </CardBody>
              </Card>
        </div>
    }        

  }
  
  export default PropertyCma;