import React, {Component} from "react"
import {Button} from "reactstrap"

import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import BootstrapTable from 'react-bootstrap-table-next';
import {BreadcrumbsItem} from 'react-breadcrumbs-dynamic'
import Confirm from 'react-confirm-bootstrap';
import paginationFactory from 'react-bootstrap-table2-paginator';
import {Link} from "react-router-dom";

import {withSettings} from "../../api/SettingsProvider";
import {Authorization} from "../auth/Authorization/Can";
import {Storage} from "aws-amplify";
import { getTenants, deleteTenant } from '../../api/PropertyApi';
import LoaderButton from "../common/LoaderButton/LoaderButton";

class ViewSiteList extends Component {
    constructor(props) {
        super(props);
        this.state = {
          loading: false,
          deleting: false,
          tenants: []
        }
    }
    componentDidMount = () => {
        getTenants().then((tenants) => {
            this.setState({tenants});
        })
    }
    linkFormatter = (cell, row) => {
        const id = row.tenant_id;
        const site_name = row.site_name;
        return <a href={`${window.location.origin}/${site_name}`} target="_blank"><span>{cell}</span></a>

    }
    previewSettings = (tenant_id) => {
        this.props.previewSettings(tenant_id)
    }
    deleteSite = (tenant_id) => {
        this.setState({deleting: true});
        deleteTenant(tenant_id).then(() => {
            //refresh tenant list
            getTenants().then((tenants) => {
                this.setState({tenants});
            })
        })
        .finally(() => {
            this.setState({deleting: false});
        })
    }

    render() {
        const match=this.props.match;
        const location = window.location;
        const tenants = this.state.tenants;
        const columns = [ 
            {
                dataField: 'site_name',
                text: 'Site Name',
                sort: true,
                formatter: this.linkFormatter
            },
            {
                dataField: 'agent_name',
                text: 'Agent/Team Name',
                sort: true
            },
            {
                dataField: 'registration_status',
                text: 'Registration Status',
                sort: true,
                formatter: (cell, row) => {
                    const status = row.registration_status;
                    if (status) {
                        return status;
                    } else {
                        return "N/A (Legacy Site)"
                    }
                }
            },
            {
                text: 'Actions',
                editable: false,
                dataField:'delete',
                formatter: (cell, row) => {
                  const tenant_id = row.tenant_id;
                  const site_name = row.site_name;
                  return <div>
                      <Button onClick={() => this.previewSettings(tenant_id)} className="bg-success">Preview</Button>
                      <Link to={`${match.url}/${tenant_id}/profile`}><Button color="info">Manage</Button></Link>
                      <Confirm onConfirm={() => this.deleteSite(tenant_id)}
                            body={`Are you sure you want to delete site '${site_name}'?`}
                            confirmText="Confirm Delete"
                            title="Delete Site">
                            <LoaderButton color="danger">Delete</LoaderButton>
                        </Confirm>
                    </div>
                }
              }
        ];
        return <div>
            <h2>Sites</h2>
            <Link to={`${match.url}/register`}><Button bsStyle="info">Create New Site</Button></Link> 
            <BootstrapTable keyField='tenant_id' data={ tenants } columns = {columns} pagination={ paginationFactory() } />
        </div>
    }
}

export default Authorization(withSettings(ViewSiteList), "create", "tenant");
