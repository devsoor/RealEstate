import React, { Component } from 'react';

import {Link} from 'react-router-dom';
import { Row, Col, Label, Button, FormText, Badge, Card, CardTitle, CardBody} from 'reactstrap';


import {IMGPATH, calculateCma} from '../../api/PropertyApi';
import SlidingPane from 'react-sliding-pane';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import PropertyCma from './PropertyCma';
import { CmaCriteria } from './CmaCriteria';
import {ListingFirmAttribution} from "../disclaimers/Attribution";
import { Currency } from '../common/Format';

import './property.css';
import { PropertyDetailLink, PropertyReportLink } from './PropertyLinks';
import PropertySummaryCma from './PropertySummaryCma';
import { ImagePlaceholder } from './ImagePlaceholder/ImagePlaceholder';

function daysFromToday(date) {
  const today = new Date();
  const firstDate = new Date(date);

  var res = Math.abs(today - firstDate) / 1000;
  var days = Math.floor(res / 86400);
  return days;
}

class PropertySummary extends Component {
    renderMultiPropertyFeatures = (property) => {
      const cdom = property.cdom;
      const update_date = property.update_date;
      const cdom_calc = daysFromToday(update_date) + cdom;

      return <div className="property-features">
            <span className="data-group">
              <span className="label"># Units:</span>
              <span className="value">{property.number_of_units} </span>
            </span>
            <span className="data-group">
              <span className="label">Sqft:</span>
              <span className="value">{property.sqft} </span>
            </span>
            <Row className="row-mult">
              {
                property.units &&
                property.units.map((unit, i) => {
                  return <Col xs={12} sm={12} md={12} xl={6} key={i}><span className="data-group mult">
                    <span className="label">Unit {i+1}: </span>
                    <span className="value">{unit.bedrooms}BR/{unit.bathrooms}BA/{unit.sqft}SF </span>
                  </span>
                  </Col>
                })
              }
            </Row>
            
            {
                (Number(property.hoa_dues) > 0) && 
                <span className="data-group">
                  <span className="label">HOA:</span>
                  <span className="value"><Currency value={property.hoa_dues} /> </span>
                </span>
            }
            <span className="data-group">
              <span className="label">Days on Market:</span>
              <span className="value">{cdom_calc} </span>
            </span>
        </div>
    }

    renderSinglePropertyFeatures = (property) => {
      const cdom = property.cdom;
      const update_date = property.update_date;
      const cdom_calc = daysFromToday(update_date) + cdom;

      return <div className="property-features">
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
            <span className="data-group">
              <span className="label">Days on Market:</span>
              <span className="value">{cdom_calc} </span>
            </span>
        </div>
    }
    renderPropertyFeatures = (property) => {
      if (property.property_type == "MULT") {
        return this.renderMultiPropertyFeatures(property);
      }
      else {
        return this.renderSinglePropertyFeatures(property);
      }
    }
    render() {
      let property = this.props.property._source;

      let assumptions = this.props.assumptions;
      let id = property.listing_id;
      let image = null;
      if (property.image_count > 0 && property.images) {
        const thumbnail =  IMGPATH + property.images[0];
        image = <img className="single-property-img" prop_type={property.property_type} mls_vendor="NWMLS" listing_number={id} prefer_thumbnail="true" src={thumbnail}></img>
      }
      else {
        image = <ImagePlaceholder className="single-property-img" />
      }

      return (
        <PropertyDetailLink propertyId={property.unique_id} assumptions={assumptions} >
        <div onMouseOver={this.props.onMouseOver} onMouseOut={this.props.onMouseOut}>
            <Row className="property property-summary" >
              <Col md={3}>
                  <CardTitle className="pull-left">
                      MLS #  <Badge color="primary">{id}</Badge>
                  </CardTitle>
                <div className="property-image"  >
                    {image}
                </div>
                <Row>
                    <span className="mls-label pull-left">
                      <ListingFirmAttribution name={property.listing_office_name}/>
                  </span>
                </Row>
              </Col>
              <Col md={6} >
                <Row>
                  <Col md={4}>
                    <div className="property-price">
                      <Currency value={property.price} />
                    </div>
                    <div className="property-address">
                      <div className="address-street">{property.street_address}</div>
                      <div className="address-city">{property.city}, {property.state} {property.zipcode}</div>
                    </div>
                  </Col>
                  <Col md={8}>
                    {
                      this.renderPropertyFeatures(property)
                    }
                  </Col>
                </Row>
                <Row>

                  <Col sm={8} className="property-labels">
                    <Badge className="bg-secondary" pill>{property.mp_style_name}</Badge>
                    {
                      property.mp_status_name == "Pending" &&
                      <Badge className="bg-danger" pill>{property.mp_status_name}</Badge>
                    }
                    {
                      property.breo === "Y" &&
                      <Badge className="bg-info" pill>Bank Owned</Badge>
                    }
                    {
                      property.parq === "C" &&
                      <Badge className="bg-warning" pill>Short Sale</Badge>
                    }
                    {
                      property.building_condition === "C" &&
                      <Badge className="bg-danger" pill>Fixer-Upper</Badge>
                    }
                    {
                      property.new_construction === "Y" &&
                      <Badge className="bg-success" pill>New Construction</Badge>
                    }
                  </Col>
                </Row>
              </Col>     
              <Col md={3}>
                <PropertySummaryCma property={this.props.property} assumptions={assumptions} limitValue={this.props.limitValue} minValue={this.props.minValue} maxValue={this.props.maxValue} />
              </Col>       
            </Row>
            </div> 
          </PropertyDetailLink>
      );
    }
  }
  
  export default PropertySummary;