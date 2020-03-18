import React, { PureComponent } from 'react';

import {Link} from 'react-router-dom';
import { Row, Col, Input, CardBody } from 'reactstrap';
import scrollIntoView from 'scroll-into-view-if-needed'

import '../../property/property.css';
import PropertyAnalyzeSummary from './PropertyAnalyzeSummary';

class PropertyAnalyzeResult extends PureComponent {
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
      // this.props.onSelect(this.props.property.listing_id);
      this.props.onSelect(this.props.property);
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

    handleMouseClick = () => {
      this.props.onMouseClick(this.props.property);
    }
    render() {
        const property = this.props.property;

        const id = property.listing_id;
        const cma = this.props.property.cma && this.props.property.cma;

        // let assumptions = this.props.assumptions;
        // if (cma) {
        //   const cmaInputParams = cma.parameters;
        //   assumptions = Object.assign(cmaInputParams, cma.cma.params);
  
        // }
        let cmaCriteriaResult = null;
        if (cma) {
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
                        <PropertyAnalyzeSummary property={property} onMouseOver={this.handleOnMouseOver} 
                        onMouseOut={this.handleOnMouseOut} onMouseClick={this.handleMouseClick} limitValue={this.props.limitValue} minValue={this.props.minValue} maxValue={this.props.maxValue}/>
                    </div>
                </Col>
            </CardBody> 
        
        );
    }
  }
  
  export default PropertyAnalyzeResult;