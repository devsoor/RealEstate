import React, {Component} from "react"
import {Button, Card, CardBody, CardTitle, Alert } from "reactstrap"

import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import BootstrapTable from 'react-bootstrap-table-next';
import {BreadcrumbsItem} from 'react-breadcrumbs-dynamic';
import paginationFactory from 'react-bootstrap-table2-paginator';
import {Link} from "react-router-dom";

import Confirm from 'react-confirm-bootstrap';
import {withSettings} from "../../api/SettingsProvider";
import { getMembers, createMember, getTenantSettings, deleteMember } from '../../api/PropertyApi';
import Can, {Authorization} from "../auth/Authorization/Can";
import {Storage} from "aws-amplify";
import LoaderButton from "../common/LoaderButton/LoaderButton";
import {CreateUserForm} from "./CreateUserForm";
import Loader from 'react-loader-advanced';

class SiteMemberList extends Component {
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
        getMembers(this.state.tenantId).then((users) => {
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
        createMember(this.state.tenantId, newUser ).then((user) => {
            this.setState({addingUser: false, created: true});
            this.loadUserList();
        })
        .catch((e)=> {
            this.setState({created: false, error: e.response.data});
        })
        .finally(() => {
            this.setState({creating: false});
        })
    }

    handleDeleteUser = async(email) => {
        deleteMember(this.state.tenantId, email).then(() => {
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
                dataField: 'UserStatus',
                text: 'Status',
                sort: true
            },
            {
                text: 'Delete',
                dataField:'delete',
                formatter: (cell, row) => {
                  const member_email = row.email;
                  return <div>
                      <Confirm onConfirm={() => this.handleDeleteUser(member_email)}
                            body={`Are you sure you want to delete this site member '${member_email}'?`}
                            confirmText="Confirm Delete"
                            title="Delete Member">
                            <LoaderButton color="danger">Delete</LoaderButton>
                        </Confirm>
                    </div>
                }
              }
        ];
        if (!this.state.tenant) {
            return null;
        }
        const seatsRemaining = this.state.tenant.num_members < this.state.tenant.max_members;
        return <Loader show={this.state.loading} message={'loading'}><div>
            <BreadcrumbsItem to={`${match.url}/members`}>Members</BreadcrumbsItem>
            <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">
                Manage Members for {this.state.tenant.agent_name} ({this.state.tenant.office_name})
            </CardTitle>
            <Card>
                <CardBody>
                    <BootstrapTable keyField='Username' data={ users } columns = {columns} pagination={ paginationFactory() } />
                </CardBody>
            </Card>

            <Can action="create" on="members">
                {
                    seatsRemaining &&
                    <div>
                        <Button className="btn btn-info" onClick={this.addNewUser}>Add Member</Button>

                        {this.state.addingUser &&
                            <CreateUserForm onCreate={this.handleCreateUser} error={this.state.error} loading={this.state.creating} />
                        }
                        {this.state.created &&
                            <h3>Created member successfully</h3>
                        }
                    </div>
                }
                {
                    !seatsRemaining &&
                    <Alert color="warning">Your current site settings do not allow you add more team members.</Alert>
                }

            </Can>

        </div>
        </Loader>
    }
}

export default Authorization(withSettings(SiteMemberList), "read", "members");
