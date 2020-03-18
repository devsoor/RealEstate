import React, {Component} from "react"
import {Card, CardBody, Row, Col, Nav, NavLink, NavItem, TabPane, TabContent } from "reactstrap"
import { getFolioProperty, calculateCmaFolio } from '../../../api/PropertyApi';

import classnames from 'classnames';
import BootstrapTable from 'react-bootstrap-table-next';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

class FolioPropertyPerformance extends Component {
    constructor(props) {
        super(props);
        this.state = {
            portfolio: null,
            activeTab: '1',
            selected_id: null,
        }
    }

    toggle(tab) {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab
            });
        }
    }

    getProperty = async (id) => {
        const portfolio = await getFolioProperty(id);
        this.setState({portfolio:portfolio.folio_property, selected_id:id});
    }

    analyzeFolipProperty(id) {
        this.getProperty(id);
    }

    render() {
        const savedPortfolioList = this.props.savedPortfolioList;

        const columns = [{
            dataField: 'id',
            text: 'Property ID',
            hidden: true
          }, {
            dataField: 'folio_property.property_name',
            text: 'Property Name'
          }, {
            dataField: 'folio_property.address',
            text: 'Address'
          }, {
            dataField: 'folio_property.mp_style',
            formatter: (cell, row) => {
                return this.typeStyleMatches[cell]
            },
            text: 'Type'
        }, {
            dataField: 'folio_property.bedrooms',
            text: 'Bedrooms'
          }, {
            dataField: 'folio_property.bathrooms',
            text: 'Bathrooms'
        }, {
            dataField: 'folio_property.sqft',
            text: 'SqFt'
          },
        ];
          
          const selectRow = {
            mode: 'radio',
            clickToSelect: true,
            bgColor: '#00BFFF',
            cursor: 'pointer',
            hidden: true
          };

          const rowEvents = {
            onClick: (e, row, rowIndex) => {
                this.analyzeFolipProperty(row.id);
            },
            onMouseEnter: (e, row, rowIndex) => {
                console.log(`enter on row with index: ${rowIndex}`);
              }
        };

        return <div>

            <CardBody>
            {
                savedPortfolioList && 
                    <BootstrapTable
                        keyField='id'
                        bootstrap4={true}
                        condensed={true}
                        data={ savedPortfolioList }
                        columns={ columns }
                        selectRow={ selectRow }
                        rowEvents={ rowEvents }
                        />
                }
            </CardBody> 
            <Row>
                <Nav tabs className="font-14 border-info" expand="md">
                    <NavItem>
                            <NavLink className={classnames({ active: this.state.activeTab === '1' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('1'); }}>Description</NavLink>
                    </NavItem>
                    <NavItem >
                            <NavLink className={classnames({ active: this.state.activeTab === '2' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('2'); }}>Performance</NavLink>
                    </NavItem>
                    <NavItem>
                            <NavLink className={classnames({ active: this.state.activeTab === '3' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('3'); }}>Report</NavLink>
                    </NavItem>
                </Nav> 
                <TabContent activeTab={this.state.activeTab}>
                    <TabPane tabId="1">
                                {/* <AggregateResults results={resultsAggregate} cityzip={this.state.rSelected} showPaginateOption={true}/> */}
                    </TabPane>
                    <TabPane tabId="2">
                                {/* <PlotGraph results={resultsAggregate} resultsAll={results} labels={this.state.rSelected} statname="cashFlowStats" chartType={this.state.chartType}
                                title="Cash Flow" formatType="currency" graphType={this.state.graphType} onChangeGraphType={this.handleGraphType} reportMode={false}/> */}
                    </TabPane>
                    <TabPane tabId="3">
                                {/* <PlotGraph results={resultsAggregate} resultsAll={results} labels={this.state.rSelected} statname="capRateStats" chartType={this.state.chartType}
                                title="Cap Rate" formatType="percent" graphType={this.state.graphType} onChangeGraphType={this.handleGraphType} reportMode={false}/> */}
                    </TabPane>
                </TabContent>
            </Row> 
        </div>
    }
    typeStyleMatches = {
        1:'Single Family Residence',
		2:'Town House',
		3:'Condo',
		7:'Multi-Family',
		4:'Manufactured Home',
		10:'Co-Op'
    }
}

export default FolioPropertyPerformance;

