import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, ButtonGroup, Container, FormGroup, Input, Nav, Navbar, NavItem, Label, UncontrolledTooltip} from 'reactstrap';
import { LinkContainer } from "react-router-bootstrap";
import { withRouter} from 'react-router-dom';
import {withSettings} from "../../../../api/SettingsProvider";
import { getSearchOptions } from "../../../../api/PropertyApi";
import Loader from 'react-loader-advanced';
import {Link} from 'react-router-dom'
import {countyCities} from "../../stats/data.jsx.js";
import {MapContainerDashboard} from '../../../map/Map';
import ReactTable from "react-table";
import "react-table/react-table.css";
import { Currency, PercentDecimal, Percent } from "../../Format";
import _ from "lodash";
class MarketMap extends Component {
  constructor(props) {
      super(props);

      this.state = {
        'cSelected': [],
        propertyType: '',
        totalProperties:0,
        options: null,
        loading: false,
        success_criteria: "cash_flow_criteria",
        cma: null,
        mapMode: true,
        countyList: [...new Set(countyCities.map(item => item.county))].sort(),
        cityList: [...new Set(countyCities.map(item => item.city))].sort(),
        tableResults: []
      };
      this.handleChange = this.handleChange.bind(this);
      this.handleStyle = this.handleStyle.bind(this);
      this.handleValueChange = this.handleValueChange.bind(this);
      this.handleLocationChange = this.handleLocationChange.bind(this);
      this.handleBedChange = this.handleBedChange.bind(this);
      this.handleRefresh = this.handleRefresh.bind(this);
      this.handleShowFullList = this.handleShowFullList.bind(this);
    }
  componentDidMount() {
        getSearchOptions().then(val => {
          this.setState({options:val});
        })
  }
  handleChange = (event) => {
    this.handleValueChange(event.target.id, event.target.value)
  }
  handleStyle(event) {
    let selected = [];
    selected.push(event.target.value);
    this.handleValueChange(event.target.id, selected);
 }
  handleValueChange = (id, value) => {
    this.props.onQueryChange(id, value);
  }

  handleLocationChange(event) {
		var cityList = [];
		if (event.target.id == "county") {
			const cities = [];
			countyCities.map(c => {
				c.county == event.target.value && cities.push(c.city)
			})
			cityList = [...new Set(cities.map(item=>item))];
			event.target.id == "county" && this.setState({cityList:cityList.sort()});
			this.setState({currentCounty:event.target.id});
		} else {
			countyCities.map(c=>{
					if (c.city == event.target.value) {
						this.setState({countyList:[c.county]});
					}           
			 })
			 this.setState({cityList:[event.target.value]});
		}
	this.handleValueChange("locations", [{'value': event.target.value, 'type': event.target.id}])
	}

  handleShowFullList() {
    this.setState({countyList: [...new Set(countyCities.map(item => item.county))].sort()});
    this.setState({cityList: [...new Set(countyCities.map(item => item.city))].sort()});
  }
  handleBedChange(event) {
    this.handleValueChange("min_beds", event.target.value)
    this.handleValueChange("max_beds", event.target.value);
  }

  handleRefresh = (e) => {
    this.props.doSearch(true);
  }

  handleRefreshAll = (e) => {
    this.props.doSearchAll();  
  }

