import React, { Component } from 'react';

import {  Glyphicon } from 'react-bootstrap';
import { Row, Col, Label, Modal, ModalHeader, Button, ModalBody, ModalFooter, Card, CardBody, CardTitle, CardFooter, Nav, Navbar, NavItem, Alert, Badge} from 'reactstrap';

import Loader from 'react-loader-advanced';

import {searchProperties, getAssumptions, createReport, updateAssumptions, saveSearchCriteria, getSavedSearch, calculateCma} from '../../api/PropertyApi';
import {MapContainer} from '../map/Map';
import '../../App.css';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import Pager from '../common/pager/Pager';
import EditAssumptions from '../cmaAssumptions/EditAssumptions';
import SaveResults from './SaveResults';
import FilterResults from './FilterResults';
import './Search.css';
import SortResults from './SortResults';
import { LinkContainer } from "react-router-bootstrap";
import {Link} from "react-router-dom";
import SaveSearchDialog from '../saved-searches/SaveSearchDialog';
import ToggleSwitch from '../common/ToggleSwitch/ToggleSwitch';

const defaultQuery = {
    distance: 2,
}
class Search extends Component {
    initialState = {
        results: null,
        query: defaultQuery,
        page: 1,
        pageSize: 100,
        sort: '-success_criteria',
        filterMode: null,
        loading: false,
        editingAssumptions: false,
        assumptions: null,
        cmaOptions: null,
        isPaneOpenLeft: false,
        selectedResults: [],
        showSaveSearchDialog: false,
        highlightedResult: {},
        successFilter: false,
        selectedFilter: false
    };
    constructor(props) {
        super(props);
        this.state = this.initialState;

        this.search = this.search.bind(this);
        this.onPageChange = this.onPageChange.bind(this);
        this.onPageSizeChange = this.onPageSizeChange.bind(this);
        this.handleAssumptionsChanged = this.handleAssumptionsChanged.bind(this);
        this.editAssumptions = this.editAssumptions.bind(this);
        this.closeAssumptions = this.closeAssumptions.bind(this);
        this.handleSuccessFilter = this.handleSuccessFilter.bind(this);
        this.handleSelectedFilter = this.handleSelectedFilter.bind(this);
    }

    reset = async (query, assumptions) => {
        let defaultAssumptions = await getAssumptions();
        let a = Object.assign(defaultAssumptions.parameters, assumptions);

        this.setState({
            query: query || defaultQuery, 
            selectedResults: [],
            highlightedResult: {},
            page: 1,
            filterMode: null,
            loading: true,
            assumptions: a,
            cmaOptions: defaultAssumptions.options}, () => {
                this.search();
            });
    }

    hardReset = async () => {
        this.setState({query:defaultQuery});
        let defaultAssumptions = await getAssumptions();
        let a = defaultAssumptions.parameters;
        this.setState({
            query: {}, 
            selectedResults: [],
            highlightedResult: {},
            page: 1,
            filterMode: null,
            loading: true,
            assumptions: a,
            cmaOptions: defaultAssumptions.options}, () => {
                this.search();
            });
    }

    softReset = async (query, assumptions) => {
        let defaultAssumptions = await getAssumptions();
        let a = Object.assign(defaultAssumptions.parameters, assumptions);

        var filterstate = ""
        if (this.state.selectedFilter) {
            filterstate = "selected"
        }  else if (this.state.successFilter) {
            filterstate = "successful"
        } else {
            filterstate = null
        }

        this.setState({
            query: query || defaultQuery, 
            selectedResults: [],
            highlightedResult: {},
            page: 1,
            filterMode: filterstate,
            loading: true,
            assumptions: a,
            cmaOptions: defaultAssumptions.options}, () => {
                this.search();
            });
    }

