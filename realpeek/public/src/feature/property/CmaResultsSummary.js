import React, {Component} from "react";
import { Row, Col, CardTitle, Card, CardBody } from 'reactstrap';
import { FormattedValue, Currency, FixedNumber, PercentDecimal, Percent } from "../common/Format";
import ListAssumptions from "../cmaAssumptions/ListAssumptions";
import { CmaCriteria } from "./CmaCriteria";
import CmaResultsSummaryMult from "./CmaResultsSummaryMult";
import { HorizontalBar, Bar, Radar, Pie, Polar, Doughnut } from 'react-chartjs-2';
import 'chartjs-plugin-datalabels';

const ResultRow = (props) => {
    return <li><span className="data-label">{props.name}:</span> <span className="data-value"><FormattedValue {...props} /></span></li>
}

const MainResultRow =(props) => {
    if (props.value != 'undefined') {
        return <Col>
            <Row className="text-muted"><h5>{props.name}</h5></Row>
            <Row className=" text-dark op-6"><h4><FormattedValue {...props} /></h4></Row>
        </Col>
    }
}

var randomColorGenerator = function () { 
    return '#' + (Math.random().toString(16) + '0000000').slice(2, 8); 
  };


class CmaResultsSummary extends Component {

    renderBarGraph = (values, labels, title, type) => {
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
                  {/* <CardTitle>{title}</CardTitle> */}
                <div className="chart-wrapper" style={{
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
                            }
                        },
                        borderRadius: 4,
                        color: 'white',
                        font: {
                            weight: 'bold'
                        },
                        },
                        'maintainAspectRatio': false,
                         'tooltips': { 
                            'callbacks': {
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
                                          'beginAtZero': true,
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
        const cma = this.props.cma;
        const assumptions = this.props.assumptions;
        if (!cma) {
            return <div>No Investment Analysis Available.</div>;
        }
        if (cma.subject_property.mp_style == 7) {
            return <CmaResultsSummaryMult {...this.props} />
        }

        const cma_results = this.props.cma.cma_results;
        const cma_calc = this.props.cma.cma_calc;
        
        const opexValues = [cma_calc.Calc_Maintenance, cma_calc.Calc_Insurance, cma_calc.Calc_PropertyTaxes, cma_calc.Calc_PropertyMgmt, cma_calc.HOA_yr]
        const opexLabels = ["Maintenance", "Insurance", "Property Taxes", "Property Management", "HOA"]
        const costValues = [cma_results.Result_CashIn, cma_calc.Calc_ClosingCosts, cma_calc.Calc_Downpayment, cma_calc.Calc_LoanAmount, cma_calc.Calc_PurchaseEquity, cma_calc.Calc_MarketEquity]
        const costLabels = ["Cash-In", "Closing Costs", "Down Payment","Loan", "Equity (Purchase Price)", "Equity (Market Value)"]
        const incomeValues = [cma_calc.Calc_GrossSchedIncome, cma_calc.Calc_EffectiveGrossIncome, cma_calc.Calc_NetOperatingIncome];
        const incomeLabels = ["Gross Scheduled Income", "Effective Gross Income", "NOI"]
        const multiplierValues = [cma_calc.Calc_NetIncomeMultiplier, cma_calc.Calc_GrossRentMultiplier];
        const multiplierLabels = ["Net Income Multiplier", "Gross Rent Multiplier"]
        const ratioValues = [cma_calc.Calc_DebtCoverageRatio, cma_calc.Calc_ExpenseRatio];
        const ratioLabels = ["Debt Coverage Ratio", "Expense Ratio"]

        return <div className="cma-analysis">
            <Card>
                <CardBody>
                        <Row>
                            <MainResultRow name='Monthly Cash Flow' id='Result_CashFlow_Monthly' value={cma_results.Result_CashFlow_Monthly} type="currency" />
                            <MainResultRow name='Annual Cash Flow' id='Result_CashFlow_Annual' value={cma_results.Result_CashFlow} type="currency" />
                            <MainResultRow name='Cap Rate' id='Result_CapRate' value={cma_results.Result_CapRate} type="percent" decimals={2} />
                            <MainResultRow name='Cash-On-Cash Return' id='Result_CashOnCashReturn' value={cma_results.Result_CashOnCashReturn} type="percent" decimals={2} />
                            <MainResultRow name='Rent2Value Ratio' id='Result_RentValueRatio' value={cma_results.Result_RentValueRatio} type="percent" decimals={2} />
                        </Row>
                </CardBody>
            </Card>
            <Row>
                <Col xs={12} lg={6}>
                    <Row>
                        <Col xs={6} md={6}>
                            <CardTitle className="font-bold op-5">Operating Expenses</CardTitle>
                        </Col>
                        <Col xs={6} md={6}>
                            <p className="font-12">TOTAL  <Currency value={cma_calc.Calc_OperatingExpenses}/> </p>
                        </Col>
                    </Row>
                    {this.renderBarGraph(opexValues, opexLabels, "Operating Expenses", "currency")}
                </Col>
                <Col xs={12} lg={6}>
                    <Row>
                        <Col xs={6} md={4}>
                            <CardTitle className="font-bold op-5">Costs</CardTitle>
                        </Col>
                        <Col xs={6} md={8}>
                        <p className="font-12">Monthly Mortgage  <Currency value={cma_calc.Calc_MortgagePerMonth}  /> </p>
                        </Col>
                    </Row>
                    {this.renderBarGraph(costValues, costLabels, "Costs", "currency")}
                </Col>
            
                <Col xs={12} lg={6}>
                    <Row>
                        <CardTitle className="font-bold op-5">Income</CardTitle>
                    </Row>
                    <Row>
                        <Col md={12}>
                            {this.renderBarGraph(incomeValues, incomeLabels, "Income", "currency")}
                        </Col>
                    </Row>
                </Col>
                <Col xs={12} lg={6}>
                    <Row>
                        <Col md={12}>
                            {this.renderBarGraph(multiplierValues, multiplierLabels, "Multipliers", "percent")}
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    }

}

export default CmaResultsSummary;