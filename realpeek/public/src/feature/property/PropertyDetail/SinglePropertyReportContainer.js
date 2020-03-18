import React, { Component, useRef  } from 'react';
import queryString from 'qs';
import { fetchProperty, calculateCma, getAssumptions } from '../../../api/PropertyApi';
import PropertyDetails from './PropertyDetails';
import { print } from 'util';
import ListAssumptions from '../../cmaAssumptions/ListAssumptions';
import SinglePropertyReport from './SinglePropertyReport';
import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
class SinglePropertyReportContainer extends Component {
    constructor(props) {
      super(props);
      this.state = {
        loading: true,
        assumptions: null,
        cma: null
      }
      this.handlePrint = this.handlePrint.bind(this);

    }
    async componentDidMount() {
        const id = this.props.propertyID;
        const property = await fetchProperty(id);

        // document.title="Investment Property Report - " + property.address;

        let assumptions = null;
        if (this.props.location.search) {
          assumptions = queryString.parse(this.props.location.search, { ignoreQueryPrefix: true });
        }
        
        if (!assumptions) {
          const userAssumptions = await getAssumptions();
          assumptions = userAssumptions.parameters;
        }

        const cma = await calculateCma(id, null, assumptions);
        const cma_results = cma ? cma.cma : null;
        this.setState({assumptions, property, cma: cma_results, loading: false}, () => {
            //this.handlePrint();
        });
    }

     handlePrint = () => {
      const input = document.getElementById('reportID');

      html2canvas(input)
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
        });
        const imgProps= pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('download.pdf');
      });
     }

    render() {
      const {loading, property} = this.state;
      if (loading) {
        return null;
      }
      return <SinglePropertyReport property={property} cma={this.state.cma}  assumptions={this.state.assumptions} onPrint={this.handlePrint}/>
    }
  }
  
  export default SinglePropertyReportContainer;