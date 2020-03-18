import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, ButtonGroup, UncontrolledTooltip} from 'reactstrap';
import _ from "lodash";
import {MapMarketContainer} from './MapMarket';
import { Bar } from 'react-chartjs-2';
import 'chartjs-plugin-datalabels';
import BubbleChart from '@weknow/react-bubble-chart-d3';
import {Treemap} from 'react-vis';
import "./treemap.scss";


var randomColorGenerator = function () { 
    return '#' + (Math.random().toString(16) + '0000000').slice(2, 8); 
};

class PlotGraph extends Component {
    constructor(props) {
        super(props);

        this.state = {
            highlightedResult: {}
        }

    }

    highlightResult = (result) => {
        this.setState({highlightedResult: result});
	}

    getGraphValues(results, statName, statValue) {
        const values = [];
        Object.values(results).map((item) => {
            for (let [key,value] of Object.entries(item.stats)) {
                if (key == statName) {
                    values.push(value[statValue])
                }
            }
        })

        return values;
    }

    getGraphLabels(results, labelName) {
        const labels = [];
        Object.values(results).map((item) => {
            labels.push(item[labelName]+" ("+item.stats.totalHits+")")
        })

        return labels;
    }

    getTreemapData = (results, statName, statValue, formatType, labelName) => {
        const leaves = [];
        var finalVal = null;
        Object.values(results).map((item) => {
            for (let [key,value] of Object.entries(item.stats)) {
                if ((key == statName) && (statValue !="mixed")) {
                    if (formatType === "currency") {
                        finalVal = '$' + (value[statValue].toFixed(0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    } else if (formatType === "percent") {
                        finalVal = (value[statValue] * 100).toFixed(1) + '%';
                    } else if (formatType === "ratio") {
                        finalVal = (value[statValue] * 100).toFixed(1);
                    } else {
                        finalVal = value[statValue];
                    } 
                    leaves.push({"title":item[labelName] + '\n' + finalVal, "color": Math.random(), "size":value[statValue]})
                }
            }
        })
        return {
            // title: '',
            color: 1,
            children: leaves
            };
    }

    getBubbleData = (results, statName, statValue, formatType, labelName) => {
        const bubbleData = [];
        var finalVal = null;
        Object.values(results).map((item) => {
            for (let [key,value] of Object.entries(item.stats)) {
                if ((key == statName) && (statValue !="mixed")) {
                    if (formatType === "currency") {
                        finalVal = '$' + (value[statValue].toFixed(0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    } else if (formatType === "percent") {
                        finalVal = (value[statValue] * 100).toFixed(1) + '%';
                    } else if (formatType === "ratio") {
                        finalVal = (value[statValue] * 100).toFixed(1);
                    } else {
                        finalVal = value[statValue];
                    }
                    var str = `${item[labelName]}\n${finalVal}`;
                    // bubbleData.push({label:item.city + "\n" + finalVal, value:value[statValue]})
                    bubbleData.push({label:str, value:value[statValue]})
                }
            }
        })
        return bubbleData;
    }

    getMapData = (results, title) => {
        const coords = []

        Object.values(results).map((item) => {
            for (let [key,value] of Object.entries(item.stats)) {
                if (key == "latlong") {
                    value.map(l => {
                        coords.push([l["long"], l["lat"]])
                    })
                }
            }
        })

        const data =  {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": coords
                },
                "properties": {
                    "name": title
                }
        }
        return data;
    }

    renderBarGraph = (minValues, maxValues, meanValues, labels, title, type, graphType) => {
        var data = [];
        const datasetMin =  {
            label: "Min",
            type: "bar",
            'backgroundColor': randomColorGenerator(),
            data: minValues
        }
        const datasetMax =  {
            label: "Max",
            type: "bar",
            'backgroundColor': randomColorGenerator(),
            data: maxValues
        }
        const datasetAverage =  {
            label: "Average",
            type: "bar",
            'backgroundColor': randomColorGenerator(),
            data: meanValues
        }

        switch (graphType) {
            case "min":
                data = {
                    labels: labels,
                    datasets: [datasetMin]
                }
                break;
            case "max":
                data = {
                    labels: labels,
                    datasets: [datasetMax]
                }
                break;
            case "mean":
                data = {
                    labels: labels,
                    datasets: [datasetAverage]
                }
                break;
            case "mixed":
                data = {
                    labels: labels,
                    datasets: [datasetMin, datasetMax, datasetAverage]
                }
                break;
        }
                   
        return <CardBody>
                <CardTitle>{title} ({graphType})</CardTitle>
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
                          datalabels: {
                            align: 'end',
                            anchor: 'end',
                            rotation: 90,
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
                                'top': 80
                            }
                        }
                    }} />
                </div>
            </CardBody>
    }

