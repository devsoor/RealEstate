import React, {Component} from 'react';
import { Col, Row, Card, CardBody } from 'reactstrap';
import { withRouter} from 'react-router-dom';

import {withSettings} from "../../../../api/SettingsProvider";
import CardDashMetrics from '../../dashboard-components/cardStats/cardDashMetrics.jsx.js'
import MarketMap from '../../dashboard-components/marketMap/marketMap.jsx.js'
import AssumptionsData from '../../../cmaAssumptions/AssumptionsData'
import {searchBulkProperties, searchProperties, getAssumptions, getSavedSearches, getTotalActives} from '../../../../api/PropertyApi';
import SavedSearchData from './SavedSearchData';

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
class MainDashboard extends Component {
	constructor(props) {
		super(props);
		this.state = 	{
			assumptions: null,
			query: defaultQuery,
			cmaOptions: null,
			filterMode: null,
			results: null,
			loading: false,
			refreshed: null,
			assumptions: null,
			highlightedResult: {},
			pageSize: 10,
			maxCashFlow: 0,
			medianPrice: 0,
			savedSearches: null,
			totalActive: null,
			tableResults: []
			}
		this.search = this.search.bind(this);
		this.handleMapRefresh = this.handleMapRefresh.bind(this);
		this.handleTotalActiveRefresh = this.handleTotalActiveRefresh.bind(this);
	}

	componentDidMount = async() => {
		let a = await getAssumptions();
		this.getSavedSearchList();		
		this.reset();
	}

	reset = async () => {
    let defaultAssumptions = await getAssumptions();
		let a = defaultAssumptions.parameters;
		let t = await getTotalActives();

        this.setState({
            query: defaultQuery, 
            selectedResults: [],
            highlightedResult: {},
            page: 1,
            filterMode: null,
            loading: true,
			assumptions: a,
			totalActive: t,
            cmaOptions: defaultAssumptions.options}, () => {
                this.search();
            });
	}
	

	getSavedSearchList = () => {
		getSavedSearches().then((savedSearches) => {this.setState({savedSearches})})
	}

	handleTotalActiveRefresh =() => {
		getTotalActives().then(val => {
			this.setState({totalActive:val});
		})
	}

	handleQueryChange = (id, newValue) => {
		this.setState((prevState) => {
				const newQuery = prevState.query;
				newQuery[id] = newValue;
				return {query: newQuery};
		})
	}

	handleMapRefresh = () => {
		this.search();
		let results =  this.state.results;

		this.setState({refreshed:false});
	}

	handleSearch = (loading) => {
		this.setState({filterMode:"successful", loading}, () => this.search());
	}

	highlightResult = (result) => {
        this.setState({highlightedResult: result});
	}
	
	getTotalActives =() => {
		const query = {};
		query.searchType = "location";
		query.bank_owned = "exclude";
		query.short_sale = "exclude";
		query.fixer = "exclude";
		query.new_construction = "exclude";
		this.setState({query}, () => {
			this.search();
		});

	}

	search() {
		// let cmaOptions = this.state.cmaOptions;
		// this.setState({cmaOptions});
		const searchRequest = {...this.state.query};
		// this.state.query.style && (searchRequest.style=[this.state.query.style]);
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


  render() {
	const savedSearches = this.state.savedSearches && this.state.savedSearches.slice(0, this.state.pageSize);

	const results = this.state.results ? this.state.results.hits.slice(0, this.state.pageSize) : [];
	// this.state.results && console.log("MainDashboard: render: this.state.results = ", this.state.results)

	const totalHits = this.state.results ? this.state.results.total : 0;
	const totalCount = this.state.results ? this.state.results.count : 0;
	const totalHitsComma = totalHits && totalHits.toLocaleString();
	const totalCountComma = totalCount && totalCount.toLocaleString();
	const totalActive = this.state.totalActive && this.state.totalActive.toLocaleString();
	
		return (
			<div> 
			  <CardDashMetrics totalHits={totalActive} totalSuccess={totalHitsComma} totalCount={totalCountComma} medianPrice={this.state.medianPrice} onRefresh={this.handleTotalActiveRefresh}></CardDashMetrics>
				<Row>
					<Col sm={6} md={8}>
						<Card>
							<AssumptionsData assumptions={this.state.assumptions}/>
						</Card>
						<MarketMap results={results} doSearch={this.handleSearch}  doSearchAll={this.reset} assumptions={this.state.assumptions} 
							onMapRefresh={this.handleMapRefresh} selected={this.state.highlightedResult} loading={this.state.loading}
							onMarkerSelected={this.highlightResult} query={this.state.query} onQueryChange={this.handleQueryChange}/>
					</Col>
					<Col sm={6} md={4}>
						<Card>
							<SavedSearchData savedsearches={savedSearches}/>
						</Card>
					</Col>
				
				</Row>
			</div>
		)
	}
}

export default withRouter(withSettings(MainDashboard));
