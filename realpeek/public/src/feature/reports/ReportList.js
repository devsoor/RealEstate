import React, {Component} from "react"
import {Button, CardTitle} from "reactstrap";

import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import cellEditFactory from 'react-bootstrap-table2-editor';

import { Link } from "react-router-dom"
import LoaderButton from "../common/LoaderButton/LoaderButton";



class ReportList extends Component {
    constructor(props) {
      super(props);
      this.state = {
        deleting: false
      }
    }
    cellEdit = cellEditFactory({
      mode: 'click',
      blurToSave: true
    });

    viewReportFormatter(cell, row) {
        return (<Link to={'/user/reports/' + cell} >
            <span>View Report</span>
        </Link>
        );
      }

    onTableChange = (type, { data, cellEdit: { rowId, dataField, newValue } }) => {
      if (type === "cellEdit") {
        this.props.onUpdate(rowId, dataField, newValue);
      }
    }

    handleDelete = (id) => {
      this.props.onDelete(id)
    }

    render() {
        let reports = this.props.reports;
        const columns = [{
            dataField: 'id',
            text: '',
            formatter: this.viewReportFormatter,
            editable: false
          }, {
            dataField: 'name',
            text: 'Report Name',
            sort: true,
            validator: (newValue, row, column) => {
              if (!newValue.length) {
                return {
                  valid: false,
                  message: 'Please enter a name'
                };
              }
              return true;
            }
          }, {
            dataField: 'owner',
            text: 'Report Owner',
            sort: true,
            editable: false
          },
          {
            dataField: 'date',
            text: 'Created Date',
            sort: true,
            editable: false
          },
          {
            text: 'Delete',
            editable: false,
            dataField:'delete',
            formatter: (cell, row) => {
              const id = row.id;
              return <Button onClick={() => this.handleDelete(id)} color="danger"> Delete</Button>
            }
          }
        ];
        return <div>
          <CardTitle className="bg-info border-bottom p-3 mb-4 h3 text-white">Reports</CardTitle>

          <BootstrapTable keyField='id' data={ reports } columns = {columns}  pagination={ paginationFactory() }
          remote={ {
            filter: false,
            pagination: false,
            sort: false,
            cellEdit: true
          } }
          loading={ this.props.loading }
          onTableChange={ this.onTableChange }
          cellEdit={ this.cellEdit }
           />
           </div>
    }
}

export default ReportList