import React, { Component } from 'react';
import { renderToString } from "react-dom/server";

import {
    CardBody, Row, Col, Button, ButtonGroup, Label, Input, Nav, Navbar, NavItem, Modal, ModalHeader, ModalBody, NavLink, TabContent, TabPane, Badge, UncontrolledTooltip
} from 'reactstrap';

import {analyzeProperties, getAssumptions, createReport, updateAssumptions, saveSearchCriteria, getSavedSearch, calculateCmaAnalyze} from '../../api/PropertyApi';
import classnames from 'classnames';
import { withSettings} from "../../api/SettingsProvider";
import Loader from 'react-loader-advanced';
import EditAssumptions from '../cmaAssumptions/EditAssumptions';
import SaveResults from '../search/SaveResults';
import PropertyAnalyzeDetails from './Property/PropertyAnalyzeDetails';
import PropertyAnalyzeComps from './Property/PropertyAnalyzeComps';
import SinglePropertyAnalyzeReport from './Property/SinglePropertyAnalyzeReport';
import MultiPropertyAnalyzeReport from './Property/MultiPropertyAnalyzeReport';
import {MapContainerOffMarket} from '../map/MapOffMarket';
import InputForm from './InputForm';
import AnalyzeResults from './AnalyzeResults';
import ToggleSwitch from '../common/ToggleSwitch/ToggleSwitch';
import jsPDF from "jspdf";
import html2canvas from 'html2canvas';


/* const defaultQuery = {
    selectType:'selectAddressMode'
} */
const getKey = (obj,val) => Object.keys(obj).find(key => obj[key] === val);
class OffMarket extends Component {
    constructor(props) {
        super(props);
         this.state = {
            results: [],
            query: {},
            loading: false,
            page: 1,
            pageSize: 100,
            sort: '-success_criteria',
            filterMode: null,
            editingAssumptions: false,
            assumptions: null,
            cmaOptions: null,
            selectedResults: [],
            lat:null,
            long:null,
            highlightedResult: {},
            successFilter: false,
            selectedFilter: false,
            selectedAll: false,
            propertyDetailID: null,
            activeTab: '1'
        }
        this.analyze = this.analyze.bind(this);
        this.onPageSizeChange = this.onPageSizeChange.bind(this);
        this.editAssumptions = this.editAssumptions.bind(this);
        this.handleAssumptionsChanged = this.handleAssumptionsChanged.bind(this);
        this.closeAssumptions = this.closeAssumptions.bind(this);   
        this.handleSuccessFilter = this.handleSuccessFilter.bind(this);
        this.handleSelectedFilter = this.handleSelectedFilter.bind(this);
        this.toggle = this.toggle.bind(this);

    }

