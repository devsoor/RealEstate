import React, {Component} from 'react';
import { Row, Col, Card, CardBody, CardFooter, Button, ButtonGroup, Form, FormGroup, Input, Nav, Navbar, NavItem, NavLink,
	TabContent, TabPane, Label, UncontrolledTooltip} from 'reactstrap';
import {withSettings} from "../../../../api/SettingsProvider";
import { withRouter} from 'react-router-dom';
import {searchBulkProperties, searchProperties, getAssumptions, getSearchOptions, getTotalActives} from '../../../../api/PropertyApi';
import Loader from 'react-loader-advanced';
import {countyCities} from "../../stats/data.jsx.js";
import ReactTable from "react-table";
import "react-table/react-table.css";
import _ from "lodash";
import classnames from 'classnames';
import AggregateResults from "./AggregateResults";
import PlotGraph from "./PlotGraph";
import AnalysisReport from "./AnalysisReport";

const defaultQuery = {
	distance: 2,
	searchType: "location",
	style: ["1"],
	max_price: "500000",
	min_beds: "3",
	max_beds: "3",
	searchType: "location",
	bank_owned: "exclude",
	short_sale: "exclude",
	fixer: "exclude",
	new_construction: "exclude",
	locations: {}
  }

function validateZipCode(elementValue){
	var zipCodePattern = /^\d{5}$/;
	 return zipCodePattern.test(elementValue);
}
class MarketDashboard extends Component {
	constructor(props) {
		super(props);
		this.state = {
			query: defaultQuery,
			loading: false,
			pageSize: 1000,
			options: null,
			cmaOptions: null,
			filterMode: null,
			countyList: [...new Set(countyCities.map(item => item.county))].sort(),
			cityList: [...new Set(countyCities.map(item => item.city))].sort(),
			currentCounty: null,
			activeTab: '1',
			chartType: "bar",
			graphType: "max",
			assumptions: null,
			totalActive: null,
			rSelected: 'city'
		};
		this.search = this.search.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleLocationChange = this.handleLocationChange.bind(this);
		this.onRadioBtnClick = this.onRadioBtnClick.bind(this);
		this.handleStyle = this.handleStyle.bind(this);
		this.handleValueChange = this.handleValueChange.bind(this);
		this.handleBedChange = this.handleBedChange.bind(this);
		this.handleShowFullList = this.handleShowFullList.bind(this);
		this.toggle = this.toggle.bind(this);
		this.handleGraphType = this.handleGraphType.bind(this);
	}

	toggle(tab) {
		if (this.state.activeTab !== tab) {
				this.setState({
						activeTab: tab
				});
		}
	}

    onRadioBtnClick(rSelected) {
        this.setState({ rSelected });
    }
	componentDidMount() {		
		getSearchOptions().then(val => {
			this.setState({options:val});
		})
		getTotalActives().then(val => {
			this.setState({totalActive:val});
		})
		this.reset();
	}
	reset = async () => {
        let defaultAssumptions = await getAssumptions();
        let a = defaultAssumptions.parameters;

        this.setState({
            query: defaultQuery, 
            filterMode: null,
			loading: false,
			chartType: "bar",
			graphType: "max",
			assumptions: a,
			cmaOptions: defaultAssumptions.options
		});
	}


  	onQueryChange = (id, newValue) => {
		this.setState((prevState) => {
			const newQuery = prevState.query;
			newQuery[id] = newValue;
			return {query: newQuery};
		})
	}	

	setChartType = (type) => {
		this.setState({chartType: type})
	}

	handleGraphType = (type) => {
		this.setState({graphType: type})
	}

	handleValueChange = (id, value) => {
		this.onQueryChange(id, value);
	}

	handleChange = (event) => {
    	this.handleValueChange(event.target.id, event.target.value)
	}

	handleStyle(event) {
		let selected = [];
		selected.push(event.target.value);
		this.handleValueChange(event.target.id, selected);
		if (event.target.value == 7) {
			this.handleValueChange("min_beds", null)
			this.handleValueChange("max_beds", null);
		} else {
			this.handleValueChange("min_beds", "3")
			this.handleValueChange("max_beds", "3");
		}
	 }
	
	handleValueChange = (id, value) => {
    	this.onQueryChange(id, value);
	}
	
	handleRefresh = (e) => {
    this.setState({loading: true})
    this.search();  
    // this.buildTableData();
  }

	handleBedChange(event) {
		const val = this.state.query.style != "7" ? event.target.value : null;
		this.handleValueChange("min_beds", val)
		this.handleValueChange("max_beds", val);
	}
	