  highlightResult = (result) => {
    this.setState({highlightedResult: result});
  }
  getData = (properties) => {
    const data = [];
    properties.map((p)=>{
        var property = [];
        property["listing_id"] = p._source.listing_id;
        property["address"] = p._source.address;
        property["mp_style_name"] = p.mp_style_name;
        property["bedrooms"] = p._source.bedrooms;
        property["bathrooms"] = p._source.bathrooms;
        property["sqft"] = p._source.sqft;
        property["max_price"] = p._source.max_price;
        property["year_built"] = p._source.year_built;
        if (p.cma) {
          const cma = p.cma.cma
          const cma_results = cma.cma_results;
          const subjectProperty = cma.subject_property;     
          property["price_sqft"] = subjectProperty.price_sqft;
          property["rent_sqft"] = subjectProperty.rent_sqft;
          property["Result_EstMonthlyRent"] = cma_results.Result_EstMonthlyRent;
          property["Result_EstMarketValue"] = cma_results.Result_EstMarketValue  ? cma_results.Result_EstMarketValue : 0;
          property["Result_CashFlow"] = cma_results.Result_CashFlow;
          property["Result_CapRate"] = cma_results.Result_CapRate;
          property["Result_CashOnCashReturn"] = cma_results.Result_CashOnCashReturn;
          property["Result_RentValueRatio"] = cma_results.Result_RentValueRatio;
          property["criteria_result"] = cma_results.criteria_result;
          property["criteria_value"] = cma_results.criteria_value;
        }
        data.push(property);
    });

    // this.setState({data});
    return data;
}   
buildTableData = () => {
    var tableResults = [];
    var results = this.props.results;
    var data = [];
    for (let r of Object.values(results)) {
        data.push(r);
    }
    tableResults = this.getData(data);
    this.setState({tableResults, mapMode:false});
}
  render() {
    const query=this.props.query;
    const results=this.props.results;

    const options=this.state.options;
    if (!options) {
      return null;
    }

    return <CardBody style={{height:"40%"}}>
                <Row>
                    <Col md="12">
                      <Nav fill expand="md">

                          <NavItem>
                                <Label>Type</Label>
                                <FormGroup>
                                    <Input
                                          id="style"
                                          type="select" 
                                          placeholder="" 
                                          onChange={this.handleStyle} 
                                          value={query.style || []}
                                        >
                                        {options.styles.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
                                    </Input>
                                </FormGroup>
                          </NavItem>&nbsp;&nbsp;
                          <NavItem>
                                  <Label>Budget</Label>
                                  <FormGroup>
                                      <Input
                                            id="max_price"
                                            type="number" 
                                            placeholder="Maximum price"
                                            value={query.max_price || ''}
                                            onChange={this.handleChange} 
                                          />
                                  </FormGroup>
                                </NavItem>&nbsp;&nbsp;
                          <NavItem>
                                <Label>County</Label>
                                <FormGroup>
                                    <Input
                                          id="county"
                                          type="select" 
                                          placeholder="" 
                                          onChange={this.handleLocationChange} 
                                          value={query.county}
                                        >
                                        {this.state.countyList.map(option => <option key={option} value={option}>{option}</option>)}
                                    </Input>
                                </FormGroup>
                          </NavItem>&nbsp;&nbsp;
                          <NavItem>
                                <Label>City</Label>
                                <FormGroup>
                                    <Input
                                          id="city"
                                          type="select" 
                                          placeholder="" 
                                          onChange={this.handleLocationChange}   
                                          value={query.city}
                                        >
                                        {this.state.cityList.map(option => <option key={option} value={option}>{option}</option>)}
                                    </Input>
                                </FormGroup>
                          </NavItem>&nbsp;&nbsp;
                          <NavItem>
                              <Label>Bedrooms</Label>
                              <FormGroup>
                                  <Input
                                        id="minmaxbeds"
                                        type="select" 
                                        placeholder=""
                                        value={query.min_beds}
                                        onChange={this.handleBedChange} 
                                      >
                                      <option>2</option>
                                      <option>3</option>
                                      <option>4</option>
                                  </Input>
                              </FormGroup>
                            </NavItem>&nbsp;&nbsp;
                            </Nav>
                            <Label>Top 10 properties</Label>
                            <ButtonGroup className="pull-right" >
                                  <UncontrolledTooltip placement="top" target="refresh">
                                      Refresh
                                  </UncontrolledTooltip>
                                  <UncontrolledTooltip placement="top" target="runSearch">
                                      Run Search
                                  </UncontrolledTooltip> 
                                  <UncontrolledTooltip placement="top" target="showmap">
                                      Show properties on a map
                                  </UncontrolledTooltip>
                                  <UncontrolledTooltip placement="top" target="showlist">
                                      Show list of properties
                                  </UncontrolledTooltip>
                                  <UncontrolledTooltip placement="top" target="showFullList">
                                      Show full County list
                                  </UncontrolledTooltip>
                                  <Button id="showFullList" size="lg" className="mdi mdi-arrow-expand-all" outline style={{border:0}} onClick={this.handleShowFullList}> </Button>
                                  <Button id="runSearch" size="lg" className="ti-control-play" outline style={{border:0}} onClick={this.handleRefresh}> </Button>
                                  {/* <Button id="refreshAll" size="lg" className="mdi mdi-refresh" outline style={{border:0}} onClick={this.handleRefreshAll}> </Button> */}
                                  <Button id="showmap" size="lg" className="mdi mdi-map" outline style={{border:0}} onClick={()=>{this.setState({mapMode:true})}}> </Button>
                                  <Button id="showlist" size="lg" className="mdi mdi-format-list-bulleted" outline style={{border:0}} onClick={this.buildTableData}> </Button>
                            </ButtonGroup>
                    </Col>
                </Row>
          <Card style={{height:"40%"}}>
              <Loader show={this.props.loading} message={'Loading ...'}>
                      {
                        this.state.mapMode &&
                          <MapContainerDashboard results={results} selected={this.props.selected} searchType={query.searchType} radius={query.distance} onMarkerSelected={this.props.onMarkerSelected}></MapContainerDashboard>
                      }
                      {
                        !this.state.mapMode &&
                        <ReactTable
                              className="-striped -highlight"
                              data={this.state.tableResults} 
                              columns = {[
                                    {
                                      Header: "Address",
                                      accessor: "address",
                                      minWidth: 300
                                      // Cell: cell => {
                                      //   return (
                                      //     <Link> <div className="styled" /> </Link>
                                      //   );
                                      // }
                                    },
                                    {
                                      Header: "MLS ID",
                                      accessor: "listing_id",
                                      minWidth: 100
                                    },
                                    {
                                      Header: "Criteria",
                                      accessor: "criteria_value",
                                      width: 100,
                                      Cell: row => (
                                        <div
                                          style={{
                                            width: "100%",
                                            minWidth: "5px",
                                            height: "20px",
                                            backgroundColor: row.value >= 0 ? '#00ff00' : '#ff0000',
                                            borderRadius: "2px",
                                            transition: "all .4s ease"
                                          }}
                                        />
                                      )
                                    },
                                    {
                                      Header: "Cash Flow",
                                      accessor: "Result_CashFlow",
                                      Cell: props => <Currency value={props.value}/> 
                                    },
                                    {
                                      Header: "Cap Rate (%)",
                                      accessor: "Result_CapRate",
                                      Cell: props => <PercentDecimal value={props.value}/>,
                                    },
                                    {
                                      Header: "CoC Return (%)",
                                      accessor: "Result_CashOnCashReturn",
                                      Cell: props => <PercentDecimal value={props.value}/>
                                    },
                                    {
                                      Header: "Rent-to-Value ratio",
                                      accessor: "Result_RentValueRatio",
                                      Cell: props => <PercentDecimal value={props.value}/>
                                    }
                              ]}
                              pageSize={this.state.tableResults.length}
                              showPagination={false} 
                              showPaginationBottom={false}
                              showPageSizeOptions={false}
                          />
                      }
                </Loader>
            </Card>
        </CardBody> 
  }
}

export default withRouter(withSettings(MarketMap));


