import React, { Component }  from "react";
import {Button, Card, CardBody, CardTitle, Alert } from "reactstrap"

import {Authorization} from "../auth/Authorization/Can";
import EditAssumptions from "../cmaAssumptions/EditAssumptions";
import {withSettings} from '../../api/SettingsProvider';
import {getSiteAssumptions, updateSiteAssumptions} from '../../api/PropertyApi';

class SiteAssumptions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            assumptions: null,
            isSaving: false
        }
    }
    componentWillMount() {
        const site_id = this.props.settings.tenant_id;
        getSiteAssumptions(site_id).then((assumptions) => {
            this.setState({assumptions: assumptions.parameters});
        })
    }

    
    handleAssumptionsChanged = (assumptions) => {
        const site_id = this.props.settings.tenant_id;
        this.setState({isSaving:true, assumptions});
        updateSiteAssumptions(site_id, assumptions).then(() => {
        })
        .finally(() => {
            this.setState({isSaving: false});
        })
    }

    render() {
        return <div>
        <EditAssumptions assumptions={this.state.assumptions} onAssumptionsChange={this.handleAssumptionsChanged} type="site" isSaving={this.state.isSaving} />
        </div>
    }
}

export default Authorization(withSettings(SiteAssumptions), "update", "siteassumptions")