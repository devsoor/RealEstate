import React, {Component} from "react"
import { ButtonGroup, Button, Row, Col, Card, CardBody, CardTitle, CardSubtitle, Label, Input} from 'reactstrap';
import { withSettings} from "../../../api/SettingsProvider";
import ListAssumptionsReport from "../../cmaAssumptions/ListAssumptionsReport";
import ListAssumptions from "../../cmaAssumptions/ListAssumptions";
import { RealPeekReportDisclaimer } from "../../disclaimers/MLSDisclaimer";
import '../../property/property.css';
// import '../../reports/Report.css';
import _ from "lodash";

import { Currency, FixedNumber, PercentDecimal, Percent } from "../../common/Format";
import { CmaCriteria } from '../../property/CmaCriteria';
import { ReportHeader } from "../../reports/ReportHeader";
import ReportSection from "../../property/PropertyDetail/ReportSection";
import CmaResultsSummary from "../../property/CmaResultsSummary";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { HorizontalBar, Bar, Radar, Pie, Polar, Doughnut } from 'react-chartjs-2';
import 'chartjs-plugin-datalabels';
import SaveToPdf from "../../common/saveToPdf/SaveToPdf";

var randomColorGenerator = function () { 
  return '#' + (Math.random().toString(16) + '0000000').slice(2, 8); 
};
  
