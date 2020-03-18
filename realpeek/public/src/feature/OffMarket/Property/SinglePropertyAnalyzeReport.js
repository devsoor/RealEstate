import React, {Component} from "react"
import { ButtonGroup, Button, Row, Col, Card, CardBody, CardTitle, CardSubtitle, Media} from 'reactstrap';
import ReactDOMServer from 'react-dom/server';
import { withSettings} from "../../../api/SettingsProvider";
import ListAssumptionsReport from "../../cmaAssumptions/ListAssumptionsReport";
import { RealPeekReportDisclaimer } from "../../disclaimers/MLSDisclaimer";

import '../../property/property.css';
// import '../../reports/Report.css';
import { Currency, FixedNumber, PercentDecimal, Percent } from "../../common/Format";
import { CmaCriteria } from '../../property/CmaCriteria';
import { ReportHeader } from "../../reports/ReportHeader";
import ReportSection from "../../property/PropertyDetail/ReportSection";
import CmaResultsAnalyzeSummary from "./CmaResultsAnalyzeSummary";
import PropertyAnalyzeCompsReport from "./PropertyAnalyzeCompsReport";
import SaveToPdf from "../../common/saveToPdf/SaveToPdf";

const PropertyFeatureGroup =(props) => {
    if (props.value != 'undefined') {
        return <Col>
            <Row className="text-muted ">{props.name} </Row>
            <Row className=" text-dark op-6"> {props.children} </Row>
        </Col>
    }
}
class SinglePropertyAnalyzeReport extends Component {
    
    constructor(props) {
        super(props);

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
                <PropertyFeatureGroup key={i} name={`Unit ${i}`}>{property[bedunit]}BR/{property[bathunit]}BA/{property[sqftunit]}SF</PropertyFeatureGroup>
            )
        }
        return <div>
            <Row >
                    {rowUnits}
            </Row>
        </div>
    }

    renderSinglePropertyFeatures = (property) => {
        return <Row>
            <PropertyFeatureGroup name="Beds">{property.bedrooms}</PropertyFeatureGroup>
            <PropertyFeatureGroup name="Baths">{property.bathrooms}</PropertyFeatureGroup>
            <PropertyFeatureGroup name="Size"><FixedNumber decimals={0} value={property.sqft}/> sqft</PropertyFeatureGroup>
        </Row>
    }
    renderPropertyFeatures = (property) => {
        if (property.property_type == "MULT") {
            return this.renderMultiPropertyFeatures(property);
        }
        else {
            return this.renderSinglePropertyFeatures(property);
        }
    }

    handleEmail() {
        this.props.onEmail("singleReportID");
    }

    render() {
        const settings = this.props.settings;
        if (!settings) {
            return null;
        }
        const logo_url = settings.logo_url;
        const agent_photo =  settings.agent_photo;
        const property = this.props.property;
        if (!property) {
            return <Card>
              <CardTitle className="bg-danger border-bottom p-3 mb-0 text-white">Select a property under Analyze to see report</CardTitle>
            </Card>;
        }
        const assumptions = this.props.assumptions;
        // const cma = this.props.cma;
        const cma = property.cma.cma
        const cma_results = cma.cma_results;
        const cma_calc = cma.cma_calc;
        const subjectProperty = cma.subject_property;
        var unitnumber = "";
        if (property.unitnumber != "") {
          unitnumber = "Unit " + property.unitnumber
        }
        const full_address = `${property.street_address} ${unitnumber} ${property.city}`;
        return <div className="property report">
            <Row>
                <Col xs={12} md={12}>
                    <div className="pull-right">
                            <ButtonGroup className="pull-right" >
                                {/* <Button size="lg" className="ti-sharethis" outline style={{border:0}} onClick={this.handleEmail}></Button> */}
                                <SaveToPdf id="singleReportID" filename={`${full_address}.pdf`} />
                            </ButtonGroup>
                    </div>
                </Col>
            </Row>
            <div id="singleReportID" className="property-details">
                <div className="page">
                    <ReportHeader />

                        <ReportSection title="Property">
                            <Row>
                                <Col xs={12} md={4}>
                                    <div className="property-address">
                                        <h4 >{property.street_address} {unitnumber}</h4>
                                        <h6 >{property.city}, {property.state} {property.zipcode}</h6>
                                    </div>
                                    <h4 className="property-price"><Currency value={property.price} /></h4>
                                    <h5 className="text-muted">{property.mp_style_name}</h5>
                                </Col>
                                <Col xs={12} md={8}>
                                    <Row>
                                        <Col xs={12} md={6}>
                                            {this.renderPropertyFeatures(property)}
                                        </Col>
                                        <Col xs={12} md={4}>
                                            <Row>
                                                <PropertyFeatureGroup name="Year Built">{property.year_built}</PropertyFeatureGroup>
                                                <PropertyFeatureGroup name="HOA Dues"><Currency value={property.hoa_dues} />/month</PropertyFeatureGroup>
                                            </Row>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={12} md={8}>
                                            <Row>
                                                <PropertyFeatureGroup name="Rent"><Currency value={cma_results.Result_EstMonthlyRent}/></PropertyFeatureGroup>
                                                <PropertyFeatureGroup name="Market Value"><Currency value={cma_results.Result_EstMarketValue}/></PropertyFeatureGroup>
                                                <PropertyFeatureGroup name="Price/sqft"><Currency value={subjectProperty.price_sqft}/></PropertyFeatureGroup>
                                                <PropertyFeatureGroup name="Rent/sqft"><Currency value={subjectProperty.rent_sqft} decimals={2}/></PropertyFeatureGroup>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </ReportSection>
                    <ReportSection title="Investment Analysis">
                        <CardBody>
                            <CmaResultsAnalyzeSummary cma={cma} assumptions={assumptions} />
                        </CardBody>
                    </ReportSection>
                    <ReportSection title="Assumptions">
                        <ListAssumptionsReport assumptions={assumptions} />
                    </ReportSection>
                    {
                        property.property_type != "MULT" &&
                            <ReportSection title="Comps">
                                <PropertyAnalyzeCompsReport property={property} assumptions={assumptions} />
                            </ReportSection>
                    }
                    <RealPeekReportDisclaimer />
                </div>
            </div>
        </div>
    }
}


export default withSettings(SinglePropertyAnalyzeReport);