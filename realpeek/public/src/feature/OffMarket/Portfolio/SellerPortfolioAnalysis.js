import React, {Component} from "react"
import {Card, CardBody, Row, Col, Nav, NavLink, NavItem, TabPane, TabContent, Button, ButtonGroup,
    FormGroup, Label, Input, CustomInput } from "reactstrap"

import { getAssumptions, getFolioProperties, analyzeFolio } from '../../../api/PropertyApi';
import LoaderButton from "../../common/LoaderButton/LoaderButton";
import Loader from 'react-loader-advanced';
import {MapContainerOffMarket} from '../../map/MapOffMarket';
import FolioPropertyPerformance from './FolioPropertyPerformance';
import FolioResultsAggregate from './FolioResultsAggregate';
import classnames from 'classnames';
class SellerPortfolioAnalysis extends Component {
    constructor(props) {
        super(props);
        this.state = {
            results: null,
            assumptions: null,
            portfolio: null,
            loading: false,
            loadingFolio: false,
            savedPortfolioList: null,
            highlightedResult: {},
            activeTab: '1',
            'cSelected': [],
            checked: true
        }

        this.onCheckboxBtnClick = this.onCheckboxBtnClick.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.analyze = this.analyze.bind(this);

    }

    componentDidMount = async () => {
        let defaultAssumptions = await getAssumptions();
        let a = defaultAssumptions.parameters;

        this.setState({
            loadingFolio: true,
            assumptions: a,
            savedPortfolioList: null}, () => {
                this.loadPortfolioList();
            });

    }

    toggle(tab) {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab
            });
        }
    }

    toggleCheckButton(tab) {
        if (this.state.selectedAll !== tab) {
            this.setState({
                activeTab: tab
            });
        }
    }

    onCheckboxBtnClick(selected) {
        console.log("onCheckboxBtnClick: selected = ", selected)
        const index = this.state.cSelected.indexOf(selected);
        if (index < 0) {
          this.state.cSelected.push(selected);
        } else {
          this.state.cSelected.splice(index, 1);
        }
        // this.setState({ 'cSelected': [...this.state.cSelected] });
        console.log("onCheckboxBtnClick: this.state.cSelected = ", this.state.cSelected)
        this.setState({
            'cSelected': [...this.state.cSelected]}, () => {
                this.analyze();
        });

    }

    selectAllProperties = () => {
        var selectedList = [];
        this.state.savedPortfolioList.map(k => {
            selectedList.push(k.id)
        })
        console.log("selectAllProperties: selectedList = ", selectedList)

        this.setState({ 'cSelected': selectedList });
    }
    handleSelectAll = (e) => {
        this.setState({ checked: e.target.checked })
        console.log("handleSelectAll: e.target.checked = ", e.target.checked)
        if (e.target.checked) {
            this.selectAllProperties();
            // this.state.savedPortfolioList.map(k => {
            //     selectedList.push(k.id)
            // })
        } else {
            this.setState({ 'cSelected': [] });
        }

    }
    loadPortfolioList = async() => {
        this.setState({loadingFolio: true});
        getFolioProperties().then((savedPortfolioList) => {
            console.log("loadPortfolioList: savedPortfolioList = ", savedPortfolioList)
            this.setState({savedPortfolioList})
        })
        .finally(() => {
            this.setState({loadingFolio: false});
            this.selectAllProperties();
            this.setState({
                loading: true,
                results: []}, () => {
                    this.analyze();
            });
        })

    }

    highlightResult = (result) => {
        if (result) {
            this.setState({highlightedResult: result});
        }
    }

    async analyze() {
        console.log("analyze: ENTER this.state.cSelected = ", this.state.cSelected)

        await this.setState({loading:true})
        var propertyList = [];
        Object.values(this.state.cSelected).forEach(p =>{
            propertyList.push(p)
        })
        // const propertyList = this.state.cSelected;
        console.log("analyze: propertyList = ", propertyList)

        const folioParams = {
            property_ids: propertyList,
            assumptions: this.state.assumptions
        }

        analyzeFolio(folioParams)
            .then((data)=> {
                let properties = data.hits;
                console.log("analyzeFolio: properties = ", properties)
                this.setState({ results: properties, loading: false });
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
        const savedPortfolioList = this.state.savedPortfolioList;
        const results = this.state.results ? this.state.results.hits : [];

        console.log("render: results = ", results)

        const propertyRadius = 20;

        // return <Loader show={this.state.loading} message={'loading'}><div>
        return <div>
                <CardBody>
                    <Nav tabs className="font-14 border-info">
                        <NavItem>
                            <NavLink className={classnames({ active: this.state.activeTab === '1' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('1'); }}>Portfilio Performance</NavLink>
                        </NavItem>
                        <NavItem >
                            <NavLink className={classnames({ active: this.state.activeTab === '2' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('2'); }}>Property Performance</NavLink>
                        </NavItem>
                        <NavItem >
                            <NavLink className={classnames({ active: this.state.activeTab === '3' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('3'); }}>Report</NavLink>
                        </NavItem>
                    </Nav> 
                </CardBody>
                <TabContent activeTab={this.state.activeTab}>
                    <TabPane tabId="1">
                        {/* <Row> */}
                            {/* <Col sm={12} md={12}> */}
                                <CardBody>
                                    {
                                        savedPortfolioList &&
                                        <Row>
                                            
                                                <CustomInput
                                                    type="checkbox"
                                                    id="cb-2"
                                                    checked={this.state.checked}
                                                    onChange={this.handleSelectAll}
                                                />
                                                <Label>Select All</Label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                <ButtonGroup>
                                                    {savedPortfolioList.map(k => {
                                                        return <Button
                                                        outline
                                                        color="primary"
                                                        onClick={() => this.onCheckboxBtnClick(k.id)}
                                                        active={this.state.cSelected.includes(k.id)}
                                                        style={{marginRight:5}}
                                                        >
                                                        {k.folio_property.property_name}
                                                    </Button>
                                                    })}
                                                </ButtonGroup>
                                        </Row>
                                    }
                                </CardBody>
                                <CardBody>
                                    <FolioResultsAggregate results={results} />
                                </CardBody>
                            {/* </Col> */}
                            {/* <Col sm={12} md={6}>
                                <MapContainerOffMarket results={savedPortfolioList} selected={this.state.highlightedResult} radius={propertyRadius}
                                        onMarkerSelected={this.highlightResult}></MapContainerOffMarket>
                            </Col> */}
                        {/* </Row> */}
                    </TabPane>
                    <TabPane tabId="2">
                        <FolioPropertyPerformance savedPortfolioList={savedPortfolioList}/>
                    </TabPane>
                    <TabPane tabId="3">
                            Report Aggregate
                    </TabPane>
                </TabContent>
        </div>
    }

}

export default SellerPortfolioAnalysis;
