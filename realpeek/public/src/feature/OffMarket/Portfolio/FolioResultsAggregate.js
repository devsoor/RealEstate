import React, {Component} from "react"
import { Row, Col, Card, CardBody, CardTitle, Button, ButtonGroup, Form, FormGroup, Input, Nav, Navbar, NavItem, NavLink,
	TabContent, TabPane, Label, UncontrolledTooltip} from 'reactstrap';
import Loader from 'react-loader-advanced';
import classnames from 'classnames';
import ReactTable from "react-table";
import { Currency, PercentDecimal, Percent } from "../../common/Format";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { HorizontalBar, Bar, Radar, Pie, Polar, Doughnut } from 'react-chartjs-2';
import 'chartjs-plugin-datalabels';
import _ from "lodash";

var randomColorGenerator = function () { 
    return '#' + (Math.random().toString(16) + '0000000').slice(2, 8); 
};
class FolioResultsAggregate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            activeTab: '1',
            rSelected: 'current'
        }
        this.toggle = this.toggle.bind(this);
        this.onRadioBtnClick = this.onRadioBtnClick.bind(this);
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
    getGraphValues(results, item, type) {
        const values = [];
        Object.values(results).forEach(r => {
            for (let [key, value] of Object.entries(r.cma.cma_results)) {
                if (key == item) {
                    values.push(value)
                }
            }
        })
        return values;
    }

    getGraphLabels(results, item, type) {
        const labels = [];
        Object.values(results).forEach(r => {
            for (let [key, value] of Object.entries(r.cma.subject_property)) {
                if (key == item) {
                    labels.push(value)
                }
            }
        })
        return labels;
    }

    renderSummaryTable = (results, cma) => {
        return <ReactTable
            className="-striped -highlight"
            data={results}
            columns = {[
                {
                    id: "property_name",
                    Header: "Name",
                    accessor: d => d.cma.subject_property.property_name,
                },
                {
                    id: 'Result_GrossSchedIncome',
                    Header: "Gross Scheduled Income",
                    accessor: 'cma.Result_GrossSchedIncome',
                    Cell: props => <Currency value={props.value}/>,
                    Footer: (
                    <span>
                        <strong>Total:</strong>{" "}
                        <Currency value={_.round(_.sum(_.map(results, d => d.cma.cma_results.Result_GrossSchedIncome)))}/>
                    </span>
                    ) 
                },
                {
                    id: 'Result_EffectiveGrossIncome',
                    Header: "Effective Gross Income",
                    accessor: 'cma.Result_EffectiveGrossIncome',
                    Cell: props => <Currency value={props.value}/>,
                    Footer: (
                    <span>
                        <strong>Total:</strong>{" "}
                        <Currency value={_.round(_.sum(_.map(results, d => d.cma.cma_results.Result_EffectiveGrossIncome)))}/>
                    </span>
                    ) 
                },
                {
                    id: 'Result_OperatingExpenses',
                    Header: "Operating Expenses",
                    accessor: 'cma.Result_OperatingExpenses',
                    Cell: props => <Currency value={props.value}/>,
                    Footer: (
                    <span>
                        <strong>Total:</strong>{" "}
                        <Currency value={_.round(_.sum(_.map(results, d => d.cma.cma_results.Result_OperatingExpenses)))}/>
                    </span>
                    ) 
                },
                {
                    id: 'Result_NetOperatingIncome',
                    Header: "Net Operating Income",
                    accessor: 'cma.Result_NetOperatingIncome',
                    Cell: props => <Currency value={props.value}/>,
                    Footer: (
                    <span>
                        <strong>Total:</strong>{" "}
                        <Currency value={_.round(_.sum(_.map(results, d => d.cma.cma_results.Result_NetOperatingIncome)))}/>
                    </span>
                    ) 
                },
                {
                    id: 'Result_CashFlow',
                    Header: "Annual Cash Flow",
                    accessor: 'cma.Result_CashFlow',
                    Cell: props => <Currency value={props.value}/>,
                    Footer: (
                    <span>
                        <strong>Average:</strong>{" "}
                        <Currency value={_.round(_.mean(_.map(results, d => d.cma.cma_results.Result_CashFlow)))}/>
                    </span>
                    ) 
                },
                {
                    id: 'caprate',
                    Header: "Cap Rate (%)",
                    accessor: 'cma.Result_CapRate',
                    Cell: props => <PercentDecimal value={props.value}/>,
                    // Footer: (
                    //   <span>
                    //     <strong>Average:</strong>{" "}
                    //     <Percent value={_.round(_.mean(_.map(results, d => d.stats.capRateStats.mean)))} demimals={2}/>
                    //   </span>
                    // ) 
                },
                {
                    id: 'Result_CashOnCashReturn',
                    Header: "CoC Return (%)",
                    accessor: 'cma.Result_CashOnCashReturn',
                    Cell: props => <PercentDecimal value={props.value}/>,
                    // Footer: (
                    //   <span>
                    //     <strong>Average:</strong>{" "}
                    //     <Percent value={_.round(_.mean(_.map(results, d => d.stats.cashOnCashStats.mean)))} demimals={2}/>
                    //   </span>
                    // ) 
                },
                {
                    id: 'rent',
                    Header: "Rent",
                    accessor: 'cma.cma_results.Result_MonthlyRent',
                    Cell: props => <Currency value={props.value}/>,
                    Footer: (
                    <span>
                        <strong>Average:</strong>{" "}
                        <Currency value={_.round(_.mean(_.map(results, d => d.cma.cma_results.Result_EstMonthlyRent)))}/>
                    </span>
                    ) 
                },
                {
                    id: 'pricesqft',
                    Header: "Price/sqft",
                    accessor: 'cma.subject_property.price_sqft',
                    Cell: props => <Currency value={props.value}/>,
                    Footer: (
                    <span>
                        <strong>Average:</strong>{" "}
                        <Currency value={_.round(_.mean(_.map(results, d => d.cma.subject_property.price_sqft)))}/>
                    </span>
                    ) 
                },
                {
                    id: 'rentsqft',
                    Header: "Rent/sqft",
                    accessor: 'cma.subject_property.rent_sqft',
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
            showPagination={false} 
            showPaginationBottom={false}
            showPageSizeOptions={false}
            style={{fontSize:12}}
        />
    }

    renderCashOutTable = (results) => {
        return <ReactTable
            className="-striped -highlight"
            data={results}
            columns = {[
                {
                    id: "property_name",
                    Header: "Name",
                    accessor: d => d.cma.subject_property.property_name,
                },
                {
                    id: "sale_price_comps",
                    Header: "Sale Price",
                    accessor: d => d.cma.cma_calc.Calc_SellingPriceComps,
                    Cell: props => <Currency value={props.value}/>,
                },
                {
                    id: "broker_commission",
                    Header: "Broker Commission",
                    accessor: d => d.cma.cma_calc.Calc_BrokerCommissionComps,
                    Cell: props => <Currency value={props.value}/>,
                },
                {
                    id: "excise_tax",
                    Header: "Excise Tax",
                    accessor: d => d.cma.cma_calc.Calc_ExciseTaxComps,
                    Cell: props => <Currency value={props.value}/>,
                },
                {
                    id: "adj_saleprice_Comps",
                    Header: "Adjusted Sales Price",
                    accessor: d => d.cma.cma_calc.Calc_AdjustedSalesPriceComps,
                    Cell: props => <Currency value={props.value}/>,
                },
                {
                    id: "cashout_Comps",
                    Header: "Cash Out",
                    accessor: d => d.cma.cma_results.Result_CashOutComps,
                    Cell: props => <Currency value={props.value}/>,
                },
                {
                    id: "roi_Comps",
                    Header: "Return on Investment (ROI)",
                    accessor: d => d.cma.cma_results.Result_RoIComps,
                    Cell: props => <PercentDecimal value={props.value}/>,
                },
            ]}
            pageSize={results.length}
            showPagination={false} 
            showPaginationBottom={false}
            showPageSizeOptions={false}
            style={{fontSize:12}}
        />
    }
    renderGraph = (values, labels, title, type, currentValues) => {
        var data = [];
        const datasetComps =  {
            label: "Comps-based",
            type: "bar",
            'backgroundColor': randomColorGenerator(),
            data: values
        }
        const datasetIncome =  {
            label: "Income-based",
            type: "bar",
            'backgroundColor': randomColorGenerator(),
            data: currentValues
        }
        if (currentValues != undefined) {
            data = {
                labels: labels,
                datasets: [datasetComps, datasetIncome]
            }
        } else {
            data = {
                labels: labels,
                datasets: [datasetComps]
            }
        }
        // const data = {
        //   labels: labels,
        //   datasets: [
        //     {
        //       label: title,
        //       'backgroundColor': randomColorGenerator(),
        //       'borderColor': randomColorGenerator(),
        //       data: values
        //     }
        //   ]
        // };
                   
        return <CardBody>
                  <CardTitle>{title}</CardTitle>
                <div className="chart-analysis" style={{
                    'height': 350,
                    'margin': '0 auto',
                    'width': '100%'
                }}>
                    <Bar data={data} options={{
                        'legend': {
                            'display': true,
                            'position': 'bottom',
                            'labels': { 'fontFamily': 'Poppins' }
                        },
                         plugins: {
                          labels: false,
                          clamp: true,
                          rotation: 90,
                          datalabels: {
                            align: 'end',
                            anchor: 'end',
                            formatter: function(value, context) {
                                if (type === "currency") {
                                    return '$' + (value.toFixed(0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                } else if (type === "percent") {
                                    return (value * 100).toFixed(1) + '%';
                                } else if (type === "ratio") {
                                      return (value * 100).toFixed(1);
                                } else {
                                    return value;
                                }  
                            },
                      /*        backgroundColor: function(context) {
                              return context.dataset.backgroundColor; */
                            },
                            borderRadius: 4,
                            color: 'white',
                            font: {
                                weight: 'bold'
                            },
    
                        },
                        'maintainAspectRatio': false,
                        tooltips: { 
                            callbacks: {
                                          label: function(tooltipItem, data) {
                                            var value = data.datasets[0].data[tooltipItem.index];
                                                if (type === "currency") {
                                                    return '$' + (value.toFixed(0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                                } else if (type === "percent") {
                                                    return (value * 100).toFixed(1) + '%';
                                                } else if (type === "ratio") {
                                                    return (value * 100).toFixed(1);
                                                } else {
                                                    return value;
                                                }
                                          },
                                      }
                              },
                        'scales': {
                            'xAxes': [
                                {
                                    'gridLines': { 'display': false },
                                    'ticks': { 'fontFamily': 'Poppins', autoSkip: false },
                          
                                }
                            ],
                            'yAxes': [
                                {
                                    'gridLines': { 'display': true },
                                    'ticks': { 
                                          'fontFamily': 'Poppins',
                                          callback: function(value, index, values) {
                                            if (type === "currency") {
                                              return '$' + (value.toFixed(0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                            } else if (type === "percent") {
                                              return (value * 100).toFixed(1) + '%';
                                            } else if (type === "ratio") {
                                                return (value * 100).toFixed(1);
                                            } else {
                                              return value;
                                            }
                                          }
                                      }
                                }
                            ]
                        },
                        'layout': {
                            'padding': {
                                'top': 20
                            }
                        }
                    }} />
                </div>
            </CardBody>
  }

    render() {
        const results = this.props.results;
        if (!results) {
            return null;
        }
        const emvCompsValues = this.getGraphValues(results, "Result_EMVComps", "currency")
        const emvIncomeValues = this.getGraphValues(results, "Result_EMVIncome", "currency")
        const equityCompsValues = this.getGraphValues(results, "Result_EquityComps", "currency")
        const equityIncomeValues = this.getGraphValues(results, "Result_EquityIncome", "currency")
        const roeCompsValues = this.getGraphValues(results, "Result_RoEComps", "percent")
        const roeIncomeValues = this.getGraphValues(results, "Result_RoEIncome", "percent")
        return <div>
            <CardBody>
                <Loader show={this.state.loading} message={'Loading ...'}>
                            <Nav tabs className="font-14 border-info" expand="md">
                                    <NavItem>
                                            <NavLink className={classnames({ active: this.state.activeTab === '1' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('1'); }}>Summary</NavLink>
                                    </NavItem>
                                    <NavItem >
                                            <NavLink className={classnames({ active: this.state.activeTab === '2' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('2'); }}>Returns</NavLink>
                                    </NavItem>
                                    <NavItem>
                                            <NavLink className={classnames({ active: this.state.activeTab === '3' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('3'); }}>Market Values</NavLink>
                                    </NavItem>
                                    <NavItem>
                                            <NavLink className={classnames({ active: this.state.activeTab === '4' })} style={{border:'none', cursor: "pointer"}} onClick={() => { this.toggle('4'); }}>Cash Out Analysis</NavLink>
                                    </NavItem>
                            </Nav> 
                            <TabContent activeTab={this.state.activeTab}>
                                    <TabPane tabId="1">
                                        <Col xs={12} md={12}>
                                            <Row  expand="md">
                                                <CardBody>
                                                    <ButtonGroup>
                                                        <Button
                                                            color="secondary"
                                                            onClick={() => this.onRadioBtnClick('current')}
                                                            active={this.state.rSelected === 'current'}
                                                        >
                                                            Current
                                                        </Button>&nbsp;
                                                        <Button
                                                            color="secondary"
                                                            onClick={() => this.onRadioBtnClick('estimated')}
                                                            active={this.state.rSelected === 'estimated'}
                                                        >
                                                            Estimated
                                                        </Button>
                                                    </ButtonGroup>
                                                </CardBody>
                                            </Row>
                                            {this.renderSummaryTable(results)}
                                            {this.renderGraph(this.getGraphValues(results, "Result_CashIn", "currency"), this.getGraphLabels(results, "property_name"), "Cash In", "currency")}
                                        </Col>
                                    </TabPane>
                                    <TabPane tabId="2">
                                        <Row>
                                            <Col xs={12} md={12}>
                                                {this.renderGraph(this.getGraphValues(results, "Result_CashFlow", "currency"), this.getGraphLabels(results, "property_name"), "Cash Flow", "currency")}
                                            </Col>
                                            <Col xs={12} md={12}>
                                                {this.renderGraph(this.getGraphValues(results, "Result_CapRate", "percent"), this.getGraphLabels(results, "property_name"), "Cap Rate", "percent")}
                                            </Col>
                                            <Col xs={12} md={12}>
                                                {this.renderGraph(this.getGraphValues(results, "Result_CashOnCashReturn", "percent"), this.getGraphLabels(results, "property_name"), "CoC Return", "percent")}
                                            </Col>
                                            <Col xs={12} md={12}>
                                                {this.renderGraph(this.getGraphValues(results, "Result_RentValueRatio", "percent"), this.getGraphLabels(results, "property_name"), "Rent-to-Value",  "ratio")}
                                            </Col>
                                        </Row> 
                                    </TabPane>
                                    <TabPane tabId="3">
                                        {this.renderGraph(emvCompsValues, this.getGraphLabels(results, "property_name"), "Market Values",  "currency", emvIncomeValues)}
                                        {this.renderGraph(equityCompsValues, this.getGraphLabels(results, "property_name"), "Equity",  "currency", equityIncomeValues)}
                                        {this.renderGraph(roeCompsValues, this.getGraphLabels(results, "property_name"), "Return on Equity (RoE)",  "percent", roeIncomeValues)}
                                    </TabPane>
                                    <TabPane tabId="4">
                                        {this.renderCashOutTable(results)}
                                    </TabPane>
                            </TabContent>
                </Loader>
            </CardBody>
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

export default FolioResultsAggregate;

