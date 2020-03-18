import React, {Component} from "react"
import { HelpBlock, Image } from "react-bootstrap";
import {Row, Col, Form, FormGroup, Label, Input, Button, Card, CardBody, CardTitle } from "reactstrap";

import LoaderButton from "../common/LoaderButton/LoaderButton";
import {FormField} from './HorizontalFormField';
import { withSettings } from "../../api/SettingsProvider";

class AgentProfileComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            create_account:  {value: true},
            tenant_id: {value: ''},
            tenant_type: {value: '', isValid: true, message: ''},
            site_name: {value: '', isValid: true, message: ''},
            show_landing_page: {value: '', isValid: true, message: ''},
            max_members: {value: 1, isValid: true, message: ''},
            agent_name: {value: '', isValid: true, message: ''},
            agent_title: {value: '', isValid: true, message: ''},
            agent_email: {value: '', isValid: true, message: ''},
            agent_phone: {value: '', isValid: true, message: ''},
            agent_photo: {value: '', isValid: true, message: ''},
            office_name: {value: '', isValid: true, message: ''},
            office_email: {value: '', isValid: true, message: ''},
            office_address_street: {value: '', isValid: true, message: ''},
            office_address_city: {value: '', isValid: true, message: ''},
            office_address_state: {value: '', isValid: true, message: ''},
            office_address_zip: {value: '', isValid: true, message: ''},
            logo_url: {value: '', isValid: true, message: ''},
            logo_caption: {value: '', isValid: true, message: ''},
            admin_email: {value: '', isValid: true, message: ''},
            temp_password: {value: '', isValid: true, message: ''}
        }
    }

    componentWillMount() {
        if (this.props.tenant && this.props.mode === "edit") {
            const newState = {...this.state};
            for (var field in this.props.tenant) {
                if (field in newState) {
                    newState[field].value = this.props.tenant[field];
                }
            }
            this.setState(newState);
        }
    }


    handleFileSelect = (e) => {
        const field = e.target.id;
        const files = e.target.files;
        const newState = {};


        newState[field] = {
            value: files[0], 
            isValid: files.length > 0, 
            message: '',
            preview: files.length > 0 ? URL.createObjectURL(files[0]) : null
        }
        this.setState(newState);
    }

    handleCheckboxChange = (e) => {
        const field = e.target.id;
        const newState = {};
        newState[field] = {
            value: e.target.checked
        }
        this.setState(newState);
    }

    handleChange = (e) => {
        const field = e.target.id;
        const newState = {};
        newState[field] = {
            value: e.target.value, isValid: true, message: ''
        }
        this.setState(newState);
    }

    handleSubmit = async (e) => {
        e.preventDefault();

        const tenant = {
            tenant_id: this.state.tenant_id.value,
            site_name: this.state.site_name.value,
            show_landing_page: this.state.show_landing_page.value,
            max_members: this.state.max_members.value,
            agent_name: this.state.agent_name.value,
            agent_title: this.state.agent_title.value,
            agent_email: this.state.agent_email.value,
            agent_phone: this.state.agent_phone.value,
            agent_photo: this.state.agent_photo.value.name,
            agent_photo_data: this.state.agent_photo.value,
            office_name: this.state.office_name.value,
            office_address_street: this.state.office_address_street.value,
            office_address_city: this.state.office_address_city.value,
            office_address_state: this.state.office_address_state.value,
            office_address_zip: this.state.office_address_zip.value,
            office_email: this.state.office_email.value,
            logo_url: this.state.logo_url.value.name,
            logo_photo_data: this.state.logo_url.value,
            logo_caption: this.state.logo_caption.value,
            admin_email: this.state.admin_email.value,
            temp_password: this.state.temp_password.value,
        }
        this.props.onSubmit(tenant);
    }

    render() {
        const profileRequired = this.props.mode !== "create";
        return <div>
            <Form  horizontal onSubmit={this.handleSubmit}>
                {
                    this.props.mode === "create" &&
                    <div>
                        <Card>
                            <CardBody>
                                <FormField id="site_name" label="Site Name">
                                    <Input
                                            required
                                            type="text"
                                            value={this.state.site_name.value}
                                            placeholder="Site Name"
                                            onChange={this.handleChange}
                                    />
                                    <HelpBlock>Unique name for your site. Investors will see your site at http://invest.realpeek.com/yoursitename</HelpBlock>
                                </FormField>

                                <FormField id="show_landing_page" label="Show Default Landing Page">
                                    <Input type="checkbox" id="show_landing_page" value={this.state.show_landing_page.value} onChange={this.handleCheckboxChange}>
                                    </Input>
                                </FormField>

                                <FormField id="max_members" label="Max # Members">
                                    <Input
                                            required
                                            type="number"
                                            value={this.state.max_members.value}
                                            placeholder="Max Members"
                                            onChange={this.handleChange}
                                    />
                                    <HelpBlock>Maximum number of members allowed.</HelpBlock>
                                </FormField>

                                <FormField id="admin_email" label="Admin Email Address">
                                    <Input
                                        required={this.state.create_account.value}
                                        disabled={!this.state.create_account.value}
                                        type="text"
                                        value={this.state.admin_email.value}
                                        placeholder="Admin Email"
                                        onChange={this.handleChange}
                                    />
                                    <HelpBlock>Email address of the site admin.  This will create an admin account and send a welcome email with login instructions.</HelpBlock>
                                </FormField>
                            </CardBody>
                        </Card>
                    </div>
                }

                <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">
                     Brokerage Info
                </CardTitle>
                <Card>
                    <CardBody>
                    <FormField id="office_name" label="Brokerage Name">
                            <Input
                                required={profileRequired}
                                type="text"
                                value={this.state.office_name.value}
                                placeholder="Brokerage Name"
                                onChange={this.handleChange}
                            />
                    </FormField>
                    <FormField id="office_address_street" label="Brokerage Street Address">
                        <Input
                            required={profileRequired}
                            type="text"
                            value={this.state.office_address_street.value}
                            placeholder="Brokerage Street Address"
                            onChange={this.handleChange}
                        />
                    </FormField>
                    <FormField id="office_address_city" label="Brokerage City">
                        <Input
                            required={profileRequired}
                            type="text"
                            value={this.state.office_address_city.value}
                            placeholder="Brokerage City"
                            onChange={this.handleChange}
                        />
                    </FormField>
                    <FormField id="office_address_state" label="Brokerage State">
                        <Input
                            required={profileRequired}
                            type="text"
                            value={this.state.office_address_state.value}
                            placeholder="Brokerage State"
                            onChange={this.handleChange}
                        />
                    </FormField>
                    <FormField id="office_address_zip" label="Brokerage Zip Code">
                        <Input
                            required={profileRequired}
                            type="text"
                            value={this.state.office_address_zip.value}
                            placeholder="Brokerage Zip Code"
                            onChange={this.handleChange}
                        />
                    </FormField>
                    <FormField id="office_email" label="Brokerage Email">
                        <Input
                            required={profileRequired}
                            type="text"
                            value={this.state.office_email.value}
                            placeholder="Brokerage Email"
                            onChange={this.handleChange}
                        />
                    </FormField>
                    <FormField id="logo_url" label="Logo">
                        {this.state.logo_url.value &&
                            <Image height="65px" src={this.state.logo_url.preview || this.state.logo_url.value} />
                        }

                        <Input
                            required={profileRequired && !this.state.logo_url.value}
                            type="file"
                            accept="image/*"
                            placeholder="Logo"
                            onChange={this.handleFileSelect}
                        />
                    </FormField>
                    <FormField id="logo_caption" label="Logo Caption">
                        <Input
                            type="text"
                            value={this.state.logo_caption.value}
                            placeholder="Logo Caption"
                            onChange={this.handleChange}
                        />
                        <HelpBlock>Optional caption to use if logo does not include Brokerage name.</HelpBlock>
                    </FormField>

                    <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">
                    Agent/Team Info
                    </CardTitle>
                    <FormField id="agent_name" label="Agent Name">
                        <Input
                            required={profileRequired}
                            type="text"
                            value={this.state.agent_name.value}
                            placeholder="Agent Name"
                            onChange={this.handleChange}
                        />
                    </FormField>
                    <FormField id="agent_title" label="Agent Title">
                        <Input
                            required={profileRequired}
                            type="text"
                            value={this.state.agent_title.value}
                            placeholder="Agent Title"
                            onChange={this.handleChange}
                        />
                    </FormField>
                    <FormField id="agent_email" label="Agent Email">
                        <Input
                            required={profileRequired}
                            type="text"
                            value={this.state.agent_email.value}
                            placeholder="Agent Email"
                            onChange={this.handleChange}
                        />
                    </FormField>
                    <FormField id="agent_phone" label="Agent Phone">
                        <Input
                            required={profileRequired}
                            type="text"
                            value={this.state.agent_phone.value}
                            placeholder="Agent Phone"
                            onChange={this.handleChange}
                        />
                    </FormField>
                    <FormField id="agent_photo" label="Agent Photo">
                        {this.state.agent_photo.value &&
                            <Image height="65px" src={this.state.agent_photo.preview || this.state.agent_photo.value} />
                        }
                        <CardBody>
                            <Input
                                required={profileRequired && !this.state.agent_photo.value}
                                type="file"
                                accept="image/*"
                                placeholder="Agent Photo"
                                onChange={this.handleFileSelect}
                                help="Upload agent headshot or team logo."
                            />
                        </CardBody>
                    </FormField>
                    </CardBody>
                </Card>

                <LoaderButton type="submit" className="btn btn-info" isLoading={this.props.loading} loadingText="Submitting...">
                {this.props.mode === "edit" ? "Save Changes" : "Register"} </LoaderButton>
            </Form>
        </div>
    }
}

const AgentProfile = withSettings(AgentProfileComponent);
export { AgentProfile };