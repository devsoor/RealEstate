import React, { Component } from 'react';

import {Link} from 'react-router-dom';
import { Row, Col, Label, Button, FormText, Badge, Card, CardTitle, CardBody} from 'reactstrap';

import { Currency } from '../../common/Format';
import PropertyAnalyzeSummaryCma from './PropertyAnalyzeSummaryCma';
import '../../property/property.css';

class PropertyAnalyzeyDetailClick extends Component {
  render() {
    const property = this.props.property;
        return  <div onMouseClick={this.props.onMouseClick}>
            
        </div>
  }
}
class PropertyAnalyzeSummary extends Component {

    renderMultiPropertyFeatures = (property) => {
        var bedunit = 0;
        var bathunit = 0.0;
        var sqftunit = 0;  
        let rowUnits = [];
        for (let i = 1;i<=property.units; i++) {
            bedunit = "bed"+i;
            bathunit = "bath"+i;
            sqftunit = "sqft"+i; 
            rowUnits.push(
              <Col xs={12} sm={12} md={12} xl={6} key={i}><span className="data-group mult">
                      <span className="label">Unit {i}: </span>
                      <span className="value">{property[bedunit]}BR/{property[bathunit]}BA/{property[sqftunit]}SF </span>
                    </span>
              </Col>
            )
        }

         return <CardBody className="property-features">
              <span className="data-group">
                <span className="label"># Units:</span>
                <span className="value">{property.units} </span>
              </span>

              <span className="data-group">
                <span className="label">Sqft:</span>
                <span className="value">{property.sqft} </span>
              </span>
              <Row className="row-mult">
                  {rowUnits}
              </Row>
          
          </CardBody>
      }
  
      renderSinglePropertyFeatures = (property) => {
  
        return <CardBody className="property-features">
              <span className="data-group">
                <span className="label">Beds:</span>
                <span className="value">{property.bedrooms} </span>
              </span>
              <span className="data-group">
                <span className="label">Baths:</span>
                <span className="value">{property.bathrooms} </span>
              </span>
              <span className="data-group">
                <span className="label">Sqft:</span>
                <span className="value">{property.sqft} </span>
              </span>
              {
                  (Number(property.hoa_dues) > 0) && 
                  <span className="data-group">
                    <span className="label">HOA:</span>
                    <span className="value"><Currency value={property.hoa_dues} /> </span>
                  </span>
              }
          </CardBody>
      }
      renderPropertyFeatures = (property) => {
        if (property.mp_style == 7) {
          return this.renderMultiPropertyFeatures(property);
        }
        else {
          return this.renderSinglePropertyFeatures(property);
        }
      }
    render() {
        let property = this.props.property;
  
        // let assumptions = this.props.assumptions;
        let id = property.listing_id;
        var unitnumber = "";
        if (property.unitnumber != "") {
          unitnumber = "Unit " + property.unitnumber
        }
  
        return (
            // <PropertyAnalyzeyDetailClick property={property} onMouseClick={this.props.onMouseClick}>
            <div onMouseOver={this.props.onMouseOver} onMouseOut={this.props.onMouseOut} onClick={this.props.onMouseClick}>
                <Row className="property property-summary" >
                    <Col md={7} >
                        <Row>
                                <Col xs={12} md={4}>
                                  <Row className="property-labels">
                                      <Badge className="bg-primary" pill>{property.mp_style_name}</Badge>
                                  </Row>
                                  <Row className="property-price">
                                      <Currency value={property.price} />
                                  </Row>
                                  <div className="property-address">
                                      <div className="address-street">{property.street_address} {unitnumber}</div>
                                      <div className="address-city">{property.city}, {property.state} {property.zipcode}</div>
                                  </div>
                                </Col>
                            <Col xs={12} md={8}>
                            {
                                this.renderPropertyFeatures(property)
                            }
                            </Col>
                        </Row>
                    </Col>     
                    <Col xs={12} md={5}>
                        <PropertyAnalyzeSummaryCma property={this.props.property} limitValue={this.props.limitValue} minValue={this.props.minValue} maxValue={this.props.maxValue}/>
                    </Col>       
                </Row>
            </div> 
            // </PropertyAnalyzeyDetailClick>
        );
      }
}
export default PropertyAnalyzeSummary;