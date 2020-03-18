import React, {Component} from "react"
// import {Panel, ButtonGroup, Button, Row, Col, Image} from 'react-bootstrap';
import { ButtonGroup, Button, Row, Col, Card, CardBody, CardTitle, CardSubtitle, Media} from 'reactstrap';

import {Link} from "react-router-dom";

import {IMGPATH} from '../../../api/PropertyApi';
import { MlsDislcaimer, RealPeekReportDisclaimer } from "../../disclaimers/MLSDisclaimer";
import { withSettings} from "../../../api/SettingsProvider";
import ListAssumptionsReport from "../../cmaAssumptions/ListAssumptionsReport";
import PropertyCompsReport from "./PropertyCompsReport";
import CmaResultsSummary from "../CmaResultsSummary";
import '../property.css';
import { Currency, FixedNumber } from "../../common/Format";
import { ListingFirmAttribution } from "../../disclaimers/Attribution";
import ReportSection from "./ReportSection";
import { ReportHeader } from "../../reports/ReportHeader";
import SaveToPdf from "../../common/saveToPdf/SaveToPdf";

const PropertyFeatureGroup =(props) => {
    if (props.value != 'undefined') {
        return <Col>
            <Row className="text-muted ">{props.name} </Row>
            <Row className=" text-dark op-6"> {props.children} </Row>
        </Col>
    }
}

class SinglePropertyReport extends Component {

    constructor(props) {
        super(props);
    }
    renderMultiPropertyFeatures = (property) => {
        return <Row>
            {
                property.units &&
                property.units.map((unit, i) => {
                    return <PropertyFeatureGroup key={i} name={`Unit ${i+1}`}>{unit.bedrooms}BR/{unit.bathrooms}BA/{unit.sqft}SF</PropertyFeatureGroup>
                })
            }
          </Row>
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
        this.props.onEmail("reportID");
    }

    render() {
        const agent = this.props.settings;
        const property = this.props.property;
        const assumptions = this.props.assumptions;
        const cma = this.props.cma;
        const cma_results = cma.cma_results;
        const subjectProperty = cma.subject_property;
        if (!agent) {
            return null;
        }

        return <div className="property report">
            <Row>
                <Col xs={12} md={12}>
                    <div className="pull-right">
                            <ButtonGroup className="pull-right" >
                                {/* <Button size="lg" className="ti-sharethis" outline style={{border:0}} onClick={this.handleEmail}></Button> */}
                                <SaveToPdf id="reportID" filename={`${property.listing_id}.pdf`} />
                            </ButtonGroup>
                    </div>
                </Col>
            </Row>
            

            <div id="reportID" className="property-details">
                <div className="page">
                <ReportHeader />
                <ReportSection title="Property Details">
                    <Row>
                        <Col xs={8} >
                            <Row>
                                <Col xs={12} md={4}>
                                    <div className="property-address">
                                        {/* <h3 className="address-city">{property.address}</h3> */}
                                        <h4 >{property.street_address}</h4>
                                        <h5>{property.city}, {property.state} {property.zipcode}</h5>
                                    </div>
                                    <h4 className="property-price"><Currency value={property.price} /></h4>

                                    <h6 className="text-muted">{property.mp_style_name}</h6>
                                </Col>
                                <Col xs={12} md={8}>
                                    <Row>
                                        <Col xs={6} md={2}>
                                            <PropertyFeatureGroup name="MLS ID">{property.listing_id}</PropertyFeatureGroup>
                                        </Col>
                                        <Col xs={6} md={8}>
                                            {this.renderPropertyFeatures(property)}
                                        </Col>
                                    </Row>&nbsp;
                                    <Row>
                                        <Col xs={6} md={6}>
                                            <Row>
                                                <PropertyFeatureGroup name="Lot Size"><FixedNumber decimals={0} value={property.details.LSF}/> sqft</PropertyFeatureGroup>
                                                <PropertyFeatureGroup name="Year Built">{property.year_built}</PropertyFeatureGroup>
                                                <PropertyFeatureGroup name="HOA Dues"><Currency value={property.hoa_dues} />/month</PropertyFeatureGroup>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>

                            <Row>
                                <Col xs={12} md={12}>
                                    <Row>
                                        <CardBody className="d-flex">
                                            <PropertyFeatureGroup name="Rent"><Currency value={cma_results.Result_EstMonthlyRent}/></PropertyFeatureGroup>
                                            <PropertyFeatureGroup name="Market Value"><Currency value={cma_results.Result_EstMarketValue}/></PropertyFeatureGroup>
                                            <PropertyFeatureGroup name="Price/sqft"><Currency value={subjectProperty.price_sqft}/></PropertyFeatureGroup>
                                            <PropertyFeatureGroup name="Rent/sqft"><Currency value={subjectProperty.rent_sqft} decimals={2}/></PropertyFeatureGroup>
                                        </CardBody>
                                    </Row>
                                </Col>
                            </Row>
                            <Row>
                                    <PropertyFeatureGroup name="Floor">{property.details.FLS}</PropertyFeatureGroup>
                            </Row>&nbsp;
                            <Row>
                                    <PropertyFeatureGroup name="Appliances">{property.details.APS}</PropertyFeatureGroup>
                            </Row>&nbsp;
                            <Row>
                                    <PropertyFeatureGroup name="Fireplaces">{property.details.FP}</PropertyFeatureGroup>
                            </Row>&nbsp;
                            <Row>
                                    <PropertyFeatureGroup name="School District">{property.details.SD || "Buyer to Verify"}</PropertyFeatureGroup>
                                    <PropertyFeatureGroup name="Elementary">{property.details.EL || "Buyer to Verify"}</PropertyFeatureGroup>
                                    <PropertyFeatureGroup name="Junior High">{property.details.JH || "Buyer to Verify"}</PropertyFeatureGroup>
                                    <PropertyFeatureGroup name="High">{property.details.SH || "Buyer to Verify"}</PropertyFeatureGroup>
                            </Row>
                        </Col>
                            <Col xs={4}>
                                <div>
                                    {
                                        property.image_count &&
                                        <div>
                                            <img className="property-image-large" src={IMGPATH + property.images[0]} alt="Image of Property" />
                                        </div>
                                    }
                                    <ListingFirmAttribution value={property.listing_office_name} />
                                </div>
                            </Col>
                    </Row>
                    <Row>
                        <div className="property-description">
                                    {property.description}
                        </div>
                    </Row>
                </ReportSection>
                <ReportSection title="Investment Analysis">
                    <CmaResultsSummary cma={cma} assumptions={assumptions} />
                </ReportSection>
            
                <ReportSection title="Assumptions">
                    <ListAssumptionsReport assumptions={assumptions} />
                </ReportSection>
                <RealPeekReportDisclaimer />
            </div>
            <div className="page">
                {
                    property.property_type != "MULT" &&
                        <ReportSection title="Comps">
                            <PropertyCompsReport property={property} assumptions={assumptions} cma={cma}/>
                        </ReportSection>
                }
                <RealPeekReportDisclaimer />
            </div>
            </div>

        </div>
    }
}

export default withSettings(SinglePropertyReport);