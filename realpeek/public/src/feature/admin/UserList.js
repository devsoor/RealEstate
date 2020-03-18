import React, {Component} from "react"
import {Button, Card, CardBody, CardTitle, Alert } from "reactstrap"

import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min.css';
import BootstrapTable from 'react-bootstrap-table-next';
import {BreadcrumbsItem} from 'react-breadcrumbs-dynamic';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, { CSVExport } from 'react-bootstrap-table2-toolkit';
import {Link} from "react-router-dom";

import Confirm from 'react-confirm-bootstrap';
import {withSettings} from "../../api/SettingsProvider";
import { getUsers, createUser, deleteUser, getTenantSettings } from '../../api/PropertyApi';
import {Authorization} from "../auth/Authorization/Can";
import {Storage} from "aws-amplify";
import LoaderButton from "../common/LoaderButton/LoaderButton";
import {CreateUserForm} from "./CreateUserForm";
import Loader from 'react-loader-advanced';

const { ExportCSVButton } = CSVExport;

class UserList extends Component {
    constructor(props) {
        super(props);
        this.state = {
          loading: false,
          tenant: null,
          tenantId: null,
          addingUser: false,
          creating: false,
          created: false,
          error: null,
          users: []
        }
    }

    componentWillMount() {
        let tenantId = this.props.match.params.id;
        if (!tenantId) {
            tenantId = this.props.settings.tenant_id;
        }
        this.setState({tenantId}, () => {
            this.loadUserList();
        })
        getTenantSettings(tenantId).then((tenant) => {
            this.setState({tenant})
        })
    }
    loadUserList = async() => {
        this.setState({loading: true});
        getUsers(this.state.tenantId).then((users) => {
            this.setState({users: users.Users})
        })
        .finally(() => {
            this.setState({loading: false})
        })
    }
    addNewUser = () => {
        this.setState({addingUser: true});
    }
    handleCreateUser = async (newUser) => {
        this.setState({creating: true})
        createUser(this.state.tenantId, newUser ).then((user) => {
            this.setState({addingUser: false, created: true});
            this.loadUserList();
        })
        .catch((e)=> {
            const error = e.response.data;
            this.setState({created: false, error: error});
        })
        .finally(() => {
            this.setState({creating: false});
        })
    }
    handleDeleteUser = async(email) => {
        deleteUser(this.state.tenantId, email).then(() => {
            this.loadUserList();
        })
        .catch((e) => {
            this.setState({error: e.response.data});
        })
    }
    render() {
        const users = this.state.users;
        const match = this.props.match;
        const columns = [ 
            {
                dataField: 'email',
                text: 'Email',
                sort: true
            },
            {
                dataField: 'given_name',
                text: 'First Name',
                sort: true
            },
            {
                dataField: 'family_name',
                text: 'Last Name',
                sort: true
            },
            // {
            //     dataField: 'UserStatus',
            //     text: 'Status',
            //     sort: true
            // },
            {
                dataField: 'LastActivity',
                text: 'Last Activity',
                sort: true,
                formatter: (cell, row) => {
                    if (cell) {
                        var utcTime = new Date(cell);
                        var options = {
                            timeZoneName: 'short'
                        }
                        return utcTime.toLocaleString('en-us', options);
                    }
                    else {
                        return 'Unknown'
                    }
                }
            },
            {
                text: 'Delete',
                dataField:'delete',
                formatter: (cell, row) => {
                  const user_email = row.email;
                  return <div>
                      <Confirm onConfirm={() => this.handleDeleteUser(user_email)}
                            body={`Are you sure you want to delete this user '${user_email}'?`}
                            confirmText="Confirm Delete"
                            title="Delete User">
                            <LoaderButton color="danger">Delete</LoaderButton>
                        </Confirm>
                    </div>
                }
              }
        ];
        if (!this.state.tenant) {
            return null;
        }
        return <Loader show={this.state.loading} message={'loading'}><div>
            <BreadcrumbsItem to={match.url}>{this.state.tenant.site_name}</BreadcrumbsItem>
            <BreadcrumbsItem to={`${match.url}/users`}>Users</BreadcrumbsItem>
            <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">
                Manage Users for {this.state.tenant.agent_name} ({this.state.tenant.office_name})
            </CardTitle>
            <Card>
                <CardBody>
                    <ToolkitProvider keyField="Username" data={ users } columns={ columns } exportCSV={ {fileName: 'realpeek_users.csv'} }>
                            {
                                props => (
                                <div>
                                    <div className="pull-right">
                                        <ExportCSVButton className="bg-info text-white" { ...props.csvProps }>Export CSV</ExportCSVButton>
                                    </div>
                                    <BootstrapTable { ...props.baseProps }  pagination={ paginationFactory() } />
                                </div>
                                )
                            }
                            </ToolkitProvider>
                </CardBody>
            </Card>
            

            <Button className="btn btn-info" onClick={this.addNewUser}>Add User</Button>

            {this.state.addingUser &&
                <CreateUserForm onCreate={this.handleCreateUser} error={this.state.error} loading={this.state.creating} />
            }
            {this.state.created &&
                <h3>Created user successfully</h3>
            }

        </div>
        </Loader>
    }
}

export default Authorization(withSettings(UserList), "manage", "users");
