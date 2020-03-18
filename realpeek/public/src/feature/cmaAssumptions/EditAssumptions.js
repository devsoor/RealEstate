import React, { Component } from "react";

import { Card, Form, Input, Row, Col, FormGroup, Button, CardBody, CardHeader, CardTitle, Label, ButtonGroup
  } from 'reactstrap';

import './assumptions.css'
import LoaderButton from "../common/LoaderButton/LoaderButton";
import 'react-bootstrap-switch/dist/css/bootstrap3/react-bootstrap-switch.min.css';
import Switch from 'react-bootstrap-switch';
import { RadioGroup, RadioButton } from 'react-radio-buttons';


class EditAssumptions extends Component {
    constructor(props) {
        super(props);
        this.state = {...props.assumptions}
        this.onCriteriaRadioClick = this.onCriteriaRadioClick.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        // You don't have to do this check first, but it can help prevent an unneeded render
        if (nextProps.assumptions !== this.state.assumptions) {
          this.setState({...nextProps.assumptions});
        }
      }
    onCriteriaRadioClick(selCriteria) {
        this.setState({"success_criteria": selCriteria});  
    }
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.onAssumptionsChange(this.state);
    }
    handleCancel = (e) => {
        e.preventDefault();
        this.props.onAssumptionsCancel(this.state);
    }
    handleChange = (e) => {
        let name = e.target.id || e.target.name;
        let value = e.target.value;
        let newState = {};
        newState[name] = value;
        this.setState(newState);
    }
    handleCheckboxChange(e, state) {
        let name = e.props.name;
        let value = state;
        let newState = {};
        newState[name] = value;
        this.setState(newState);
    }

    renderFormGroup(displayName, id, helpText, type, props) {
        if (type == "choice") {
            return <FormGroup >
                {props.options.map((choice) => {
                    return <Col key={choice}>
                        <Label check>
                            <Input type="radio" check id={id} name={id} value={choice} onChange={this.handleChange} value={this.state[id]==choice}/>{' '}{choice}
                        </Label>
                    </Col>
                })}
                </FormGroup>
        }
        else if (type == "boolean") {
            return <FormGroup >
                <Input type="check" name={id} inline onChange={this.handleCheckboxChange} value={this.state[id] || ''}>{displayName}</Input>
            </FormGroup>
        }
        else if (type == "autoswitch") {
            return <Row>
                    <Col>
                    <FormGroup >
                        <h6>{displayName}</h6>
                            <Switch name={id} defaultValue={true} onChange={(el, state) => this.handleCheckboxChange(el, state)}/>
                        </FormGroup>
                    </Col>
                    <Col key={props.hiddenfield.id}>
                        {!this.state['property_tax_rate_auto'] &&
                            <FormGroup>
                                <h6>{props.hiddenfield.name}</h6>
                                <Input id={props.hiddenfield.id} type={props.hiddenfield.type} step="0.01" placeholder={props.hiddenfield.helpText} value={this.state[props.hiddenfield.id]} onChange={this.handleChange} />
                            </FormGroup>
                        }
                    </Col>
                </Row>
        }
        else {
            return <FormGroup >
                <h6>{displayName}</h6>
                <Input type={type || "text"} name={id} id={id}  placeholder={helpText} value={this.state[id]} onChange={this.handleChange} step="0.01" />
            </FormGroup>
        }
    }

    renderForm = () => {
        const formScope = this.props.type;
        return this.formDescriptor.sections.map((section, i) => {
            if (!section.scope.includes(formScope)) {
                return;
            }
            var colSize = 12 / (section.numCols || 3);
            return <div key={section.title}>
                    <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">{section.title}</CardTitle>
                    <CardBody>
                    <Row className="display-flex">
                        {section.fields.map((f) => {
                            if (f.scope && !f.scope.includes(formScope)) {
                                return;
                            }
                            return <Col md={f.colSize || colSize} key={f.id}>
                                {this.renderFormGroup(f.name, f.id, f.helpText, f.type, f)}
                            </Col>
                        })}
                    </Row>
                    </CardBody>
            </div>
        })
    }
    render() {
        let submitButtonText = this.props.submitButtonText || "Apply";
        const formScope = this.props.type;
        return <div>
                <Form onSubmit={this.handleSubmit}>
                    {
                    ["user", "global"].includes(formScope) &&
                        <CardBody>
                                <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">Success Criteria</CardTitle>
                                <CardBody>
                                <Row>
                                    <Col sm={12} md={6}>
                                        <RadioGroup name="success_criteria" value={this.state.success_criteria} onChange={(value) => this.setState({"success_criteria": value})}>
                                            <RadioButton value="cash_flow_criteria" rootColor="grey"  iconSize={20} padding={10}>
                                            Cash Flow
                                            </RadioButton>
                                            <RadioButton value="cap_rate_criteria" rootColor="grey" iconSize={20} padding={10}>
                                            Cap Rate
                                            </RadioButton>
                                            <RadioButton value="rent_to_value_criteria" rootColor="grey" iconSize={20} padding={10}>
                                            Rent-to-Value
                                            </RadioButton>
                                        </RadioGroup>
                                    </Col>
                                    <Col sm={12} md={6} style={{marginTop:'15px'}}>
                                        {
                                            this.state.success_criteria == "cash_flow_criteria"
                                            && 
                                            this.renderFormGroup("Min. Monthly Cash Flow Desired", "cash_flow_criteria", "Minimum monthly cash flow criteria", "number")
                                        }
                                        {
                                            this.state.success_criteria == "cap_rate_criteria"
                                            && 
                                            this.renderFormGroup("Min. Cap Rate Desired", "cap_rate_criteria", "Minimum cap rate criteria", "number")
                                        }
                                        {
                                            this.state.success_criteria == "rent_to_value_criteria"
                                            && 
                                            this.renderFormGroup("Min. Rent-to-Value Desired", "rent_to_value_criteria", "Minimum rent-to-value", "number")
                                        }
                                    </Col>
                                </Row>
                                </CardBody>
                        </CardBody>
                    }
                    {this.renderForm()}
                    <LoaderButton type="submit" className="btn btn-info" isLoading={this.props.isSaving} loadingText="Saving">{submitButtonText}</LoaderButton>&nbsp;
                    <Button color="secondary" onClick={this.handleCancel}>Cancel</Button>
                </Form> 
        </div>
    }

    formDescriptor = {
        sections: [
            {
                title: "Market Assumptions",
                numCols: 3,
                scope: ["user", "global"],
                fields: [
                    {
                        name: "Auto-Calculate Property Tax",
                        helpText: "Auto-Calculate Property Tax",
                        id: "property_tax_rate_auto",
                        type: "autoswitch",
                        hiddenfield: {
                            name: "Property Tax Rate (%)",
                            id: "property_tax_rate",
                            helpText: "Property Tax Rate (%)",
                            type: "number"
                        }
                    },

                    {
                        name: "Mortgage Interest Rate (%)",
                        helpText: "Mortgage Interest Rate (%)",
                        id: "mortgage_interest_rate",
                        type: "number"
                    },
                    {
                        name: "Down Payment Percent (%)",
                        helpText: "Down Payment Percent (%)",
                        id: "downpayment_percent",
                        type: "number"
                    },
                    {
                        name: "Total Improvements ($)",
                        helpText: "Total Improvements ($)",
                        id: "improvements",
                        type: "number"
                    },
                    {
                        name: "Maintenance (% of price)",
                        helpText: "Maintenance (% of price)",
                        id: "maintenance_percent",
                        type: "number"
                    },
                    {
                        name: "Vacancy Rate (%)",
                        helpText: "Vacancy Rate (%)",
                        id: "vacancy_rate",
                        type: "number"
                    },
                    {
                        name: "Closing Costs (%)",
                        helpText: "Closing Costs (%)",
                        id: "closing_costs_percent",
                        type: "number"
                    },
                    {
                        name: "Prop. Mgmt. (% of rent)",
                        helpText: "Prop. Mgmt. (% of rent)",
                        id: "property_mgmt_percent",
                        type: "number"
                    },
                    {
                        name: "Insurance Rate (% of price)",
                        helpText: "Insurance Rate (% of price)",
                        id: "insurance_rate",
                        type: "number"
                    },
                    {
                        name: "HOA (Yearly)",
                        helpText: "HOA (Yearly)",
                        id: "hoa_yr",
                        type: "currency"
                    },
                    {
                        name: "Amortization (years)",
                        helpText: "Amortization (years)",
                        id: "amortization_yrs",
                        type: "number"
                    },
                    {
                        name: "Payments (yearly)",
                        helpText: "Payments (yearly)",
                        id: "payments_yr",
                        type: "number"
                    },
                    {
                        name: "Max Distance (Sold Comps)",
                        helpText: "Radius Distance (Max)",
                        id: "comp_max_dist",
                        type: "number",
                        scope: ["site", "user", "global"]
                    },
                    {
                        name: "Max Days (Sold Comps)",
                        helpText: "Listing Days (Max)",
                        id: "comp_max_days",
                        type: "number",
                        scope: ["site", "user", "global"]
                    },
                    {
                        name: "Max # Properties (Sold Comps)",
                        helpText: "Max # Properties",
                        id: "comp_max_num_props",
                        type: "number",
                        scope: ["site", "user", "global"]
                    },
                    {
                        name: "Max Distance (Rental Comps)",
                        helpText: "Radius Distance (Max)",
                        id: "rental_max_dist",
                        type: "number",
                        scope: ["site", "user", "global"]
                    },
                    {
                        name: "Max Days (Rental Comps)",
                        helpText: "Listing Days (Max)",
                        id: "rental_max_days",
                        type: "number",
                        scope: ["site", "user", "global"]
                    },
                    {
                        name: "Max # Properties (Rental Comps)",
                        helpText: "Max # Properties",
                        id: "rental_max_num_props",
                        type: "number",
                        scope: ["site", "user", "global"]
                    },
                ]
            },
            {
                title: "Property Comparable Criteria",
                scope: ["global", "site"],
                numCols: 4,
                fields: [
                    {
                        name: "Comparable Style Match Type",
                        helpText: "Comparable Style Match Type",
                        id: "comp_style_match_type",
                        type: "choice",
                        colSize: 12,
                        scope: ["global"],
                        options: ["Strict", "Class", "Relaxed"]
                    },
                    {
                        name: "Radius Distance (Max)",
                        helpText: "Radius Distance (Max)",
                        id: "comp_max_dist",
                        type: "number",
                        scope: ["site", "global"]
                    },
                    {
                        name: "Listing Days (Max)",
                        helpText: "Listing Days (Max)",
                        id: "comp_max_days",
                        type: "number",
                        scope: ["site",, "global"]
                    },
                    {
                        name: "Min # Properties",
                        helpText: "Min # Properties",
                        id: "comp_min_num_props",
                        type: "number",
                        scope: ["global","site"]
                    },
                    {
                        name: "Max # Properties",
                        helpText: "Max # Properties",
                        id: "comp_max_num_props",
                        type: "number",
                        scope: ["site", "global"]
                    },
                    {
                        name: "Year Built Difference (+/-)",
                        helpText: "Year Built Difference (+/-)",
                        id: "comp_max_age_diff",
                        type: "number",
                        scope: ["site"]
                    },
                    {
                        name: "Property Sqft Difference (+/-)",
                        helpText: "Property Sqft Difference (+/-)",
                        id: "comp_max_sqft_diff",
                        type: "number",
                        scope: ["site"]
                    },
                    {
                        name: "Bed Difference (+/-)",
                        helpText: "Bed Difference (+/-)",
                        id: "comp_max_bed_diff",
                        type: "number",
                        scope: ["site"]
                    },
                    {
                        name: "Baths Difference (+/-)",
                        helpText: "Baths Difference (+/-)",
                        id: "comp_max_bath_diff",
                        type: "number",
                        scope: ["site"]
                    }

                ]
            },
            {
                title: "Property Scoring Weights",
                numCols: 4,
                scope: ["global"],
                fields: [
                    {
                        name: "Distance Weight",
                        helpText: "Baths Difference (+/-)",
                        id: "comp_dist_score_weight",
                        type: "number"
                    },
                    {
                        name: "Year Built Weight",
                        helpText: "Baths Difference (+/-)",
                        id: "comp_age_score_weight",
                        type: "number"
                    },
                    {
                        name: "Days Weight",
                        helpText: "Days Weight",
                        id: "comp_days_score_weight",
                        type: "number"
                    },
                    {
                        name: "Property Sqft Weight",
                        helpText: "Property Sqft Weight",
                        id: "comp_sqft_score_weight",
                        type: "number"
                    },
                    {
                        name: "# Beds Weight",
                        helpText: "# Beds Weight",
                        id: "comp_bed_score_weight",
                        type: "number"
                    },
                    {
                        name: "# Baths Weight",
                        helpText: "# Baths Weight",
                        id: "comp_bath_score_weight",
                        type: "number"
                    },
                    {
                        name: "Style Weight",
                        helpText: "Style Weight",
                        id: "comp_style_score_weight",
                        type: "number"
                    }

                ]
            },
            {
                title: "Rental Search Criteria",
                numCols: 4,
                scope: ["global", "site"],
                fields: [
                    {
                        name: "Rental Style Match Type",
                        helpText: "Rental Style Match Type",
                        id: "rental_style_match_type",
                        type: "choice",
                        options: ["Strict", "Class", "Relaxed"],
                        scope: ["global"]
                    },
                    {
                        name: "Radius Distance (Max)",
                        helpText: "Radius Distance (Max)",
                        id: "rental_max_dist",
                        type: "number",
                        scope: ["site", "global"]
                    },
                    {
                        name: "Listing Days (Max)",
                        helpText: "Listing Days (Max)",
                        id: "rental_max_days",
                        type: "number",
                        scope: ["site", "global"]
                    },
                    {
                        name: "Min # Properties",
                        helpText: "Min # Properties",
                        id: "rental_min_num_props",
                        type: "number",
                        scope: ["global", "site"]
                    },
                    {
                        name: "Max # Properties",
                        helpText: "Max # Properties",
                        id: "rental_max_num_props",
                        type: "number",
                        scope: ["global", "site"]
                    },
                    {
                        name: "Year Built Difference (+/-)",
                        helpText: "Year Built Difference (+/-)",
                        id: "rental_max_age_diff",
                        type: "number",
                        scope: ["site"]
                    },
                    {
                        name: "Property Sqft Difference (+/-)",
                        helpText: "Property Sqft Difference (+/-)",
                        id: "rental_max_sqft_diff",
                        type: "number",
                        scope: ["site"]
                    },
                    {
                        name: "Bed Difference (+/-)",
                        helpText: "Bed Difference (+/-)",
                        id: "rental_max_bed_diff",
                        type: "number",
                        scope: ["site"]
                    },
                    {
                        name: "Baths Difference (+/-)",
                        helpText: "Baths Difference (+/-)",
                        id: "rental_max_bath_diff",
                        type: "number",
                        scope: ["site"]
                    }

                ]
            },
            {
                title: "Rental Scoring Weights",
                numCols: 4,
                scope: ["global"],
                fields: [
                    {
                        name: "Distance Weight",
                        helpText: "Distance Weight",
                        id: "rental_dist_score_weight",
                        type: "number"
                    },
                    {
                        name: "Year Built Weight",
                        helpText: "Year Built Weight",
                        id: "rental_age_score_weight",
                        type: "number"
                    },
                    {
                        name: "Days Weight",
                        helpText: "Days Weight",
                        id: "rental_days_score_weight",
                        type: "number"
                    },
                    {
                        name: "Property Sqft Weight",
                        helpText: "Property Sqft Weight",
                        id: "rental_sqft_score_weight",
                        type: "number"
                    },
                    {
                        name: "# Beds Weight",
                        helpText: "# Beds Weight",
                        id: "rental_bed_score_weight",
                        type: "number"
                    },
                    {
                        name: "# Baths Weight",
                        helpText: "# Baths Weight",
                        id: "rental_bath_score_weight",
                        type: "number"
                    },
                    {
                        name: "Style Weight",
                        helpText: "Style Weight",
                        id: "rental_style_score_weight",
                        type: "number"
                    },
                    {
                        name: "Rent Adjustment (Multi-Family)",
                        helpText: "Rent Adjustment (Multi-Family)",
                        id: "rental_adjustment_mult",
                        type: "number"
                    }

                ]
            }
        ]
    }
} 

export default EditAssumptions