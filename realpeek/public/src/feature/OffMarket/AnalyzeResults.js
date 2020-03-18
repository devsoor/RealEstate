import React, { Component } from 'react';
import { Alert, Card, CardBody } from 'reactstrap';

import PropertyAnalyzeResult from './Property/PropertyAnalyzeResult';

class AnalyzeResults extends Component {
    constructor(props) {
      super(props);
      this.state = {
        selectedList: this.props.selected || []
      }
      this.handleSelect = this.handleSelect.bind(this);
    }

    componentWillReceiveProps(newProps) {
      if (this.props.selected !== newProps.selectedList) {
        this.setState({selectedList: newProps.selected || []})
      }
    }

/*     handleSelect(resultId) {
      this.setState((prevState)=> {
        const index = prevState.selectedList.indexOf(resultId);
        
        // if the result was already selected, then remove it from the array
        if (index > -1) {
          prevState.selectedList.splice(index, 1);
        }
        else {
          prevState.selectedList.push(resultId);
        }
        return {selectedList: prevState.selectedList}
      }, 
      () => this.props.onSelectionChanged(this.state.selectedList))
    } */

    
    handleSelect(result) {
      this.setState((prevState)=> {
        const index = prevState.selectedList.indexOf(result);
        
        // if the result was already selected, then remove it from the array
        if (index > -1) {
          prevState.selectedList.splice(index, 1);
        }
        else {
          prevState.selectedList.push(result);
        }
        return {selectedList: prevState.selectedList}
      }, 
      () => this.props.onSelectionChanged(this.state.selectedList))
    }

    handleHoverChanged = (hoveredResult) => {
      this.props.onHoverChanged(hoveredResult)
    }

    handleMouseClick = (property) => {
      this.props.onMouseClick(property)
    }


    render() {
      let cmaError = null;
      if (this.props.cmaExceeded) { 
        cmaError = "Enter your search above to get cash flow values.  Max properties " + this.props.maxCma;
        return <CardBody>
            <Alert className="bg-danger mb-3 text-white">
              {cmaError}
            </Alert>
          </CardBody>
      } 
      let results = this.props.results;

      let selectedList = this.props.selected;

      if (!results) {
        return null;
      }

      if (results.length === 0) {
        return <div>No results found.</div>
      }
      const minValue = results && Math.min(...results.map(o => o.cma && o.cma.cma.cma_results.criteria_value))
      const maxValue = results && Math.max(...results.map(o => o.cma && o.cma.cma.cma_results.criteria_value))
      const limitValue = Math.max(Math.abs(minValue), Math.abs(maxValue))

      return results.map((result, i)=>{
        const selected = selectedList.includes(result);
        let highlighted = false; 
        if (this.props.highlighted && this.props.highlighted.listing_id === result.listing_id) {
          highlighted = true;
        }
         return <PropertyAnalyzeResult key={result.listing_id} property={result} 
          selected={selected} 
          highlighted={highlighted}
          onSelect={this.handleSelect}
          onHoverChanged={this.handleHoverChanged} 
          onMouseClick={this.handleMouseClick} 
          limitValue={limitValue}
          minValue={minValue}
          maxValue={maxValue}
          cmaExceeded={this.props.cmaExceeded}
          maxCma={this.props.maxCma} />
      })
    }
  }

    export default AnalyzeResults;