    handleSelection = (selectedResults) => {
        this.setState({selectedResults})
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
        const result = results.find((r)=>r._id === propertyId);
        const index = results.indexOf(result);
        if (result) {
            calculateCma(propertyId, options, newAssumptions).then((cma)=> {
                const update = {
                    cma: cma,
                    assumptions: newAssumptions
                };
                let newResult = Object.assign({}, result, update);
                const newResults = Object.assign(this.state.results, {hits: this.updateArray(results, index, newResult)});
                this.setState({
                    results:newResults
                });
            })
        }
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

    handleFilterResults = (filterMode) => {
        if (filterMode === "successful") {
            this.setState({filterMode: filterMode}, () => this.search());
        }
        else if (filterMode === "selected") {
            const filteredResults = this.state.results.hits.filter((result) => {
                return this.state.selectedResults.includes(result._id);
            });
            const newResults = this.state.results;
            newResults.hits = filteredResults;
            newResults.total = filteredResults.length;
            this.setState({filterMode: filterMode, results: newResults});
        }
        else {
            this.setState({filterMode: null}, () => this.search());
        }
    }

    handleSortResults = (sortMode) => {
        this.setState({sort: sortMode}, () => {
            this.search();
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
                return this.state.selectedResults.includes(result._id);
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
    handleSearchSubmit = () => {
        this.setState({filterMode:this.state.successFilter});
        this.setState({page: 1}, () => this.search());
    }

    handleQueryChange = (id, newValue) => {
        this.setState((prevState) => {
            const newQuery = prevState.query;
            newQuery[id] = newValue;
            return {query: newQuery};
        })
    }
    
    handleAssumptionsChanged = (assumptions) => {
        this.setState({editingAssumptions: false, assumptions}, () => {
            this.search();
        });
    }

  onPageSizeChange(event) {
    this.setState({page: 1, pageSize: parseInt(event.target.value)}, () => {
        this.search();
    });
  }
  onPageChange(page) {
    this.setState({page}, () => {
        this.search(true);
    });
  }
  closeAssumptions() {
    this.setState({ editingAssumptions: false });
  }

  editAssumptions() {
    this.setState({ editingAssumptions: true });
  }

  openSaveSearchDialog = () => {
    this.setState({showSaveSearchDialog: true});
  }
  closeDialog = () => {
    this.setState({showSaveSearchDialog: false});
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

  async search(keepCurrentPage) {
    if (!keepCurrentPage) {
        await this.setState({page:1});
    }

    await this.setState({loading:true, selectedResults: []})

    let cmaOptions = this.state.cmaOptions;
    cmaOptions["cma_properties"] = "true";
    cmaOptions["market_value"] = "true";
    this.setState({cmaOptions});
    const from = (this.state.page - 1) * this.state.pageSize;
    const searchRequest = {...this.state.query};

    searchRequest.from = from;
    searchRequest.size = this.state.pageSize;
    searchRequest.sort = this.state.sort;

    const cmaAssumptions = {
        options: this.state.cmaOptions,
        parameters: this.state.assumptions
    }
    searchProperties(searchRequest, this.state.filterMode, cmaAssumptions)
        .then(data => {
            let properties = data.hits;
            this.setState({ results: properties, loading: false });
        })
        .catch((err) => {
            this.setState({ results: [], loading: false });
        })
        .finally(() => {
            this.setState({loading: false})
        })
  }
  
  render() {
    const results = this.state.results ? this.state.results.hits : [];
    const totalHits = this.state.results ? this.state.results.total : 0;
    const totalSuccess = this.state.results && this.state.results.totalSuccess ? this.state.results.totalSuccess : 0;

    const totalPages = Math.ceil(totalHits/this.state.pageSize);
    const totalSelected = this.state.selectedResults.length;
    const resultsOnPage = results && results.length;

    const cmaExceeded = this.state.results && this.state.results.cma_exceeded;
    const maxCma = this.state.results && this.state.results.max_cma;
    const totalHitsComma = totalHits && totalHits.toLocaleString();
    const totalSuccessComma = totalSuccess && totalSuccess.toLocaleString();
    const totalSelectedComma = totalSelected && totalSelected.toLocaleString();

    return (

        <Loader show={this.state.loading} message={'loading'}>
        <Row>
            <Col xs={6} md={6}>
                <MapContainer results={results} selected={this.state.highlightedResult} searchType={this.state.query.searchType} poi={this.state.query.poi} 
                    radius={this.state.query.distance} onMarkerSelected={this.highlightResult}></MapContainer>
            </Col>
            <Col xs={6} md={6} id="right">
                <Card>
                    <CardBody>
                        <CardBody>
                                <SearchForm query={this.state.query} onQueryChange={this.handleQueryChange} onSubmit={this.handleSearchSubmit}/>
                        </CardBody>
                        <CardFooter>
                                <Row>
                                         <Col md={3}>
                                        <Button color="info" className="mdi mdi-settings" onClick={this.editAssumptions}> Invest Criteria </Button>
                                        </Col>
                                        <Col md={3}>
                                            <SaveResults onSaveResults={this.handleSaveResults} onSaveSearch={this.handleSaveSearch} totalSelected={totalSelected} totalSuccess={totalSuccess} resultsOnPage={resultsOnPage} />
                                        </Col>
                                        <Col md={3}>
                                            <Button color="info" className="mdi mdi-content-save-settings" onClick={() => this.openSaveSearchDialog()}> Save Search</Button>
                                        </Col>
                                        <Col md={3}>
                                            <Button color="danger" className="mdi mdi-notification-clear-all" onClick={this.hardReset}> Clear All</Button>
                                        </Col>
                                </Row>
                        </CardFooter>
                    </CardBody>
                </Card>

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
                </Nav>

                <hr />
                {
                    totalHits && 
                    <Row>
                        <Col md={8}>
                            <SortResults onSortResults={this.handleSortResults} selected={this.state.sort} criteria={this.state.assumptions} />
                        </Col>
                        <Col md={4}>
                            <div className="pull-right">
                            Page Size: <select value={this.state.pageSize} onChange={this.onPageSizeChange}>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            </div>
                        </Col>
                    </Row>
                }
                <Row>
                    <SearchResults results={results} assumptions={this.state.assumptions} 
                        selected={this.state.selectedResults}
                        highlighted={this.state.highlightedResult}
                        onHoverChanged={this.highlightResult}
                        onAssumptionsChanged={this.handleResultUpdate}
                        onSelectionChanged={this.handleSelection}
                        cmaExceeded={cmaExceeded}
                        maxCma={maxCma} />
                </Row>
                <SaveSearchDialog
                    show={this.state.showSaveSearchDialog}
                    onClose={this.closeDialog}
                    onConfirm={this.handleSaveSearch}
                />
                {
                    totalHits && !cmaExceeded &&
                    <Row>
                        <Col md={12} className="text-center">
                            <Pager onChange={this.onPageChange} currentPage={this.state.page} totalPages={totalPages} hideFirstAndLastPageLinks={true} />
                        </Col>
                    </Row>
                }
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
    );
  }
}

export default Search;
