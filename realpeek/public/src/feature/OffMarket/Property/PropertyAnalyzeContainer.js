import React, { Component } from 'react';
import queryString from 'qs';
import { fetchProperty, calculateCma, getAssumptions } from '../../../api/PropertyApi';
import PropertyAnalyzeDetails from './PropertyAnalyzeDetails';
import { print } from 'util';
import ListAssumptions from '../../cmaAssumptions/ListAssumptions';
import Loader from 'react-loader-advanced';

class PropertyAnalyzeContainer extends Component {
    constructor(props) {
      super(props);
      this.state = {
        loading: true,
        assumptions: null,
        cmaOptions: {},
        cma: null
      }
    }

    async componentDidMount() {
        const id = this.props.match.params.id;
        let property = id;
        // if (this.props.location.property) {
        //     property = queryString.parse(this.props.location.pathname, { ignoreQueryPrefix: true });
        // }
        let assumptions = null;
        property = queryString.parse(this.props.location.search, { ignoreQueryPrefix: true }).property;

        assumptions = queryString.parse(this.props.location.search.assumptions, { ignoreQueryPrefix: true }).assumptions;
/* 
        if (this.props.location.search) {
          assumptions = queryString.parse(this.props.location.search, { ignoreQueryPrefix: true });
          this.setState({assumptions});
        } */

/*         let cmaOptions = this.state.cmaOptions;
        cmaOptions["cma_properties"] = "true";
        this.setState({cmaOptions});

        const cma = await calculateCma(property, cmaOptions, assumptions);
        const cma_results = cma ? cma.cma : null;
        this.setState({assumptions, property, cma: cma_results, loading: false}); */
    }

    handleAssumptionsChanged = (property, options, newAssumptions) => {
      let cmaOptions = {"area_properties":"true", "cma_properties":"true", "market_value":"true"}
      this.setState({cmaOptions});
      calculateCma(property, cmaOptions, newAssumptions).then((newCma)=> {
        const cma_results = newCma ? newCma.cma : null;
        this.setState({cma: cma_results})
      })
  }

    handlePrint = () => {
      this.setState({printable: true})
    }

    render() {
      const {loading, property} = this.state;
      if (loading) {
        return null;
      }

      return (
        <Loader show={this.state.loading} message={'loading'}>
          <PropertyAnalyzeDetails property={property} cma={this.state.cma} assumptions={this.state.assumptions} onAssumptionsChanged={this.handleAssumptionsChanged}/>
        </Loader>
        )
    }
  }
  
  export default PropertyAnalyzeContainer;