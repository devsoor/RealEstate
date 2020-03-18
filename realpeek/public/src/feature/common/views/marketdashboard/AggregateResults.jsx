import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, ButtonGroup, Container, FormGroup, Input, Nav, Navbar, NavItem, Label, UncontrolledTooltip} from 'reactstrap';
import ReactTable from "react-table";
import "react-table/react-table.css";
import { Currency, PercentDecimal, Percent } from "../../Format";
import _ from "lodash";

class AggregateResults extends Component {
    constructor(props) {
      super(props);
    }
  render() {
    const results = this.props.results;
    const cityzip = this.props.cityzip;
    const hdr = cityzip == "city" ? "City" : "Zip";
    const showPaginateOption = this.props.showPaginateOption;

    return <Card>
            <CardBody>
                  <CardTitle className="bg-info border-bottom p-3 mb-0 text-white"> Average Values</CardTitle>
                  <ReactTable
                      className="-striped -highlight"
                      data={results}
                      columns = {[
                            {
                              id: cityzip,
                              Header: hdr,
                              accessor: cityzip,
                            },
                            {
                              id: 'totalHits',
                              Header: "Properties",
                              accessor: 'stats.totalHits',
                              Footer: (
                                <span>
                                  <strong>Total:</strong>{" "}
                                  {_.round(_.sum(_.map(results, d => d.stats.totalHits)))}
                                </span>
                              ) 
                            },
                            {
                              id: 'cashflow',
                              Header: "Cash Flow",
                              accessor: 'stats.cashFlowStats.mean',
                              Cell: props => <Currency value={props.value}/>,
                              Footer: (
                                <span>
                                  <strong>Average:</strong>{" "}
                                  <Currency value={_.round(_.mean(_.map(results, d => d.stats.cashFlowStats.mean)))}/>
                                </span>
                              ) 
                            },
                            {
                              id: 'caprate',
                              Header: "Cap Rate (%)",
                              accessor: 'stats.capRateStats.mean',
                              Cell: props => <PercentDecimal value={props.value}/>,
                              // Footer: (
                              //   <span>
                              //     <strong>Average:</strong>{" "}
                              //     <Percent value={_.round(_.mean(_.map(results, d => d.stats.capRateStats.mean)))} demimals={2}/>
                              //   </span>
                              // ) 
                            },
                            {
                              id: 'coc',
                              Header: "CoC Return (%)",
                              accessor: 'stats.cashOnCashStats.mean',
                              Cell: props => <PercentDecimal value={props.value}/>,
                              // Footer: (
                              //   <span>
                              //     <strong>Average:</strong>{" "}
                              //     <Percent value={_.round(_.mean(_.map(results, d => d.stats.cashOnCashStats.mean)))} demimals={2}/>
                              //   </span>
                              // ) 
                            },
                            {
                              id: 'r2v',
                              Header: "Rent-to-Value ratio",
                              accessor: 'stats.rent2ValueStats.mean',
                              Cell: props => <PercentDecimal value={props.value}/>,
                            },
                            {
                              id: 'price',
                              Header: "Price",
                              accessor: 'stats.priceStats.mean',
                              Cell: props => <Currency value={props.value}/>,
                              Footer: (
                                <span>
                                  <strong>Average:</strong>{" "}
                                  <Currency value={_.round(_.mean(_.map(results, d => d.stats.priceStats.mean)))}/>
                                </span>
                              ) 
                            },
                            {
                              id: 'rent',
                              Header: "Rent",
                              accessor: 'stats.rentStats.mean',
                              Cell: props => <Currency value={props.value}/>,
                              Footer: (
                                <span>
                                  <strong>Average:</strong>{" "}
                                  <Currency value={_.round(_.mean(_.map(results, d => d.stats.rentStats.mean)))}/>
                                </span>
                              ) 
                            },
                            {
                              id: 'pricesqft',
                              Header: "Price/sqft",
                              accessor: 'stats.priceSqftStats.mean',
                              Cell: props => <Currency value={props.value}/>,
                              Footer: (
                                <span>
                                  <strong>Average:</strong>{" "}
                                  <Currency value={_.round(_.mean(_.map(results, d => d.stats.priceSqftStats.mean)))}/>
                                </span>
                              ) 
                            },
                            {
                              id: 'rentsqft',
                              Header: "Rent/sqft",
                              accessor: 'stats.rentSqftStats.mean',
                              Cell: props => <Currency value={props.value} decimals={2}/>,
                              // Footer: (
                              //   <span>
                              //     <strong>Average:</strong>{" "}
                              //     <Currency value={_.mean(_.map(results, d => d.stats.rentSqftStats.mean))} demimals={2}/>
                              //   </span>
                              // ) 
                            }                                                                                  
                      ]}
                      pageSize={results.length}
                      showPagination={showPaginateOption} 
                      showPaginationBottom={showPaginateOption}
                      showPageSizeOptions={showPaginateOption}
                      style={{fontSize:12}}
                  />
          </CardBody>
        </Card>
  }
}

export default AggregateResults;


