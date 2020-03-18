import React, {Component} from "react"

import {Authorization} from "../auth/Authorization/Can";
import {withSettings} from "../../api/SettingsProvider";
import {BreadcrumbsItem} from "react-breadcrumbs-dynamic";
import { getTenantSettings, updateTenantSettings } from '../../api/PropertyApi';

import {SiteConfiguration} from '../admin/SiteConfiguration';


class EditSiteConfiguration extends Component {
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

        updateTenantSettings(tenant).then(async (updatedTenant) => {
        })
        .catch((e) => {
            const error = e.response.data;
            this.setState({error: error});
        })
        .finally(() => {
            this.setState({loading:false});
        })
    }

    render() {
        const tenant = this.state.tenant;
        const match=this.props.match;
        if (tenant) {
            return <div>
                <BreadcrumbsItem to={match.url}>{tenant.site_name}</BreadcrumbsItem>
                <SiteConfiguration site={tenant} onSubmit={this.handleSubmit} loading={this.state.loading} error ={this.state.error} readonly={false} />
            </div>
        }
        return null;
    }
}

export default Authorization(withSettings(EditSiteConfiguration), "update", "tenant")
