import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Nav, NavItem, ButtonGroup, Button, Label, FormGroup, Input} from 'reactstrap';

import '../../property/property.css';
import { Currency } from '../../common/Format';
import {MapContainerComps} from '../../map/MapComps';
import ReactTable from "react-table";
import "react-table/react-table.css";
import withFixedColumns from "react-table-hoc-fixed-columns";
import { FormattedValue } from "../../common/Format";


import { withScriptjs, withGoogleMap, GoogleMap, Marker, InfoWindow, Circle } from "react-google-maps"
//const googleApiKey = 'AIzaSyAwtYJhBWHqxiV27OgdXUyr2KklYVTsulQ'; // prod key
// const googleApiKey = 'AIzaSyBT6koyESZ1xjk7XJKcUdEa7AKgTwfAa3g'; // dev key
const googleApiKey = process.env.REACT_APP_GOOGLE_API;
const ReactTableFixedColumns = withFixedColumns(ReactTable);

const OptionRow =(props) => {
    if (props.value != 'undefined') {
        return <Col>
            <Row className="text-muted">{props.name} </Row>
            <Row className=" text-dark op-6"> <FormattedValue {...props} /></Row>
        </Col>
    }
}

class PropertyAnalyzeCompsReport extends Component {
    constructor(props) {
        super(props);
    }


    getColumns (properties) {
        let columns = [];
        columns.push({
            Header: "Features",
            accessor: ""
        })
        let headers = Object.keys(properties[0]);
        headers.forEach(key => {
          columns.push({
            Header: key,
            accessor: key
          })
        })
      
        return columns;
      }
       
    renderTable(comps, columns, type) {
        let radiusID = "";
        let maxComps = "";
        let maxDays = "";
        let minComps = "";

        if (type == "rental") {
            radiusID = "rental_max_dist";
            maxComps = "rental_max_num_props";
            maxDays = "rental_max_days";
            minComps = "rental_min_num_props";
        } else if (type == "property") {
            radiusID = "comp_max_dist";
            maxComps = "comp_max_num_props";
            maxDays = "comp_max_days";
            minComps = "comp_min_num_props";
        }

        return <Row>
                    {/* <CardBody>
                        <Row>
                            <OptionRow name='Radius' value={this.props.assumptions[radiusID]}  />
                            <OptionRow name='Max Days' value={this.props.assumptions[minComps]} />
                        </Row>
                    </CardBody> */}
                    <CardBody>
                        <ReactTable className="-striped -highlight" data={comps} columns={columns}
                            pageSize={comps.length} showPagination={false}  showPaginationBottom={false}
                            showPageSizeOptions={false}
                        />
                    </CardBody>
                </Row>
    }

    render() {
        const property = this.props.property;

        if (!property) {
            return <Card>
              <CardTitle className="bg-danger border-bottom p-3 mb-0 text-white">Property Not Selected</CardTitle>
            </Card>;
        }
        const cma = property.cma.cma;

        const subjectProperty = cma.subject_property;
        const propertyComps = cma.cma_comps;
        const rentalComps = cma.cma_rentals;
        const assumptions = this.props.assumptions;

        const propertyRadius = assumptions.comp_max_dist;
        const rentalRadius = assumptions.rental_max_dist;
        
        const columns = [
            {
                Header: "Address",
                accessor: "address",
                minWidth: 300
              },
              {
                Header: "Type",
                accessor: "mp_style_name",
                minWidth: 200
              },
              {
                Header: "Beds",
                accessor: "bed",
                maxWidth: 60
              },
              {
                Header: "Bath",
                accessor: "bath",
                Cell: props => parseFloat(props.value),
                maxWidth: 60
              },
              {
                Header: "SqFt",
                accessor: "sqft",
                Cell: props => props.value.toLocaleString('en')
              },
              {
                Header: "Price",
                accessor: "price",
                Cell: props => <Currency value={props.value}/>
              },
              {
                Header: "Year",
                accessor: "year",
              },
              {
                Header: "Miles",
                accessor: "miles",
                Cell: props => props.value.toFixed(2)
              },
              {
                Header: "Price/sqft",
                accessor: "price_sqft",
                Cell: props => <Currency value={props.value} decimals={2}/>
              },
        ];

        return <div>
                    <Row>
                        <Col md={12}>
                            {this.renderTable(propertyComps, columns, "property")}
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            {this.renderTable(rentalComps, columns, "rental")}
                        </Col>
                    </Row>
            </div>
    }     
}


      
  export default PropertyAnalyzeCompsReport;