import React, {Component} from "react"

import {Authorization} from "../auth/Authorization/Can";
import {BreadcrumbsItem} from "react-breadcrumbs-dynamic";
import { getTenantSettings } from '../../api/PropertyApi';

import {SiteConfiguration} from './SiteConfiguration';
import {withSettings} from "../../api/SettingsProvider";

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


    render() {
        const tenant = this.state.tenant;
        const match=this.props.match;
        if (tenant) {
            return <div>
                <BreadcrumbsItem to={match.url}>{tenant.site_name}</BreadcrumbsItem>
                <SiteConfiguration site={tenant} onSubmit={this.handleSubmit} loading={this.state.loading} error ={this.state.error} readonly={true} />
            </div>
        }
        return null;
    }
}

export default Authorization(withSettings(EditSiteConfiguration), "update", "tenant")
