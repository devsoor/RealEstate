import React from "react";
// import {Row, Col, Image} from "react-bootstrap";
import {Row, Col} from "reactstrap";

import { Card, CardBody } from 'reactstrap';

import { withSettings } from "../../api/SettingsProvider";

const ReportHeaderComponent = (props) => {
    const settings = props.settings;
    if (!settings) {
        return null;
    }
    const date = props.date ? new Date(props.date) : new Date();
    return <Row className="report-header" className={props.fontsize} style={{padding:10}}>
        <Col xs="12" md="6">
            <div className="logo">
                <img src={settings.logo_url} alt={settings.office_name} />
                <div className="logo-caption">{settings.logo_caption}</div>
                {
                    !settings.logo_url &&
                    <div>{settings.office_name}</div>
                }
            </div>
        </Col>
        <Col xs="12" md="6" >
            <div className="report-image">
                <div>
                    {
                        settings.agent_photo &&
                        <img src={settings.agent_photo} rounded="true" />
                        
                    }
                </div>
                <div>
                    <div>
                        <span>Prepared by:</span> {settings.agent_name}, {settings.agent_title}</div>
                    <div>{settings.agent_email}, {settings.agent_phone}</div>
                    <div>
                        <span>Created on: </span>{date.toLocaleDateString()}<br />
                    </div>
                </div>
            </div>
        </Col>
    </Row>
}

export const ReportHeader = withSettings(ReportHeaderComponent);