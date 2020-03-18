import React, { PureComponent } from 'react';

import {Link} from 'react-router-dom';
import { Row, Col, Input, Card, CardBody} from 'reactstrap';
import scrollIntoView from 'scroll-into-view-if-needed'

import {IMGPATH, calculateCma} from '../../api/PropertyApi';
import SlidingPane from 'react-sliding-pane';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import PropertyCma from './PropertyCma';
import { CmaCriteria } from './CmaCriteria';
import {ListingFirmAttribution} from "../disclaimers/Attribution";

import './property.css';
import { PropertyDetailLink, PropertyReportLink } from './PropertyLinks';
import PropertySummary from './PropertySummary';
import PropertySummaryCma from './PropertySummaryCma';

class PropertySearchResult extends PureComponent {
    constructor(props) {
      super(props);
      this.propertyRef = React.createRef();

      this.state = {
        isPaneOpen: false,
        cma: this.props.property.cma,
        isHovered: false
      }
    }

    componentDidUpdate = () => {
      if (this.props.highlighted) {
        const block = this.state.isHovered ? 'nearest' : 'center'
        scrollIntoView(this.propertyRef.current, {scrollMode: 'if-needed', block: block, behavior: 'instant'});
      }
    }

    handleSelect = () => {
      this.props.onSelect(this.props.property._id);
    }

    openSideBar = () => {
      this.setState({isPaneOpen:true})
    }
    closeSideBar = () => {
      this.setState({isPaneOpen:false})
    }

    handleOnMouseOver = () => {
      this.setState({isHovered: true});
      this.props.onHoverChanged(this.props.property);
    }
    handleOnMouseOut = () => {
      this.setState({isHovered: false});
      this.props.onHoverChanged(null);
    }
    render() {
      const property = this.props.property;
      const id = property.listing_id;
      const cma = this.props.property.cma;
      const showCma = cma && !this.props.hideCma;
      let assumptions = this.props.assumptions;
      // if (cma) {
      //   const cmaInputParams = cma.parameters;
      //   assumptions = Object.assign(cmaInputParams, cma.cma.params);
      // }


      // if (cma) {
      //   assumptions = Object.assign(assumptions, cma.cma.params);
      // }

      let cmaCriteriaResult = null;
      if (showCma) {
        const cma_results = cma.cma.cma_results;
        if (cma_results && cma_results.criteria_result) {
          cmaCriteriaResult = cma_results.criteria_result.toLowerCase() == "success" ? "cma_criteria_success": "cma_criteria_failure";
        }
      }

      return (
        <CardBody id={id} className={`item-wrap infobox_trigger item-${id} ${cmaCriteriaResult} ` + (this.props.highlighted ? "highlight" : "") }>
          <Col md={1}>
            <Input addon type="checkbox" checked={this.props.selected} onChange={this.handleSelect}/>{' '}
          </Col>
          <Col md={11}>
            <div ref={this.propertyRef}>
              <PropertySummary property={property} assumptions={assumptions} onMouseOver={this.handleOnMouseOver} onMouseOut={this.handleOnMouseOut}
              limitValue={this.props.limitValue} minValue={this.props.minValue} maxValue={this.props.maxValue}/>
            </div>
          </Col>
        </CardBody> 
        
      );
    }
  }
  
  export default PropertySearchResult;