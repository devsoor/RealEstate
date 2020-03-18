import React, {Component} from "react"
import { Alert } from 'reactstrap';

import {Authorization} from "../auth/Authorization/Can";
import {Storage} from "aws-amplify";
import {BreadcrumbsItem} from "react-breadcrumbs-dynamic";
import { getTenantSettings, updateTenantSettings } from '../../api/PropertyApi';
import LoaderButton from "../common/LoaderButton/LoaderButton";
import {CreateUserForm} from './CreateUserForm';
import {FormField} from './HorizontalFormField';
import {AgentProfile} from './AgentProfile';
import {withSettings} from "../../api/SettingsProvider";

class EditAgentProfile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            error: '',
            tenant: null
        }
    }

    async componentWillMount() {
        let tenantId = this.props.match.params.id;
        if (!tenantId) {
            tenantId = this.props.settings.tenant_id;
        }

        if (tenantId) {
            const tenant = await getTenantSettings(tenantId);
            this.setState({tenant});
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

        updateTenantSettings(tenant).then(async (updatedTenant) => {
            try {
                const path = updatedTenant.tenant_id;

                const photo = await this.s3Upload(this.agent_photo_data, path);
                const logo = await this.s3Upload(this.logo_photo_data, path);
                this.props.refreshSettings();
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
        const match=this.props.match;
        if (!tenant) {
            return null;
        }
        const status = tenant.registration_status;
        return <div>
            
            <BreadcrumbsItem to={`${match.url}/profile`}>{tenant.site_name}</BreadcrumbsItem>
                {
                status != 'ACTIVE' &&
                <Alert color="danger">
                    Please set up your Agent Profile.  You will not able to access RealPeek functionality until your profile is complete.
                </Alert>
            }

            <AgentProfile tenant={tenant} onSubmit={this.handleSubmit} loading={this.state.loading} error={this.state.error} mode="edit" />
        </div>

    }
}

export default Authorization(withSettings(EditAgentProfile), "update", "tenant")