  	handleLocationChange(event) {
		var cityList = [];
		if (event.target.id == "county") {
			this.handleValueChange(event.target.id, event.target.value)
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
		this.setState({currentCounty:null});
	}

	search() {
		// let cmaOptions = this.state.cmaOptions;
		// this.setState({cmaOptions});
		const searchRequest = {...this.state.query};
		// this.state.query.style && (searchRequest.style=[this.state.query.style]);
		let cmaOptions = this.state.cmaOptions;
		cmaOptions["aggregate_results"] = "true";
		this.setState({cmaOptions});
		searchRequest.from = 0;
		searchRequest.size = this.state.pageSize;

		const cmaAssumptions = {
				options: this.state.cmaOptions,
				parameters: this.state.assumptions
		}
		searchProperties(searchRequest, "successful", cmaAssumptions)
				.then(data => {
						let properties = data.hits;
						this.setState({ results: properties, loading: false });
						// !this.state.totalActive && this.setState({totalActive: properties.total})
				})
				.catch((err) => {
						console.log(err)
						this.setState({ results: [], loading: false });
				})
				.finally(() => {
						this.setState({loading: false})
				})
		this.setState({refreshed:true});

	}


	getData = (results, name) => { 
		let dataCities = [];
		let dataZips = [];
		if (results) {
			for (let [cityzip,stats] of Object.entries(results)) {
				const statname = Object.keys(stats)[0];
				if (!Object.values(stats[statname]).every(v=>v===0)) {
					validateZipCode(cityzip) ? dataZips.push({"zipcode":cityzip,"stats":stats}) : dataCities.push({"city":cityzip,"stats":stats});
				};
			}
		}
		return (name == 'city' ? dataCities : dataZips);
	} 

	render() {
		const query = this.state.query;	

		const options=this.state.options;
		if (!options) {
			return null;
		}
				
		const results = this.state.results ? this.state.results.hits : [];
		const resultsAggregateCities = this.state.results ? this.getData(this.state.results.aggregate, 'city') : [];
		const resultsAggregateZips = this.state.results ? this.getData(this.state.results.aggregate, 'zipcode') : [];
		const resultsAggregate = this.state.rSelected == 'city' ? resultsAggregateCities : resultsAggregateZips;

		const totalHits = this.state.results ? this.state.results.total : 0;
		const totalSuccess = this.state.results && this.state.results.totalSuccess ? this.state.results.totalSuccess : 0;

		return <div>
				<Card>
					<CardBody>
						<Row className="d-flex">
							<Col sm={12} md={12} className="d-flex">
									<Col>
											<FormGroup>
													<Label>Type</Label>
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
									</Col>
									<Col>
											<FormGroup>
													<Label>Budget</Label>	
													<Input
																id="max_price"
																type="number" 
																placeholder="Maximum price"
																value={query.max_price}
																onChange={this.handleChange} 
															/>
											</FormGroup>
									</Col>
									{ this.state.query.style != 7 && <div>
										<Col>
											<FormGroup>
													<Label>Bedrooms</Label>
													<Input
																id="min_beds"
																type="select" 
																placeholder="Select Beds"
																value={query.min_beds || ''}
																// disabled={query.style == "7" ? true : false}
																onChange={this.handleBedChange} 
															>
															<option>2</option>
															<option>3</option>
															<option>4</option>
													</Input>
											</FormGroup>
										</Col>
										</div>
									}
									<Col>
											<FormGroup>
													<Label>County</Label>
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
									</Col>
									<Col>
											<FormGroup>
													<Label>City</Label>
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
									</Col>
									<Col>
											<FormGroup>
													<Label>Built After</Label>
													<Input
																id="built_after"
																type="select" 
																placeholder="" 
																onChange={this.handleChange}   
																value={query.built_after}
															>
														<option value="">No Min</option>
                            {options.built_after.map(option => <option key={option} value={option}>{option}</option>)}													
													</Input>
											</FormGroup>
									</Col>
									<Col>
											<FormGroup>
													<Label>Built Before</Label>
													<Input
																id="built_before"
																type="select" 
																placeholder="" 
																onChange={this.handleChange}   
																value={query.built_before}
															>
														<option value="">No Min</option>
                            {options.built_after.map(option => <option key={option} value={option}>{option}</option>)}
													</Input>
											</FormGroup>
									</Col>
							</Col>
						</Row>
				</CardBody>
				<CardFooter>
						<ButtonGroup className="pull-right" >
								<UncontrolledTooltip placement="top" target="refresh">
									Get results
								</UncontrolledTooltip>
									<UncontrolledTooltip placement="top" target="refreshAll">
									Reset
								</UncontrolledTooltip> 
								<UncontrolledTooltip placement="top" target="showFullList">
									Show full County list
								</UncontrolledTooltip>
								<UncontrolledTooltip placement="top" target="barchart">
									View Histogram
								</UncontrolledTooltip>
								<UncontrolledTooltip placement="top" target="mapchart">
									View Map
								</UncontrolledTooltip>
								<UncontrolledTooltip placement="top" target="treemapchart">
									View Treemap
								</UncontrolledTooltip>
								<UncontrolledTooltip placement="top" target="bubblechart">
									View Bubble chart
								</UncontrolledTooltip>
								<Button id="barchart" size="lg" className="mdi mdi-chart-bar" outline style={{border:0}} onClick={() => this.setChartType("bar")}> </Button>
								<Button id="mapchart" size="lg" className="mdi mdi-map" outline style={{border:0}} onClick={() => this.setChartType("map")}> </Button>
								<Button id="treemapchart" size="lg" className="mdi mdi-view-dashboard" outline style={{border:0}} onClick={() => this.setChartType("treemap")}> </Button>
								<Button id="bubblechart" size="lg" className="mdi mdi-chart-bubble" outline style={{border:0}} onClick={() => this.setChartType("bubble")}> </Button>
								<Button id="showFullList" size="lg" className="mdi mdi-arrow-expand-all" outline style={{border:0}} onClick={this.handleShowFullList}> </Button>
								<Button id="refreshAll" size="lg" className="mdi mdi-refresh" outline style={{border:0}} onClick={this.handleRefreshAll}> </Button>
								<Button id="refresh" size="lg" className="mdi - mdi-play" outline style={{border:0}} onClick={this.handleRefresh}> </Button>
						</ButtonGroup>
					</CardFooter>
				</Card>
				{/* <CardBody> */}
					<Row  expand="md">
                            <CardBody>
                                <ButtonGroup>
                                    <Button
                                        color="secondary"
                                        onClick={() => this.onRadioBtnClick('city')}
                                        active={this.state.rSelected === 'city'}
                                    >
                                        City
                                    </Button>&nbsp;
                                    <Button
                                        color="secondary"
                                        onClick={() => this.onRadioBtnClick('zipcode')}
                                        active={this.state.rSelected === 'zipcode'}
                                    >
                                        Zip Code
                                    </Button>
                                </ButtonGroup>
                            </CardBody>
                        </Row>
						<CardBody>
								<Loader show={this.state.loading} message={'Loading ...'}>
										{/* <CardBody> */}
											<Nav tabs className="font-14 border-info" expand="md">
													<NavItem>
															<NavLink className={classnames({ active: this.state.activeTab === '1' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('1'); }}>Results</NavLink>
													</NavItem>
													<NavItem >
															<NavLink className={classnames({ active: this.state.activeTab === '2' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('2'); }}>Cash Flow</NavLink>
													</NavItem>
													<NavItem>
															<NavLink className={classnames({ active: this.state.activeTab === '3' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('3'); }}>Cap Rate</NavLink>
													</NavItem>
													<NavItem>
															<NavLink className={classnames({ active: this.state.activeTab === '4' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('4'); }}>Cash on Cash Return</NavLink>
													</NavItem>
													<NavItem>
															<NavLink className={classnames({ active: this.state.activeTab === '5' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('5'); }}>Rents</NavLink>
													</NavItem>
													<NavItem>
															<NavLink className={classnames({ active: this.state.activeTab === '6' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('6'); }}>Report</NavLink>
													</NavItem>
											</Nav> 
											{/* </CardBody> */}
											<TabContent activeTab={this.state.activeTab}>
													<TabPane tabId="1">
																<AggregateResults results={resultsAggregate} cityzip={this.state.rSelected} showPaginateOption={true}/>
													</TabPane>
													<TabPane tabId="2">
																<PlotGraph results={resultsAggregate} resultsAll={results} labels={this.state.rSelected} statname="cashFlowStats" chartType={this.state.chartType}
																title="Cash Flow" formatType="currency" graphType={this.state.graphType} onChangeGraphType={this.handleGraphType} reportMode={false}/>
													</TabPane>
													<TabPane tabId="3">
																<PlotGraph results={resultsAggregate} resultsAll={results} labels={this.state.rSelected} statname="capRateStats" chartType={this.state.chartType}
																title="Cap Rate" formatType="percent" graphType={this.state.graphType} onChangeGraphType={this.handleGraphType} reportMode={false}/>
													</TabPane>
													<TabPane tabId="4">
																<PlotGraph results={resultsAggregate} resultsAll={results} labels={this.state.rSelected} statname="cashOnCashStats" chartType={this.state.chartType}
																title="Cash on Cash" formatType="percent" graphType={this.state.graphType} onChangeGraphType={this.handleGraphType} reportMode={false}/>
													</TabPane>
													<TabPane tabId="5">
															<PlotGraph results={resultsAggregate} resultsAll={results} labels={this.state.rSelected} statname="rentStats" chartType={this.state.chartType}
															title="Rents" formatType="currency" graphType={this.state.graphType} onChangeGraphType={this.handleGraphType} reportMode={false}/>
													</TabPane>
													<TabPane tabId="6">
														<AnalysisReport results={resultsAggregate} resultsAll={results} assumptions={this.state.assumptions} cityzip={this.state.rSelected} totalActive={this.state.totalActive}
														totalSuccess={totalSuccess} query={this.state.query}/>
													</TabPane> 
											</TabContent>
								</Loader>
						</CardBody>
				{/* </CardBody> */}
		</div>
	}
}

export default withRouter(withSettings(MarketDashboard));

