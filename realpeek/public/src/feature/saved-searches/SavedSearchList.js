import React, {Component} from "react"
import {Button, CardTitle} from 'reactstrap';

import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import Confirm from 'react-confirm-bootstrap';

import { Link } from "react-router-dom"

const expandRow = {
    renderer: row => (
      <div>
          {row.description.map((d, i) => {
              return <p key={i}>{ d }</p>
          })}
      </div>
    ),
    showExpandColumn: true,
    expandByColumnOnly: true
  };

class SavedSearchList extends Component {
    constructor(props) {
        super(props);
    }


    handleDelete = (id) => {
        this.props.onDelete(id);
    }

    render() {
        let savedSearches = this.props.searches;
        const columns = [ 
            {
                dataField: 'name',
                text: 'Search Name',
                sort: true,
                formatter: function(cell, row) {
                    const id = row.id;
                    return (<Link to={'/search/' + id} >
                        <span>{cell}</span>
                    </Link>
            
                    );
                }
            },
            {
                dataField: 'email_frequency',
                text: 'Email Frequency',
                sort: true,
                formatter: function(cell, row) {
                    const frequency = row.email_frequency;
                    const day_of_week = row.email_day_of_week;
                    if (!frequency) {
                        return null;
                    }
                    const is_weekly = frequency.toLowerCase() === "weekly";
                    return <span>
                        {frequency}
                        {is_weekly && 
                        <span> (every {day_of_week})</span>
                        }
                    </span>;
                }
            },
            {
                text: 'Actions',
                dataField:'delete',
                formatter: (cell, row) => {
                  const id = row.id;
                  return <div>
                      <Link to={`${this.props.match.url}/${id}/edit`}><Button color="info" className="mdi mdi-pencil"> Edit</Button></Link>

                      <Confirm onConfirm={() => this.handleDelete(id)}
                            body={`Are you sure you want to delete this search '${row.name}' and stop all email alerts?`}
                            confirmText="Confirm Delete"
                            title="Delete Search">
                            <Button color="danger">Delete</Button>
                        </Confirm>
                        
                    </div>
                }
            }
        ];
        return <div>
        <CardTitle className="bg-info border-bottom p-3 mb-4 h3 text-white">Saved Searches</CardTitle>

            <BootstrapTable keyField='id' data={ savedSearches } columns = {columns} pagination={ paginationFactory() } expandRow={ expandRow } />
        </div>
    }
}

export default SavedSearchList