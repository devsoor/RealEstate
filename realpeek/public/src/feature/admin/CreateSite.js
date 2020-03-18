import React, {Component} from "react"
import {Authorization} from "../auth/Authorization/Can";
import { CardTitle } from 'reactstrap';
import {Storage} from "aws-amplify";
import {BreadcrumbsItem} from 'react-breadcrumbs-dynamic';
import {Link } from "react-router-dom"
import { registerTenant } from '../../api/PropertyApi';
import LoaderButton from "../common/LoaderButton/LoaderButton";
import {CreateUserForm} from './CreateUserForm';
import {FormField} from './HorizontalFormField';
import {AgentProfile} from './AgentProfile';

class CreateSite extends Component {
    constructor(props) {
        super(props);
        this.state = {
            created: false,
            loading: false,
            error: '',
            tenant: null
        }
    }

    componentWillMount() {
        if (this.props.tenant) {
            this.setState({tenant: this.props.tenant});
        }
    }

    s3Upload = async (file, path) => {
        const filename = `${path}/${file.name}`;
            
        const stored = await Storage.put(filename, file, {
          contentType: file.type
        });
      
        return stored.key;
    }

    handleSubmit = async (tenant) => {
        this.setState({loading: true});
        this.agent_photo_data = tenant.agent_photo_data;
        this.logo_photo_data = tenant.logo_photo_data;

        tenant.agent_photo = tenant.agent_photo;
        tenant.logo_url = tenant.logo_url;

        registerTenant(tenant).then(async (createdTenant) => {
            try {
                const path = createdTenant.tenant_id;

                const photo = await this.s3Upload(this.agent_photo_data, path);
                const logo = await this.s3Upload(this.logo_photo_data, path);
                this.setState({created: true});
            }
            catch (e) {
                this.setState({error: 'Error uploading photo'});
            }
        })
        .finally(() => {
            this.setState({loading:false});
        })
    }

    render() {
        const tenant = this.state.tenant;
        const match = this.props.match;
        // if (this.state.created) {
        //     return <h2>Site has been successfully created</h2>
        // }
        return <div>
            <BreadcrumbsItem to={match.url}>Create Site</BreadcrumbsItem>

            {
                this.state.created && 
                <div>
                    <h2>Site is being created.</h2>  
                    <h3>A welcome email will be sent to the site admin when it is complete.</h3>
                    <Link to={"/sites"}>Back to site list</Link>
                </div>
            }
            {
                !this.state.created &&
                <div>
                    <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">Create New Site</CardTitle>
                    <AgentProfile tenant={tenant} onSubmit={this.handleSubmit} loading={this.state.loading} error={this.state.error} mode="create" />
                </div>
            }
            </div>
    }
}

export default Authorization(CreateSite, "create", "tenant")
