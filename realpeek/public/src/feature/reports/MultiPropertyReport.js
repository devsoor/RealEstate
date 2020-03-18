import React, {Component} from "react"
import {ButtonGroup, Button, Row, Col} from 'react-bootstrap';
import queryString from "qs";
import {Link} from "react-router-dom";

import { AgGridReact } from 'ag-grid-react';
//import 'ag-grid/dist/styles/ag-grid.css';
//import 'ag-grid/dist/styles/ag-theme-balham.css';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';

import './Report.css';
import { MlsDislcaimer } from "../disclaimers/MLSDisclaimer";
import ListAssumptions from "../cmaAssumptions/ListAssumptions";
import { AgGridColumn } from "ag-grid-react";
import { ReportHeader } from "./ReportHeader";

const LinkCellRenderer = (props) => {
    const property = props.data.details;
    const assumptions = props.data.cma ? props.data.cma.parameters : null;
    const propertyLink = {
        pathname: '/property/' + property.unique_id + "/report",
        search: queryString.stringify(assumptions),
        //state: { 
        //  assumptions: this.state.assumptions,
        //  cma: this.state.cma 
        //}
      }

    return <Link to={propertyLink} target="_blank">{props.value}</Link>
}

class MultiPropertyReport extends Component {

    constructor(props) {
        super(props);
        this.state = {
            width: '100%'
        }
        this.onGridReady = this.onGridReady.bind(this);
        this.setPrinterFriendly = this.setPrinterFriendly.bind(this);
        this.print = this.print.bind(this);
        this.exportAsCsv = this.exportAsCsv.bind(this);
    }

    // in onGridReady, store the api for later use
    onGridReady = (params) => {
        this.api = params.api;
        this.columnApi = params.columnApi;
        //this.api.sizeColumnsToFit();
        this.autoSizeColumns();
        this.api.setGridAutoHeight(true);
        if (this.props.print) {
            this.setPrinterFriendly();
            this.printPending = true;
            this.print();
            // if (this.api.isAnimationFrameQueueEmpty()) {
            //     this.onAnimationQueueEmpty();
            // }
        }
    }

    autoSizeColumns = () => {
        var allColumnIds = [];
        this.columnApi.getAllColumns().forEach(function(column) {
            allColumnIds.push(column.colId);
        });
        this.columnApi.autoSizeColumns(allColumnIds);
    }

    setPrinterFriendly() {
        if (this.api) {
            var preferredWidth = this.api.getPreferredWidth();
    
            // add 2 pixels for the grid border
            preferredWidth += 2;
            this.setState({width: preferredWidth + 'px', height:''}, () => {
                //this.api.sizeColumnsToFit();
                this.autoSizeColumns();
                this.api.setDomLayout("print");
            })

        }
    }

    exportAsCsv() {
        if (this.api) {
            const csvOptions = {
                fileName: this.props.report.name
            }
            this.api.exportDataAsCsv(csvOptions);
        }
    }
    print(event) {
        if (this.printPending) {
            this.printPending = false;
            setTimeout(function () { window.print(); }, 2000);
            setTimeout(function () { window.close(); }, 2000);
        }
    }
    currencyFormatter = (params) => {
        if (isNaN(params.value)) {
            return 0;
        }
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(params.value)
    }

    percentFormatter = (params) => {
        return new Intl.NumberFormat('en-US', { 
            style: 'percent', 
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(params.value)
    }

    render() {
        let report = this.props.report;

        if (!report || !report.properties) {
            return null;
        }

        return <div className="report">
            <Row>
                <Col sm={12}>
                {
                    !this.props.print &&
                    <div className="pull-right">
                        <ButtonGroup>
                            <Button onClick={this.exportAsCsv}>CSV</Button>
                            <Link to={'/user/reports/' + report.id + '/p'} target="_blank">
                                <Button>Print</Button>
                            </Link>
                    </ButtonGroup>

                    
                    </div>
                }
                </Col>
            </Row>

            <ReportHeader date={report.date} />
            
            <div className="report-title">
                <h1>{report.name}</h1>
            </div>
            <div>
                <h3>Assumptions</h3>
                <ListAssumptions assumptions={report.assumptions} />
            </div>

            <div style={{ height: this.state.height, width: this.state.width}} className="report-body ag-theme-balham">
                <AgGridReact
                    onGridReady={this.onGridReady}
                    //onAnimationQueueEmpty={this.onAnimationQueueEmpty}
                    enableSorting={true}
                    enableFilter={false}
                    enableColResize={true}
                    pagination={!this.props.print}
                    paginationPageSize={50}
                    //paginationAutoPageSize={true}
                    //columnDefs={columns}
                    rowData={report.properties}>
                    {
                        report.columns.map((c, i) => {
                            let valueFormatter = null;
                            if (c.type === "currency") {
                                valueFormatter = this.currencyFormatter;
                            }
                            if (c.type === "percent") {
                                valueFormatter = this.percentFormatter;
                            }
                            let suppressSizeToFit = false;
                            let cellRenderer = null;
                            if (i===0) {
                                suppressSizeToFit = true;
                                cellRenderer = LinkCellRenderer
                            }
                            return <AgGridColumn key={c.name} headerName={c.name} field={c.field} valueFormatter={valueFormatter} 
                                suppressSizeToFit={suppressSizeToFit} 
                                cellRendererFramework={cellRenderer} />
                        })
                    }
                </AgGridReact>
            </div>

            <MlsDislcaimer text={report.mlsdisclaimer} copyright={report.mlscopyright} />
        </div>
    }
}

export default MultiPropertyReport