import React, { Component } from 'react';
import {
    UncontrolledCarousel,
    Card,
    CardBody,
    CardTitle,
    Row,
    Col,
    Button,
    ButtonGroup,
    Collapse,
    Form,
    FormGroup,
    TabContent,
    TabPane,
    Nav,
    NavItem,
    NavLink,
    UncontrolledTooltip
} from 'reactstrap';
import classnames from 'classnames';
import { Currency, FixedNumber } from '../../common/Format';
import {IMGPATH} from '../../../api/PropertyApi';
import '../property.css';
import { withSettings} from "../../../api/SettingsProvider";
import templates from './PropertyTemplates';
import { ListingFirmAttribution } from '../../disclaimers/Attribution';
import {AgentDisclaimer, MlsDislcaimer} from '../../disclaimers/MLSDisclaimer';
import { ImagePlaceholder } from '../ImagePlaceholder/ImagePlaceholder';
import img from '../ImagePlaceholder/NoImagesAvailable.png';
import PropertyCma from '../PropertyCma';
import CmaFormControl from '../CmaFormControl';
import { CmaCriteria } from '../CmaCriteria';
import SinglePropertyReportContainer from './SinglePropertyReportContainer';
import PropertyComps from '../PropertyComps';
import SinglePropertyReport from './SinglePropertyReport';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


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