    renderButtonGroup(combo=false) {
        return <ButtonGroup className="pull-right" >
                <UncontrolledTooltip placement="top" target="showMinValues">
                    Show Minimums
                </UncontrolledTooltip>
                <UncontrolledTooltip placement="top" target="showMaxValues">
                Show Maximiums
                </UncontrolledTooltip>
                <UncontrolledTooltip placement="top" target="showAverageValues">
                    Show Averages
                </UncontrolledTooltip>
                <Button id="showMinValues" className="bg-primary text-white" outline style={{border:1}} onClick={()=>{this.props.onChangeGraphType("min")}}>Min</Button>
                <Button id="showMaxValues"  className="bg-warning text-white" outline style={{border:1}} onClick={()=>{this.props.onChangeGraphType("max")}}>Max</Button>
                <Button id="showAverageValues" className="bg-secondary text-white" outline style={{border:1}} onClick={()=>{this.props.onChangeGraphType("mean")}}>Avg</Button>
                {
                    combo && <div>
                        <UncontrolledTooltip placement="top" target="showMixedValues">
                            Show Mixed
                        </UncontrolledTooltip>
                        <Button id="showMixedValues" className="bg-danger text-white" outline style={{border:1}} onClick={()=>{this.props.onChangeGraphType("mixed")}}>Mixed</Button>
                    </div>
                }
            </ButtonGroup>
    }

  render() {
    const results = this.props.results;
    const resultsAll = this.props.resultsAll;
    const chartType = this.props.chartType;
    const graphType = this.props.graphType;
    const minValues = this.getGraphValues(results, this.props.statname, "min")
    const maxValues = this.getGraphValues(results, this.props.statname, "max")
    const meanValues = this.getGraphValues(results, this.props.statname, "mean")
    const labels = this.getGraphLabels(results, this.props.labels);

    return <Card>
            <CardBody>
                {chartType == "bar" && <div>
                    {!this.props.reportMode && this.renderButtonGroup(true)}
                    {this.renderBarGraph(minValues, maxValues, meanValues, labels, this.props.title, this.props.formatType, graphType)}
                </div>
                }
                {chartType == "map" && <div>
                    <MapMarketContainer results={resultsAll} selected={this.state.highlightedResult} searchType="location" radius={20} onMarkerSelected={this.highlightResult}/>
                    </div>
                }
                {chartType == "treemap" && <CardBody>
                    <CardTitle>{this.props.title} ({graphType})</CardTitle>
                    <Col lg={12}>
                        {!this.props.reportMode && this.renderButtonGroup(false)}
                    </Col>
                    <div className="d-flex justify-content-lg-center flex-wrap">
                            <Treemap
                                title={this.props.title}
                                width={1000}
                                height={800}
                                padding={4}
                                data={this.getTreemapData(results, this.props.statname, graphType, this.props.formatType, this.props.labels)}
                            />
                    </div>

                </CardBody>
                }
                {chartType == "bubble" && <CardBody>
                        <CardTitle>{this.props.title} ({graphType})</CardTitle>

                        <Col lg={12}>
                            {!this.props.reportMode && this.renderButtonGroup(false)}
                        </Col>
                        <div className="d-flex justify-content-lg-center flex-wrap">
                            <BubbleChart
                                graph= {{
                                    zoom: 0.9,
                                    offsetX: -0.01,
                                    offsetY: 0.02,
                                }}
                                width={1000}
                                height={800}
                                padding={20}
                                showLegend={true} // optional value, pass false to disable the legend.
                                legendPercentage={20} // number that represent the % of with that legend going to use.
                                legendFont={{
                                    size: 10,
                                    color: "#000",
                                    // weight: "bold"
                                }}
                                valueFont={{
                                    color: "transparent",
                                    weight: "bold"
                                }}
                                labelFont={{
                                    size: 12,
                                    color: "#fff",
                                    weight: "bold"
                                }}
                                //Custom bubble/legend click functions such as searching using the label, redirecting to other page
                                data={this.getBubbleData(results, this.props.statname, graphType, this.props.formatType, this.props.labels)}
                            />
                        </div>
                    </CardBody>
                }
            </CardBody>
        </Card>
  }
}

export default PlotGraph;