    toggle(tab) {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab
            });
        }
    }
    hardReset = async () => {
        let defaultAssumptions = await getAssumptions();
        let a = defaultAssumptions.parameters;

        this.setState({
            query: {},
            filterMode: null,
            loading: true,
            assumptions: a,
            results: [],
            cmaOptions: defaultAssumptions.options}, () => {
                this.analyze();
            });
    }
    softReset = async (query, assumptions) => {
        let defaultAssumptions = await getAssumptions();
        let a = Object.assign(defaultAssumptions.parameters, assumptions);
        this.setState({
            query: {},
            filterMode: null,
            loading: true,
            assumptions: a,
            results: [],
            cmaOptions: defaultAssumptions.options}, () => {
                this.analyze();
            });
    }

    componentDidMount = async () => {
        const id = this.props.match.params.id;
        if (id) {
            const savedsearch = await getSavedSearch(id);
            const query = savedsearch.query;
            const assumptions = savedsearch.assumptions;
            this.softReset(query, assumptions);
        }
        else {
            this.softReset();
        }
    }
    highlightResult = (result) => {
        if (result) {
            this.setState({highlightedResult: result});
        }
    }
 
    handleQueryChange = (id, value) => {
        let query = {...this.state.query};
        query[id] = value;
        this.setState({query});
    } 

    handleAnalyzeSubmit = () => {
        // const query = this.state.query;
        // this.setState({query}, () => {
            this.analyze();
        // });

    }

    handleAssumptionUpdated = (id, newValue) => {
        this.setState((prevState) => {
            const newAssumptions = prevState.assumptions;
            newAssumptions[id] = newValue;
            return {assumptions: newAssumptions};
        })
    }
    editAssumptions() {
        this.setState({ editingAssumptions: true });
      }
    
    closeAssumptions() {
        this.setState({ editingAssumptions: false });
    }
    
    handleAssumptionsChanged = (assumptions) => {
        this.setState({editingAssumptions: false, assumptions}, () => {
            this.analyze();
        }); 
    }
    updateArray = (list, index,newResult) => {
        // updates the results array without mutating it
           return [
             ...list.slice(0, index),
             list[index][1] = newResult,
            ...list.slice(index + 1)
          ];
     };

    handleResultUpdate = (propertyId, options, newAssumptions) => {
        const results = this.state.results.hits;
        const result = results.find((r)=>r.listing_id === propertyId);
        const index = results.indexOf(result);

        if (result) {
            calculateCmaAnalyze(result, options, newAssumptions).then((cma)=> {
                const update = {
                    cma: cma,
                    assumptions: newAssumptions
                };
                let newResult = Object.assign({}, result, update);
                // this.handlePropertyDetail(newResult);
                this.setState({propertyDetailID:newResult})

                const newResults = Object.assign(this.state.results, {hits: this.updateArray(results, index, newResult)});

                this.setState({
                    results:newResults
                });
            })
        }
    }

    handleFilterResults = (filterMode) => {
        if (filterMode === "successful") {
            this.setState({filterMode: filterMode}, () => this.analyze());
        }
        else if (filterMode === "selected") {
            const filteredResults = this.state.results.hits.filter((result) => {
                return this.state.selectedResults.includes(result);
            });
            const newResults = this.state.results;
            newResults.hits = filteredResults;
            newResults.total = filteredResults.length;
            this.setState({filterMode: filterMode, results: newResults});
        }
        else {
            this.setState({filterMode: null}, () => this.analyze());
        }
    }

    handleSortResults = (sortMode) => {
        this.setState({sort: sortMode}, () => {
            this.analyze();
        });
    }
    handleSaveSearch = (savedSearchSettings) => {

        savedSearchSettings.assumptions = this.state.assumptions;
        savedSearchSettings.query = this.state.query;
        return saveSearchCriteria(savedSearchSettings);   
    }

    handleSaveResults = (name, saveMode) => {
        let results = [];
        // save successful results
        if (saveMode === "successful"){
            // push successful results
            results = this.state.results.hits.filter((result) => result.success == true)
        }
        else if (saveMode === "selected") {
            // push selected results
            results = this.state.results.hits.filter((result) => {
                return this.state.selectedResults.includes(result.listing_id);
            })
        }
        else {
            // push all results
            results = this.state.results.hits;
        }
        const report = {
            name: name,
            assumptions: this.state.assumptions,
            properties: results.map((r) => {
                return { details: r._source, cma: r.cma}
            })
        }
        return createReport(report);
    }

    highlightResult = (result) => {
        this.setState({highlightedResult: result});
    }

    onPageSizeChange(event) {
        this.setState({page: 1, pageSize: parseInt(event.target.value)}, () => {
            this.analyze();
        });
      }
      onPageChange(page) {
        this.setState({page}, () => {
            this.analyze(true);
        });
      }

    handleSelection = (selectedResults) => {
        this.setState({selectedResults});
    }

    handlePropertyDetail = (property) => {
        this.toggle('2');
        // Get the property object from results based on property_id
        this.setState({propertyDetailID:property})
    }
    
    multiPropertyReport = () => {
        this.toggle('5');
    }

    getData = (properties) => {
        const data = [];
        properties.map((p)=>{
            var property = [];
            const cma = p.cma.cma
            const cma_results = cma.cma_results;
            const subjectProperty = cma.subject_property;            
            property["listing_id"] = p.listing_id;
            property["address"] = p.address;
            property["street_address"] = p.street_address;
            property["city"] = p.city;
            property["state"] = p.state;
            property["zipcode"] = p.zipcode;
            property["county"] = p.county;
            property["mp_style_name"] = p.style_name;
            property["bedrooms"] = p.bedrooms;
            property["bathrooms"] = p.bathrooms;
            property["sqft"] = p.sqft;
            property["price"] = p.price;
            property["price_sqft"] = subjectProperty.price_sqft;
            property["rent_sqft"] = subjectProperty.rent_sqft;
            property["year_built"] = p.year_built;
            property["Result_EstMonthlyRent"] = cma_results.Result_EstMonthlyRent;
            property["Result_EstMarketValue"] = cma_results.Result_EstMarketValue  ? cma_results.Result_EstMarketValue : 0;
            property["Result_CashFlow"] = cma_results.Result_CashFlow;
            property["Result_CapRate"] = cma_results.Result_CapRate;
            property["Result_CashOnCashReturn"] = cma_results.Result_CashOnCashReturn;
            property["Result_RentValueRatio"] = cma_results.Result_RentValueRatio;
            property["criteria_result"] = cma_results.criteria_result;
            property["criteria_value"] = cma_results.criteria_value;
            data.push(property);
        });

        this.setState({data});
        return data;
    }   
    multiPropertyReportAll = () => {
        var selectedResults = [];
        var data = [];
        if (this.state.results) {

            for (let r of Object.values(this.state.results.hits)) {
                data.push(r);
            }
            selectedResults = this.getData(data);
            this.setState({selectedResults});
            this.toggle('5');
        }
    }

    handleEmail = (id) => {
        console.log("Send email to client")
    }


    handleSuccessFilter(event) {
        const filterstate = event.enabled ? "successful" : null
        this.setState({successFilter: event.enabled})
        this.handleFilterResults(filterstate);
    }
    handleSelectedFilter(event) {
        var filterstate = "";
        if (event.enabled) {
            filterstate = "selected" 
        } else {
            filterstate = this.state.successFilter ? "successful" : null
        }
        // const filterstate = event.enabled ? "selected" : null
        this.setState({selectedFilter: event.enabled})
        this.handleFilterResults(filterstate);
    }
    async analyze() {
        await this.setState({loading:true, selectedResults: []})
        const analyzeRequest = {...this.state.query};

        let cmaOptions = this.state.cmaOptions;
        cmaOptions["cma_properties"] = "true";
        cmaOptions["market_value"] = "true";
        this.setState({cmaOptions});
        const from = (this.state.page - 1) * this.state.pageSize;
    
        analyzeRequest.from = from;
        analyzeRequest.size = this.state.pageSize;
        analyzeRequest.sort = this.state.sort;   

        const cmaAssumptions = {
            options: this.state.cmaOptions,
            parameters: this.state.assumptions
        }

        analyzeProperties(analyzeRequest, this.state.filterMode, cmaAssumptions)
            .then((data)=> {
                let properties = data.hits;
                this.setState({ results: properties, loading: false });
                // this.buildResultsTable(properties.hits);
            })
            .catch((err) => {
                console.log(err)
                this.setState({ results: [], loading: false });
            })
            .finally(() => {
                this.setState({loading: false})
            })
    }
    render() {
        const results = this.state.results && (this.state.results ? this.state.results.hits : []);
        const totalHits = this.state.results && (this.state.results.total ? this.state.results.total : 0);
    
        const totalSuccess = this.state.results && (this.state.results.totalSuccess ? this.state.results.totalSuccess : 0);
        const totalPages = Math.ceil(totalHits/this.state.pageSize);
        const totalSelected = this.state.selectedResults && this.state.selectedResults.length;

        const resultsOnPage = results && results.length;
    
        const cmaExceeded = this.state.results && (this.state.results && this.state.results.cma_exceeded);
        const maxCma = this.state.results && (this.state.results && this.state.results.max_cma);
        const totalHitsComma = totalHits ? totalHits.toLocaleString() : 0;
        const totalSuccessComma = totalSuccess ? totalSuccess.toLocaleString() : 0;
        const totalSelectedComma = totalSelected ? totalSelected.toLocaleString() : 0;
        
        const propertyRadius = 20;

        return <div>
            <CardBody>
                    <Nav tabs className="font-14 border-info">
                        <NavItem>
                            <NavLink className={classnames({ active: this.state.activeTab === '1' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('1'); }}>Analyze</NavLink>
                        </NavItem>
                        <NavItem >
                            <NavLink className={classnames({ active: this.state.activeTab === '2' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('2'); }}>Property Details</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className={classnames({ active: this.state.activeTab === '3' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('3'); }}>Comps</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className={classnames({ active: this.state.activeTab === '4' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('4'); }}>Report</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className={classnames({ active: this.state.activeTab === '5' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('5'); }}>Portfolio Report</NavLink>
                        </NavItem>
                    </Nav> 
                </CardBody>
                <TabContent activeTab={this.state.activeTab}>
                    <TabPane tabId="1">
                        <Loader show={this.state.loading} message={'loading'}>
                            <Row>
                                <Col xs={12} md={12}>
                                    <InputForm query={this.state.query} onQueryChange={this.handleQueryChange} onSubmit={this.handleAnalyzeSubmit} onClearAll={this.hardReset} radius={propertyRadius}/>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12} md={6}>
                                    <div>
                                        <MapContainerOffMarket results={results} selected={this.state.highlightedResult} radius={propertyRadius}
                                                onMarkerSelected={this.highlightResult}></MapContainerOffMarket>
                                    </div>
                                </Col>
                                <Col xs={6} md={6} id="right">
                                    <Nav fill expand="md">
                                        <NavItem>
                                            <Label>Total: </Label><Badge color="secondary"><div className="badge-font">{totalHitsComma}</div></Badge>
                                        </NavItem>
                                        <NavItem>
                                            <Row>
                                                <ToggleSwitch enabled={this.state.successFilter} theme='graphite-small' onStateChanged={this.handleSuccessFilter}/>&nbsp;
                                                Success: &nbsp;
                                                <Badge color="secondary"><div className="badge-font">{totalSuccessComma}</div></Badge>
                                            </Row>
                                        </NavItem>
                                        <NavItem>
                                            {
                                                this.state.selectedResults &&
                                                <Row>
                                                    <ToggleSwitch enabled={this.state.selectedFilter} theme='graphite-small' onStateChanged={this.handleSelectedFilter}/>&nbsp;
                                                    Selected: &nbsp;
                                                    <Badge color="secondary"><div className="badge-font">{totalSelectedComma}</div></Badge>
                                                </Row>
                                            }
                                        </NavItem>
                                        <NavItem>
                                            <ButtonGroup className="pull-right" >
                                                <UncontrolledTooltip placement="top" target="editAssumptions">
                                                    Enter Investment Criteria
                                                </UncontrolledTooltip>
                                                <UncontrolledTooltip placement="top" target="multiPropertyReport">
                                                    Create selected properties report
                                                </UncontrolledTooltip>
                                                <UncontrolledTooltip placement="top" target="multiPropertyReportAll">
                                                    Create report for all properties
                                                </UncontrolledTooltip>
                                                <Button id="editAssumptions" size="lg" className="mdi mdi-settings" outline style={{border:0}} onClick={this.editAssumptions}> </Button>
                                                <Button id="multiPropertyReport" size="lg" className="mdi mdi-book-open-variant" outline style={{border:0}} onClick={this.multiPropertyReport}> </Button>
                                                <Button id="multiPropertyReportAll" size="lg" className="mdi mdi-book-multiple-variant" outline style={{border:0}} onClick={this.multiPropertyReportAll}> </Button>
                                            </ButtonGroup>
                                        </NavItem>
                                    </Nav>
                                        <hr />
                                        <Row>
                                            <Col>
                                                <AnalyzeResults results={results}
                                                    selected={this.state.selectedResults}
                                                    highlighted={this.state.highlightedResult}
                                                    onHoverChanged={this.highlightResult}
                                                    onMouseClick={this.handlePropertyDetail}
                                                    // onAssumptionsChanged={this.handleResultUpdate}
                                                    onSelectionChanged={this.handleSelection}
                                                    cmaExceeded={cmaExceeded}
                                                    maxCma={maxCma} />
                                            </Col>
                                        </Row>
                                    <Modal isOpen={this.state.editingAssumptions} size="lg" className="edit-assumptions-modal">
                                        <ModalHeader>
                                            Invest Criteria
                                        </ModalHeader>
                                        <ModalBody>
                                                <EditAssumptions assumptions={this.state.assumptions} onAssumptionsChange={this.handleAssumptionsChanged}
                                                    onAssumptionsCancel={this.closeAssumptions} submitButtonText="Apply" type="user" />
                                        </ModalBody>
                                    </Modal>
                                </Col>
                            </Row>
                        </Loader>
                    </TabPane>
                    <TabPane tabId="2">
                        <Loader show={this.state.loading} message={'loading'}>
                            <PropertyAnalyzeDetails property={this.state.propertyDetailID} assumptions={this.state.assumptions} onAssumptionsChanged={this.handleResultUpdate} />
                        </Loader>
                    </TabPane>
                    <TabPane tabId="3">
                        <PropertyAnalyzeComps property={this.state.propertyDetailID}  assumptions={this.state.assumptions} onAssumptionsChanged={this.handleResultUpdate} onAssumptionUpdate={this.handleAssumptionUpdated}/>                                
                    </TabPane>
                    <TabPane tabId="4">
                         <SinglePropertyAnalyzeReport property={this.state.propertyDetailID} assumptions={this.state.assumptions} onEmail={this.handleEmail} />
                    </TabPane>
                    <TabPane tabId="5">
                         <MultiPropertyAnalyzeReport results={this.state.selectedResults} assumptions={this.state.assumptions} onEmail={this.handleEmail}
                            totalSelected={totalSelected} totalSuccess={totalSuccess} resultsOnPage={resultsOnPage}/>
                    </TabPane>
                </TabContent>
           
        </div>
    }



}

export default withSettings(OffMarket);