class PropertyDetails extends Component {
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
                {
                  property.units &&
                  property.units.map((unit, i) => {
                    return <Col key={i} xs={6}><span >
                      <h6 className="text-white  ">Unit {i+1}: {unit.bedrooms}BR/{unit.bathrooms}BA/{unit.sqft}SF</h6>
                      {/* <h6 className=" text-info mb-2">{unit.bedrooms}BR/{unit.bathrooms}BA/{unit.sqft}SF </h6> */}
                    </span>
                    </Col>
                  })
                }
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
                Sqft:    <FixedNumber decimals={0} value={property.sqft}/>
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
        const options = this.props.cma.options;
        this.props.onAssumptionsChanged(this.props.property.unique_id, options, assumptions);
    }


    handleEmail = (id) => {
        console.log("Send email to client")
    }

    render() {
      let property = this.props.property;
      if (!property) {
        return <div>property not found</div>;
      }

      let details = property.details;
      let template = templates[property.property_type.toLowerCase()]

      const cma = this.props.cma;
       var cma_calc = cma.cma_calc;

      var has_current_values = cma.current_cma != undefined;
      var cma_current = cma.current_cma || {};
      var currrentName = null;
      
      let assumptions = this.props.assumptions;
      if (cma) {
        assumptions = Object.assign(assumptions, cma.params);
      }
      
        // There may be a better way to do this, reactstrap Uncontrolled carousel expects the array in certain format.
        const slides = [];
        if (property.images)
        {
                property.images.map((image,key) => {
                    var o = {};
                    o.src = urljoin(IMGPATH,image);
                    o.altText = "";
                    o.caption = "";
                    slides.push(o);
                })
        } else {
                    var o = {};
                    o.src = img;
                    o.altText = "No image available";
                    o.caption = "";
                    slides.push(o);
        }
    
        
    return <div style={{padding:'20px', paddingTop:'0px'}} className="property property-details">
 {/*        <Row>
                <Col md="12" className="pull-right">
                    <Card className="pull-right">
                    <ButtonGroup className="pull-right" >
                        <Button outline className="ti-book" style={{border:0}} onClick={this.handleReport}> </Button> &nbsp; &nbsp;
                        <Button outline className="mdi mdi-heart-outline" style={{border:0}} onClick={() => this.onCheckboxBtnClick(1)} active={this.state.cSelected.includes(1)}></Button> &nbsp;&nbsp;
                        <Button color="info" className="mdi mdi-arrow-down-right" >Next</Button>
                    </ButtonGroup>
                    </Card>
                </Col>
            </Row> */}
            <Row>
                <CardBody>
                <Nav tabs className="font-14 border-info">
                    <NavItem>
                        <NavLink className={classnames({ active: this.state.activeTab === '1' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('1'); }}>Analysis</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={classnames({ active: this.state.activeTab === '2' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('2'); }}>Comps</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={classnames({ active: this.state.activeTab === '3' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('3'); }}>Reports</NavLink>
                    </NavItem>
                </Nav> 
                </CardBody>
                <TabContent activeTab={this.state.activeTab}>
                    <TabPane tabId="1">
                        <Row>
                                <Col xs="12" md="6">
                                    <Row >
                                        <Col xs="12" md="12">
                                            <Card color="info" >
                                                {/* <div className="p-3"> */}
                                                <CardBody>
                                                    <Row>
                                                        <Col  xs="12" md="2" className=" align-self-center">
                                                            <h3 className=" text-white"><Currency value={property.price} /></h3>
                                                            <h5 className="text-white">Price</h5>
                                                        </Col>
                                                        <Col xs="12" md="4" className=" align-self-center">
                                                            <div className="d-flex">
                                                                {/* <div className="display-8 text-white"> */}
                                                                {/* <i className="far fa-address-card" /> */}
                                                                {/* </div> */}
                                                                <div className="ml-3">
                                                                <h4 className="text-white">{property.street_address}</h4>
                                                                <h6 className="text-white">{property.city}, {property.state} {property.zipcode}</h6>
                                                            </div>
                                                            </div>
                                                        </Col>
                                                        <Col xs="12" md="5" className="text-left">
                                                                {this.renderPropertyFeatures(property)}
                                                        </Col>
                                                    </Row>
                                                    </CardBody>
                                                {/* </div> */}
                                            </Card>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs="12" md="12">
                                            <UncontrolledCarousel className="carousel-image" items={slides} interval={false}/>
                                        </Col>
                                        <Col xs="12" md="12">
                                            <Row className="pull-right">
                                                <ListingFirmAttribution name={property.listing_office_name} />
                                            </Row> 
                                        </Col>
                                    </Row>
                                   

                                    <Row>
                                        <Col xs="12" md="12">
                                            {/* <div className="property-description"> */}
                                                {/* <h5>Property Description</h5> */}
                                                <h6>{property.description}</h6>
                                            {/* </div> */}
                                        </Col>
                                    </Row>
                                        {/* </Col> */}

                                    {/* </Row> */}

                                    {/*--------------------------------------------------------------------------------*/}
                                    {/* Pitcure Gallery and carousal end                                               */}
                                    {/*--------------------------------------------------------------------------------*/}

                                    <Row>
                                        <Col xs="12" md="12">
                                            <Button block
                                            color="info"
                                            onClick={() => this.setState((prevState)=>this.setState({ features: !prevState.features }))}
                                            style={{ 'marginBottom': '1rem' }}
                                            >
                                            Property Features
                                            {this.state.features ? " <<" : " >>"}
                                            </Button>
                                            <Collapse isOpen={this.state.features}>
                                                {
                                                    template.sections.map((section)=> {
                                                        return <DetailsSection key={section.name} name={section.name} fields={section.fields} property={property} />
                                                    })
                                                }

                                                <div className="nwmls resi-community-features"></div>
                                                <div className="nwmls resi-financials"></div>
                                                <div className="nwmls resi-zoning"></div>
                                                <div className="nwmls resi-amenities"></div>
                                            </Collapse>
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
                                    <Row>
                                        <div>
                                            <AgentDisclaimer />
                                            <MlsDislcaimer />
                                        </div>
                                    </Row>  
                                </Col>
                                <Col xs="12" md="6">
                                    <PropertyCma property={property} cma={cma} assumptions={assumptions} onAssumptionsChanged={this.handleAssumptionsChanged}/>             
                                </Col>
                            </Row>
                        </TabPane>
                        <TabPane tabId="2">
                            <PropertyComps property={property} cma={cma} assumptions={assumptions} onAssumptionsChanged={this.handleAssumptionsChanged}/>                                
                        </TabPane>
                        <TabPane tabId="3">
                        <Col xs="12" md="12">
                            <SinglePropertyReport property={property} cma={cma}  assumptions={assumptions} onEmail={this.handleEmail} />
                            </Col>
                        </TabPane>

                </TabContent>
            </Row>     
        </div>
    }
  }
  
  export default withSettings(PropertyDetails);