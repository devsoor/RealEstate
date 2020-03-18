import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Nav, NavItem, ButtonGroup, Button, Label, FormGroup, Input} from 'reactstrap';

import {IMGPATH} from '../../api/PropertyApi';
import './property.css';
import Switch from 'react-bootstrap-switch';
import { O_WRONLY } from 'constants';
import BootstrapTable from 'react-bootstrap-table-next';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { Currency } from '../common/Format';
import {MapContainerComps} from '../map/MapComps';
import { withScriptjs, withGoogleMap, GoogleMap, Marker, InfoWindow, Circle } from "react-google-maps"
//const googleApiKey = 'AIzaSyAwtYJhBWHqxiV27OgdXUyr2KklYVTsulQ'; // prod key
// const googleApiKey = 'AIzaSyBT6koyESZ1xjk7XJKcUdEa7AKgTwfAa3g'; // dev key
const googleApiKey = process.env.REACT_APP_GOOGLE_API;

class PropertyComps extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rSelected: 1,
            radius: 3,
            highlightedResult: {},
            assumptions: this.props.assumptions
        };
        this.onRadioBtnClick = this.onRadioBtnClick.bind(this);
        this.highlightResult = this.highlightResult.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }
    onRadioBtnClick(rSelected) {
        this.setState({ rSelected });
    }

    highlightResult = (result) => {
        if (result) {
            this.setState({highlightedResult: result});
        }
    }
    handleChange = (e) => {
        let assumptions = {...this.state.assumptions};
        assumptions[e.target.id] = e.target.value;
        this.setState({assumptions});
    }
    handleAssumptionsChanged = () => {        
        const assumptions = {...this.state.assumptions};
        this.props.onAssumptionsChanged(assumptions);
    }


    renderTable(comps, columns, type) {
        let radiusID = "";
        let maxComps = "";
        let maxDays = "";

        if (type == "rental") {
            radiusID = "rental_max_dist";
            maxComps = "rental_max_num_props";
            maxDays = "rental_max_days";
        } else if (type == "property") {
            radiusID = "comp_max_dist";
            maxComps = "comp_max_num_props";
            maxDays = "comp_max_days";
        }

        const rowEvents = {
            onClick: (e, row, rowIndex) => {
              this.highlightResult(row);
            },
            onMouseEnter: (e, row, rowIndex) => {
              this.highlightResult(row);
            }
        };
        return <Row>
                {/* <Col xs={6} md={2}>
                    <CardBody>
                        <FormGroup>
                            <Label>Radius (Miles)</Label>
                            <Input type="select" id={radiusID} value={this.state.assumptions[radiusID]} onChange={this.handleChange}>
                                <option>1</option>
                                <option>2</option>
                                <option>3</option>
                                <option>4</option>
                                <option>5</option>
                            </Input> 
                        </FormGroup>
                        <FormGroup>
                            <Label>Max Properties</Label>
                            <Input type="select" id={maxComps} value={this.state.assumptions[maxComps]} onChange={this.handleChange}>
                                <option>3</option>
                                <option>5</option>
                                <option>10</option>
                            </Input> 
                        </FormGroup>
                        <FormGroup>
                            <Label>Max Days</Label>
                            <Input type="select" id={maxDays} value={this.state.assumptions[maxDays]} onChange={this.handleChange}>
                                <option>30</option>
                                <option>60</option>
                                <option>90</option>
                                <option>120</option>
                                <option>180</option>
                            </Input> 
                        </FormGroup>
                        <div className="text-center">
                            <Button color="primary" onClick={this.handleAssumptionsChanged}>Apply</Button>
                        </div>
                    </CardBody>
                </Col> */}
                <Col xs={12} md={10}>
                    <BootstrapTable striped hover
                    bootstrap4={true}
                    keyField="id"
                    data={ comps }
                    columns={ columns }
                    // bordered={ false }
                    tableHeaderClass="mb-0"
                    condensed={true}
                    rowEvents={ rowEvents }
                    />
                </Col>
        </Row>
    }

    render() {
        const property = this.props.property;
        if (!property) {
            return <Card>
              <CardTitle className="bg-danger border-bottom p-3 mb-0 text-white">Property Not Selected</CardTitle>
            </Card>;
        }
        
        const cma = this.props.cma;
        const subjectProperty = cma.subject_property;

        const propertyComps = cma.cma_comps;
        const rentalComps = cma.cma_rentals;

        const assumptions = this.state.assumptions;

        const propertyRadius = assumptions.comp_max_dist;
        const rentalRadius = assumptions.rental_max_dist;

        const numFeatures = 8;
        const columns = [
            {
                dataField: 'address',
                id: "address1",
                text: "Address",
                headerStyle: {
                    backgroundColor: '#CCC',
                    width: '20%'
                },
                style: {
                    backgroundColor: '#DCEFFF'
                }
            },
            {
                dataField: 'ln',
                id: "ln1",
                text: "MLS ID",
                headerStyle: {
                    backgroundColor: '#CCC'
                  }
            },
            {
                dataField: 'mp_style_name',
                id: "mp_style_name1",
                text: "Type",
                headerStyle: {
                    backgroundColor: '#CCC'
                  },
                  sort: true
            },
            {
                dataField: 'bed',
                id: "bed1",
                text: "Beds",
                headerStyle: {
                    backgroundColor: '#CCC'
                  },
                  sort: true
            },
            {
                dataField: 'bath',
                id: "bath1",
                text: "Bath",
                headerStyle: {
                    backgroundColor: '#CCC'
                  },
                  sort: true
            },
            {
                dataField: 'sqft',
                id: "sqft1",
                text: "SqFt",
                headerStyle: {
                    backgroundColor: '#CCC'
                  },
                  formatter: (cell, row) => {
                    return cell.toLocaleString('en')

                },
                sort: true
            },
            {
                dataField: 'price',
                id: "price1",
                text: "Price",
                formatter: (cell, row) => {
                    return <Currency value={cell}/>
                },
                headerStyle: {
                    backgroundColor: '#CCC'
                },
                sort: true
            },
            {
                dataField: 'year',
                id: "year1",
                text: "Year Built",
                headerStyle: {
                    backgroundColor: '#CCC'
                },
                sort: true
            },
            {
                dataField: 'miles',
                id: "miles1",
                text: "Miles",
                formatter: (cell, row) => {
                    return cell.toFixed(2);
                },
                headerStyle: {
                    backgroundColor: '#CCC'
                },
                sort: true
            },
            {
                dataField: 'days',
                id: "days1",
                text: "Days",
                formatter: (cell, row) => {
                    return cell.toFixed(0);
                },
                headerStyle: {
                    backgroundColor: '#CCC'
                },
                sort: true
            },
            {
                dataField: 'price_sqft',
                id: "price_sqft1",
                text: "Price/sqft",
                formatter: (cell, row) => {
                    return <Currency value={cell}  decimals={2}/>
                },
                headerStyle: {
                    backgroundColor: '#CCC'
                },
                sort: true
            },
        ];

        return <div>
            <Row>
                {/* <Nav> */}
                    {/* <NavItem> */}
                        <Row>
                            <CardBody>
                                <ButtonGroup>
                                    <Button
                                        color="secondary"
                                        onClick={() => this.onRadioBtnClick(1)}
                                        active={this.state.rSelected === 1}
                                    >
                                        Sold
                                    </Button>&nbsp;
                                    <Button
                                        color="secondary"
                                        onClick={() => this.onRadioBtnClick(2)}
                                        active={this.state.rSelected === 2}
                                    >
                                        Rentals
                                    </Button>
                                </ButtonGroup>
                            </CardBody>
                        </Row>
                    {/* </NavItem> */}
                {/* </Nav> */}
            </Row>
                    <Row>
                        <CardBody className="bg-info border-bottom p-2 mb-2 text-white">
                                <h4>Subject Property: {subjectProperty.address} </h4>
                                <Row>
                                    {/* <Col>{subjectProperty.address}</Col> */}
                                    <Col>MLS ID: {subjectProperty.ln}</Col>
                                    <Col>Beds: {subjectProperty.bed}</Col>
                                    <Col>Bath: {subjectProperty.bath}</Col>
                                    <Col>Sqft: {subjectProperty.sqft}</Col>
                                    {
                                        this.state.rSelected == 1 &&
                                        <Col>Rent: <Currency value={cma.cma_results.Result_EstMonthlyRent}/></Col>
                                    }
                                    {
                                        this.state.rSelected == 2 &&
                                        <Col>Price: <Currency value={property.price}/></Col>
                                    }
                                    <Col>Year Built: {subjectProperty.year}</Col>
                                    <Col>Miles: 0</Col>
                                    <Col>Price/sqft: <Currency value={subjectProperty.price_sqft}/></Col>
                                </Row> 
                        </CardBody>
                </Row> 
                {/* <Row> */}
                {
                    this.state.rSelected == 1 &&
                    <div>
                            {this.renderTable(propertyComps, columns, "property")}
                            <MapContainerComps results={propertyComps} subjectProperty={subjectProperty} selected={this.state.highlightedResult} radius={propertyRadius}
                                    onMarkerSelected={this.highlightResult}></MapContainerComps>
                    </div>
                }
                {
                    this.state.rSelected == 2 &&
                    <div>
                            {this.renderTable(rentalComps, columns, "rental")}
                            <MapContainerComps results={rentalComps} subjectProperty={subjectProperty} selected={this.state.highlightedResult} radius={rentalRadius}
                                    onMarkerSelected={this.highlightResult}></MapContainerComps>
                    </div>
                }
            {/* </Row> */}
        </div>
    }     
}


      
  export default PropertyComps;