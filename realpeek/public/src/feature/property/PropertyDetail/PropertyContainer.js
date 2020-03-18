import React, { Component } from 'react';
import queryString from 'qs';
import { fetchProperty, calculateCma, updateAssumptions } from '../../../api/PropertyApi';
import PropertyDetails from './PropertyDetails';
import { print } from 'util';
import ListAssumptions from '../../cmaAssumptions/ListAssumptions';
import Loader from 'react-loader-advanced';

class PropertyContainer extends Component {
    constructor(props) {
      super(props);
      this.state = {
        loading: false,
        assumptions: null,
        cmaOptions: {},
        cma: null,
        isSaving: false
      }
    }

    async componentDidMount() {
        this.setState({loading:true});
        const id = this.props.match.params.id;
        const property = await fetchProperty(id);
        let assumptions = null;
        if (this.props.location.search) {
          assumptions = queryString.parse(this.props.location.search, { ignoreQueryPrefix: true });
          this.setState({assumptions});
        }

        let cmaOptions = this.state.cmaOptions;
        cmaOptions["cma_properties"] = "true";
        cmaOptions["market_value"] = "true";
        this.setState({cmaOptions});

        const cma = await calculateCma(id, cmaOptions, assumptions);
        const cma_results = cma ? cma.cma : null;
        this.setState({assumptions, property, cma: cma_results, loading: false});
    }

    handleAssumptionsChanged = (propertyId, options, newAssumptions) => {
      this.setState({isSaving: true, assumptions:newAssumptions});
      let cmaOptions = {"area_properties":"true", "cma_properties":"true"}
      this.setState({cmaOptions});
      calculateCma(propertyId, cmaOptions, newAssumptions).then((newCma)=> {
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
          <PropertyDetails property={property} cma={this.state.cma} assumptions={this.state.assumptions} onAssumptionsChanged={this.handleAssumptionsChanged}/>
        </Loader>
        )
    }
  }
  
  export default PropertyContainer;