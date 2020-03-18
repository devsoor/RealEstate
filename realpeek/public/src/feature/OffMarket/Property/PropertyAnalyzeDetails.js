import React, { Component } from 'react';
import {
    UncontrolledCarousel,
    Card,
    CardBody,
    CardTitle,
    Row,
    Col,
    Form,
    FormGroup,
    UncontrolledTooltip
} from 'reactstrap';
import { Currency } from '../../common/Format';
import '../../property/property.css';
import { withSettings} from "../../../api/SettingsProvider";
import CmaFormControl from '../../property/CmaFormControl';
import PropertyAnalyzeCma from './PropertyAnalyzeCma';

var urljoin = require('url-join');

function getNested (object, path, separator) {
    try {
        separator = separator || '.';
    
        return path
                .replace('[', separator).replace(']','')
                .split(separator)
                .reduce(
                    function (obj, property) { 
                        return obj[property];
                    }, object
                );
                    
    } catch (err) {
        return undefined;
    }   
}

const DetailsSection = (props) => {
    // let className = props.name.toLowerCase()
    return <Card className={"nwmls details-section"}>
        <CardTitle className="bg-info border-bottom p-1 mb-1 text-white">
                {props.name}</CardTitle>
        <CardBody>
            <ul style={{columnCount:2, padding:0}} className="detail-list" >
                {props.fields.map((field)=>{
                    const value = getNested(props.property, field.field);
                    if (value) {
                        return <li style={{ listStyleType: "none" }} key={field.name} className="detail-item">
                            <span style={{fontWeight:600}} className="item-name">{field.name}: </span> &nbsp;
                            <span className="item-value">{value}</span>
                        </li>
                    }
                })}
            </ul>
        </CardBody>
    </Card>
}

const styles = {
    fontFamily: "sans-serif",
    textAlign: "center"
  };
  const colstyle = {
    width: "30%"
  };
  const tableStyle = {
    width: "100%"
  };
  
class PropertyAnalyzeDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
          features: false,
          'cSelected': [],
          activeTab: '1'
        } 

        this.onCheckboxBtnClick = this.onCheckboxBtnClick.bind(this);
        this.toggle = this.toggle.bind(this);
      }
    toggle(tab) {
            if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab
            });
        }
    }

    onCheckboxBtnClick(selected) {
        const index = this.state.cSelected.indexOf(selected);
        if (index < 0) {
          this.state.cSelected.push(selected);
        } else {
          this.state.cSelected.splice(index, 1);
        }
        this.setState({ 'cSelected': [...this.state.cSelected] });
    }
    renderMultiPropertyFeatures = (property) => {
        var bedunit = 0;
        var bathunit = 0.0;
        var sqftunit = 0;  
        let rowUnits = [];
        for (let i = 1; i<=property.units; i++) {
          bedunit = "bed"+i;
          bathunit = "bath"+i;
          sqftunit = "sqft"+i;  
            rowUnits.push(
              <Col xs={12} sm={12} md={12} xl={6} key={i}><span className="data-group mult">
                      <span className="label text-white">Unit {i}: </span>
                      <span className="value text-white">{property[bedunit]}BR/{property[bathunit]}BA/{property[sqftunit]}SF </span>
                    </span>
              </Col>
            )
        }
        return <div >
            <Row>
              <Col>
                <h6 className="text-white mb-2" style={{fontWeight:500}}># Units: {property.number_of_units}</h6>
              </Col>
              <Col>
                <h6 className="text-white mb-2" style={{fontWeight:500}}>Sqft: {property.sqft}</h6>
              </Col>
            </Row>
              <Row className="row-mult">
                {rowUnits}
              </Row>
              
              {
                  (Number(property.hoa_dues) > 0) && 
                  <span className="data-group">
                    <h6 className="text-white mb-2 ">HOA: <Currency value={property.hoa_dues} /></h6>
                    {/* <h6 className="value"><Currency value={property.hoa_dues} /> </h6> */}
                  </span>
              }
          </div>
    }

    renderSinglePropertyFeatures = (property) => {
        return <div >
                <h6 className="text-white mb-2" >
                <i className="fas fa-bed" /> &nbsp;&nbsp;
                Beds:   {property.bedrooms} 
                </h6>
                <h6 className="text-white mb-2">
                <i className="fas fa-bath" /> &nbsp;&nbsp;
                Baths:    {property.bathrooms}
                </h6>
                <h6 className="text-white mb-2">
                <i className="far fa-building" /> &nbsp;&nbsp;
                Sqft:    {property.sqft}
                </h6>
                {
                    (Number(property.hoa_dues) > 0) && 
                    <h6 className="text-white mb-2">
                    <i className="far fa-money-bill-alt" /> &nbsp;&nbsp;
                    HOA: <Currency value={property.hoa_dues} />
                    </h6>
                }
    </div>
    }
    renderPropertyFeatures = (property) => {
        if (property.property_type === "MULT") {
            return this.renderMultiPropertyFeatures(property);
        }
        else {
            return this.renderSinglePropertyFeatures(property);
        }
    }

    handleAssumptionsChanged = (assumptions) => {
        const options = this.props.property.cma.options
        this.props.onAssumptionsChanged(this.props.property.listing_id, options, assumptions);
      }

    handlePrint = () => {
        setTimeout(function () { window.print(); }, 500);
        setTimeout(function () { window.close(); }, 500);
    }

    render() {
        let property = this.props.property;

        if (!property) {
            return <Card>
              <CardTitle className="bg-danger border-bottom p-3 mb-0 text-white">Property Not Selected</CardTitle>
            </Card>;
        }
        const cma = this.props.property.cma && this.props.property.cma;

        let assumptions = this.props.assumptions;
        if (cma) {
          const cmaInputParams = cma.parameters;
          assumptions = Object.assign(cmaInputParams, cma.cma.params);
  
        }

        // const cma = property.cma.cma;
        var cma_calc = cma.cma.cma_calc;

        var has_current_values = cma.cma.current_cma != undefined;
        var cma_current = cma.cma.current_cma || {};
        var currrentName = null;
        var unitnumber = "";
        if (property.unitnumber != "") {
          unitnumber = "Unit " + property.unitnumber
        }
        
    return <div style={{padding:'20px', paddingTop:'0px'}} className="property property-details">
        <Row>
                <Col xs="12" md="6">
                    <Row >
                        <Col xs="12" md="12">
                            <Card color="info" >
                                <CardBody>
                                    <Row>
                                        <Col  xs="12" md="2" className=" align-self-center">
                                            <h3 className=" text-white"><Currency value={property.price} /></h3>
                                            <h5 className="text-white">Price</h5>
                                        </Col>
                                        <Col xs="12" md="4" className=" align-self-center">
                                            <div className="d-flex">
                                                <div className="ml-3">
                                                <h4 className="text-white">{property.street_address} {unitnumber}</h4>
                                                <h6 className="text-white">{property.city}, {property.state} {property.zipcode}</h6>
                                            </div>
                                            </div>
                                        </Col>
                                        <Col xs="12" md="5" className="text-left">
                                                {this.renderPropertyFeatures(property)}
                                        </Col>
                                    </Row>
                                    </CardBody>
                            </Card>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs="12" md="12">
                            <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">Income and Expenses</CardTitle>

                            <CardBody>
                                <Form>
                                    <UncontrolledTooltip placement="top" target="Calc_DebtCoverageRatio">
                                        Net Operating Income / Annual Mortgage Payments
                                    </UncontrolledTooltip>
                                    <CmaFormControl name='Closing Costs' id='Calc_ClosingCosts' value={cma_calc.Calc_ClosingCosts} readOnly={true} type="currency" decimals={2} />
                                    <CmaFormControl name='Down Payment' id='Calc_Downpayment' value={cma_calc.Calc_Downpayment} readOnly={true} type="currency" />
                                    <CmaFormControl name='Mortgage' id='Calc_MortgagePerMonth' value={cma_calc.Calc_MortgagePerMonth} readOnly={true} type="currency" period="monthly" decimals={2} />
                                    <CmaFormControl name='Debt-Coverage Ratio' id='Calc_DebtCoverageRatio' value={cma_calc.Calc_DebtCoverageRatio} readOnly={true} type="percent" />
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
                                    <UncontrolledTooltip placement="top" target="Calc_GrossSchedIncome">
                                        GSI = Rent + Other income
                                    </UncontrolledTooltip>
                                    <UncontrolledTooltip placement="top" target="Calc_EffectiveGrossIncome">
                                        GSI - (GSI * Vacancy Rate)
                                    </UncontrolledTooltip>
                                    <UncontrolledTooltip placement="top" target="Calc_NetOperatingIncome">
                                        Gross Effective Income - Operating Expenses
                                    </UncontrolledTooltip>
                                    <UncontrolledTooltip placement="top" target="Calc_NetIncomeMultiplier">
                                        Property value / Net Operating Income
                                    </UncontrolledTooltip>
                                    <UncontrolledTooltip placement="top" target="Calc_GrossRentMultiplier">
                                        Property value / GSI
                                    </UncontrolledTooltip>
                                    <CmaFormControl name='Scheduled Income (Gross)' id='Calc_GrossSchedIncome' value={cma_calc.Calc_GrossSchedIncome} current={cma_current.Current_GrossSchedIncome} readOnly={true} type="currency" period="yearly" />
                                    <CmaFormControl name='Effect. Income (Gross)' id='Calc_EffectiveGrossIncome' value={cma_calc.Calc_EffectiveGrossIncome} current={cma_current.Current_EffectiveGrossIncome} readOnly={true} type="currency" period="yearly" />
                                    <CmaFormControl name='Net-Operating Income' id='Calc_NetOperatingIncome' value={cma_calc.Calc_NetOperatingIncome} current={cma_current.Current_NetOperatingIncome}  readOnly={true} type="currency" />
                                    <CmaFormControl name='Total Operating Expenses' id='Calc_OperatingExpenses' value={cma_calc.Calc_OperatingExpenses}  current={cma_current.Current_OperatingExpenses} readOnly={true} type="currency" period="yearly"/>
                                    <CmaFormControl name='Prop. Taxes' id='Calc_PropertyTaxes' isSubItem={true} value={cma_calc.Calc_PropertyTaxes} current={cma_current.Current_PropertyTaxes} readOnly={true} type="currency" period="yearly" />
                                    <CmaFormControl name='Insurance' id='Calc_Insurance' isSubItem={true} value={cma_calc.Calc_Insurance}  current={cma_current.Current_Insurance} readOnly={true} type="currency" period="yearly" />
                                    <CmaFormControl name='Maintenance' id='Calc_Maintenance' isSubItem={true} value={cma_calc.Calc_Maintenance} current={cma_current.Current_WaterSewerGarbage} readOnly={true} type="currency" period="yearly" />
                                    <CmaFormControl name='Property Management' id='Calc_PropertyMgmt'  isSubItem={true} value={cma_calc.Calc_PropertyMgmt} current={cma_current.Current_PropertyMgmt} readOnly={true} type="currency" period="yearly" />
                                    <CmaFormControl name='HOA' id='hoa_yr'  isSubItem={true} value={cma_calc.HOA_yr} current={cma_current.Current_HODAnnual} readOnly={true} type="currency" period="yearly" />
                                    <CmaFormControl name='Net-Income Multiplier' id='Calc_NetIncomeMultiplier' value={cma_calc.Calc_NetIncomeMultiplier} current={cma_current.Current_NetIncomeMultiplier} readOnly={true} type="percent" />
                                    <CmaFormControl name='Rent Multiplier (Gross)' id='Calc_GrossRentMultiplier' value={cma_calc.Calc_GrossRentMultiplier} current={cma_current.Current_GrossRentMultiplier} readOnly={true} type="percent" />
                                </Form>
                            </CardBody>
                        </Col>
                    </Row> 
                </Col>
                <Col xs="12" md="6">
                <PropertyAnalyzeCma property={property} assumptions={assumptions} onAssumptionsChanged={this.handleAssumptionsChanged}/>             

                </Col>
            </Row>
            
        </div>
    }
  }
  
  export default withSettings(PropertyAnalyzeDetails);