class MultiPropertyAnalyzeReport extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
          selection: [],
          selectAll: 0,
          selected: {},
          data: [],
          graphType: null
        }
        this.exportAsCsv = this.exportAsCsv.bind(this);
        this.print = this.print.bind(this);
        this.toggleRow = this.toggleRow.bind(this);
        this.handleChange = this.handleChange.bind(this);
      };
        
      exportAsCsv() {
        console.log("exportAsCsv")
/*         if (this.api) {
            const csvOptions = {
                fileName: this.props.report.name
            }
            this.api.exportDataAsCsv(csvOptions);
        } */
      }
      print(event) {
          if (this.printPending) {
              this.printPending = false;
              setTimeout(function () { window.print(); }, 2000);
              setTimeout(function () { window.close(); }, 2000);
          }
      }


    handleChange = (e) => {
        const id = e.target.id;
        const value = e.target.value;
        this.setState({graphType:value});
      }

    handleEmail() {
      this.props.onEmail("multiReportID");
  }
  
      toggleRow(listing_id) {
          const newSelected = Object.assign({}, this.state.selected);
          newSelected[listing_id] = !this.state.selected[listing_id];
          let selection = [...this.state.selection];
          const keyIndex = selection.indexOf(listing_id);
          if (keyIndex >= 0) {
            // it does exist so we will remove it using destructing
            selection = [
              ...selection.slice(0, keyIndex),
              ...selection.slice(keyIndex + 1)
            ];
          } else {
            // it does not exist so add it
            selection.push(listing_id);
          }
          // update the state
          this.setState({
            selection,
            selected: newSelected,
            selectAll: 2
          });
          
        }
      
        toggleSelectAll() {
          let newSelected = {};
          const selection = [];
      
          if (this.state.selectAll === 0) {
            this.props.results.forEach(x => {
              newSelected[x.listing_id] = true;
              selection.push(x.listing_id);
            });
          }
      
          this.setState({
            selection,
            selected: newSelected,
            selectAll: this.state.selectAll === 0 ? 1 : 0
          });
        }
  
      getGraphValues(properties, item, type) {
        const values = [];
        Object.values(properties).forEach(p => {
          for (let [key, value] of Object.entries(p)) {
              if (key == item) {
                values.push(value)
              }
            }
        })
        return values;
    }
  
        renderGraph = (values, labels, title, type) => {
          const data = {
            labels: labels,
            datasets: [
              {
                label: title,
                'backgroundColor': randomColorGenerator(),
                'borderColor': randomColorGenerator(),
                data: values
              }
            ]
          };
                     
          return <CardBody>
                    <CardTitle>{title}</CardTitle>
                  <div className="chart-analysis" style={{
                      'height': 350,
                      'margin': '0 auto',
                      'width': '100%'
                  }}>
                      <Bar data={data} options={{
                          'legend': {
                              'display': false,
                              'labels': { 'fontFamily': 'Poppins' }
                          },
                           plugins: {
                            labels: false,
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
        const settings = this.props.settings;
        if (!settings) {
            return null;
        }

        if (!this.props.results || this.props.results.length == 0) {
          return <Card>
            <CardTitle className="bg-danger border-bottom p-3 mb-0 text-white">Select properties under Analyze to see report</CardTitle>
          </Card>;
      }

        // const properties = this.getData(this.props.results);
        const properties = this.props.results;
        const assumptions = this.props.assumptions; 
        const selProperties = [];
        selProperties.length = 0;
      
        for (let [key, value] of Object.entries(this.state.selection)) {
          selProperties && selProperties.push(properties.find(p => p.listing_id === value))
        }
        
        return <div className="property report">
            <Row>
                <Col sm={12} md={12}>
                {
                    !this.props.print &&
                    <div className="pull-right">
                        <ButtonGroup className="pull-right" >
                            {/* <Button size="lg" className="ti-sharethis" outline style={{border:0}} onClick={this.handleEmail}></Button> */}
                            <SaveToPdf id="multiReportID" filename={`realpeek_report.pdf`}/>
                        </ButtonGroup>
                   {/*      <ButtonGroup>
                            <Button onClick={this.exportAsCsv}>CSV</Button>
                            <Link to={'/user/reports/' + report.id + '/p'} target="_blank">
                                <Button>Print</Button>
                            </Link>
                    </ButtonGroup> */}

                    
                    </div>
                }
                </Col>
            </Row>

            <div id="multiReportID">
              <div className="page">
                  <ReportHeader/>
                  <ReportSection title="Portfolio Performance">
                      <CardBody>
                        <ReactTable
                            className="-striped -highlight"
                            data={properties} 
                            columns = {[
                              {
                                Header: "Address",
                                columns: [
                                  {
                                    id: "checkbox",
                                    accessor: "",
                                    Cell: ({ original }) => {
                                      return (
                                        <input
                                          type="checkbox"
                                          className="checkbox"
                                          checked={this.state.selected[original.listing_id] === true}
                                          onChange={() => this.toggleRow(original.listing_id)}
                                        />
                                      );
                                    },
                                    Header: x => {
                                      return (
                                        <input
                                          type="checkbox"
                                          className="checkbox"
                                          checked={this.state.selectAll === 1}
                                          ref={input => {
                                            if (input) {
                                              input.indeterminate = this.state.selectAll === 2;
                                            }
                                          }}
                                          onChange={() => this.toggleSelectAll()}
                                        />
                                      );
                                    },
                                    sortable: false,
                                    width: 45
                                  },
                                  {
                                    Header: "Street",
                                    accessor: "street_address",
                                    minWidth: 200
                                  },
                                  {
                                    Header: "City",
                                    id: "city",
                                    maxWidth: 70,
                                    accessor: d => d.city
                                  },
                                  {
                                    Header: "State",
                                    id: "state",
                                    maxWidth: 50,
                                    accessor: d => d.state
                                  },
                                  {
                                    Header: "Zip",
                                    id: "zipcode",
                                    maxWidth: 50,
                                    accessor: d => d.zipcode
                                  },
                                  {
                                    Header: "County",
                                    id: "county",
                                    maxWidth: 70,
                                    accessor: d => d.county
                                  }
                                ]
                              },
                              {
                                Header: "Performance",
                                columns: [
                                  {
                                    Header: "Rent",
                                    accessor: "Result_EstMonthlyRent",
                                    Cell: props => <Currency value={props.value}/>,
                                    Footer: (
                                      <span>
                                        <strong>Total:</strong>{" "}
                                        <Currency value={_.round(_.sum(_.map(properties, d => d.Result_EstMonthlyRent)))}/>
                                      </span>
                                    )
                                  },
                                  {
                                    Header: "Market Value",
                                    accessor: "Result_EstMarketValue",
                                    Cell: props => <Currency value={props.value}/>,
                                    Footer: (
                                      <span>
                                        <strong>Total:</strong>{" "}
                                        <Currency value={_.round(_.sum(_.map(properties, d => d.Result_EstMarketValue)))}/>
                                      </span>
                                    )
                                  },
                                  {
                                    Header: "Criteria",
                                    accessor: "criteria_value",
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
                                    Cell: props => <Currency value={props.value}/>,
                                    Footer: (
                                      <span>
                                        <strong>Total:</strong>{" "}
                                        <Currency value={_.round(_.sum(_.map(properties, d => d.Result_CashFlow)))}/>
                                      </span>
                                    ) 
                                  },
                                  {
                                    Header: "Cap Rate (%)",
                                    accessor: "Result_CapRate",
                                    Cell: props => <PercentDecimal value={props.value}/>,
                                    Footer: (
                                      <span>
                                        <strong>Avg:</strong>{" "}
                                        <PercentDecimal value={_.mean(_.map(properties, d => d.Result_CapRate))}/>
                                      </span>
                                    ) 
                                  },
                                  {
                                    Header: "CoC Return (%)",
                                    accessor: "Result_CashOnCashReturn",
                                    Cell: props => <PercentDecimal value={props.value}/>,
                                    Footer: (
                                      <span>
                                        <strong>Avg:</strong>{" "}
                                        <PercentDecimal value={_.mean(_.map(properties, d => d.Result_CashOnCashReturn))}/>
                                      </span>
                                    ) 
                                  },
                                  {
                                    Header: "Rent-to-Value ratio",
                                    accessor: "Result_RentValueRatio",
                                    Cell: props => <PercentDecimal value={props.value}/>,
                                    Footer: (
                                      <span>
                                        <strong>Avg:</strong>{" "}
                                        <PercentDecimal value={_.mean(_.map(properties, d => d.Result_RentValueRatio))}/>
                                      </span>
                                    )
                                  }
                                ]
                              },
                              {
                                Header: "Property",
                                columns: [
                                  {
                                    Header: "Type",
                                    accessor: "mp_style_name",
                                    maxWidth: 100,
                                  },
                                  {
                                    Header: "Beds",
                                    maxWidth: 50,
                                    accessor: "bedrooms"
                                  },
                                  {
                                    Header: "Bath",
                                    accessor: "bathrooms",
                                    maxWidth: 50,
                                    Cell: props => parseFloat(props.value)
                                  },
                                  {
                                    Header: "Sqft",
                                    accessor: "sqft",
                                    maxWidth: 50,
                                    Cell: props => props.value.toLocaleString('en')
                                  },
                                  {
                                    Header: "Price",
                                    accessor: "price",
                                    Cell: props => <Currency value={props.value}/>,
                                    Footer: (
                                      <span>
                                        <strong>Total:</strong>{" "}
                                        <Currency value={_.round(_.sum(_.map(properties, d => d.price)))}/>
                                      </span>
                                    )
                    
                                  },
                                  {
                                    Header: "Price/sqft",
                                    accessor: "price_sqft",
                                    maxWidth: 70,
                                    Cell: props => <Currency value={props.value}/>,
                                    Footer: (
                                      <span>
                                        <strong>Avg:</strong>{" "}
                                        <Currency value={_.round(_.mean(_.map(properties, d => d.price_sqft)))}/>
                                      </span>
                                    )
                                  },
                                  {
                                    Header: "Rent/sqft",
                                    accessor: "rent_sqft",
                                    maxWidth: 70,
                                    Cell: props => <Currency value={props.value} decimals={2}/>,
                                    Footer: (
                                      <span>
                                        <strong>Avg:</strong>{" "}
                                        <Currency value={_.round(_.mean(_.map(properties, d => d.rent_sqft)))}/>
                                      </span>
                                    )
                                  },
                                  {
                                    Header: "Year",
                                    accessor: "year_built",
                                    maxWidth: 50,
                                  },
                                ]
                              }
                            ]}
                            pageSize={properties.length}
                            showPagination={false} 
                            showPaginationBottom={false}
                            showPageSizeOptions={false}
                            style={{fontSize:12}}
                        />
                      </CardBody>
                    <Row>
                        <Col xs={12} md={12}>
                          {this.renderGraph(this.getGraphValues(selProperties, "Result_CashFlow", "currency"), this.getGraphValues(selProperties, "address"), "Cash Flow", "currency")}
                        </Col>
                        <Col xs={12} md={12}>
                          {this.renderGraph(this.getGraphValues(selProperties, "Result_CapRate", "percent"), this.getGraphValues(selProperties, "address"), "Cap Rate", "percent")}
                        </Col>
                        <Col xs={12} md={12}>
                          {this.renderGraph(this.getGraphValues(selProperties, "Result_CashOnCashReturn", "percent"), this.getGraphValues(selProperties, "address"), "CoC Return", "percent")}
                        </Col>
                        <Col xs={12} md={12}>
                          {this.renderGraph(this.getGraphValues(selProperties, "Result_RentValueRatio", "percent"), this.getGraphValues(selProperties, "address"), "Rent-to-Value",  "ratio")}
                        </Col>
                    </Row>  
                  </ReportSection> 
                  <RealPeekReportDisclaimer />
              </div>
              <div className="page">
                  <ReportSection title="Assumptions">
                        <ListAssumptionsReport assumptions={assumptions} />
                  </ReportSection>
                  <RealPeekReportDisclaimer />
              </div>
            </div>
        </div>
    }
}


export default withSettings(MultiPropertyAnalyzeReport);