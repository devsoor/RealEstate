import React from 'react';
import config from '../../api/config';
import StaticContent from '../common/StaticContent';
import { withSettings } from '../../api/SettingsProvider';

export const TermsOfService = (props) => {
    return <StaticContent url={config.content.tos} />
}
export const PrivacyPolicy = (props) => {
    return <StaticContent url={config.content.privacy} />
}
export const BetaLicenseAgreement = (props) => {
    return <StaticContent url={config.content.beta_agreement} />
}
export const AgentLicenseAgreement = (props) => {
    return <StaticContent url={config.content.agent_agreement} />
}

const DmcaNoticeTemplate = (props) => {
    let office_email = "";
    let address = "";
    let agent_name = "";
    if (props.settings) {
        office_email = props.settings.office_email;
        if (props.settings.office_address) {
            address = '<span style="white-space:pre-wrap;">' + props.settings.office_address + '</span>';
        }
        agent_name = props.settings.office_name;
    }
    return <StaticContent url={config.content.dmca} email={office_email} address={address} agent_name={agent_name}/>
}

export const DmcaNotice = withSettings(DmcaNoticeTemplate);