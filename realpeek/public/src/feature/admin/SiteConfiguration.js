import React, {Component} from "react"
import { Checkbox, HelpBlock } from "react-bootstrap"
import {Form, Input, Card, CardBody, CardTitle, Alert } from "reactstrap"


import LoaderButton from "../common/LoaderButton/LoaderButton";
import {FormField} from './HorizontalFormField';

export class SiteConfiguration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tenant_id: {value: ''},
            site_name: {value: '', isValid: true, message: ''},
            show_landing_page : {value: false, isValid: true, message: ''},
            max_members: {value: '', isValid: true, message: ''}
        }
    }

    componentWillMount() {
        if (this.props.site) {
            const newState = {...this.state};
            for (var field in this.props.site) {
                if (field in newState) {
                    newState[field].value = this.props.site[field];
                }
            }
            this.setState(newState);
        }
    }

    handleChange = (e) => {
        const field = e.target.id;
        const newState = {};
        newState[field] = {
            value: e.target.value, isValid: true, message: ''
        }
        this.setState(newState);
    }
    handleCheckbox = (e) => {
        const field = e.target.id;
        const newState = {};
        newState[field] = {
            value: e.target.checked, isValid: true, message: ''
        }
        this.setState(newState);
    }

    handleSubmit = async (e) => {
        e.preventDefault();

        const tenant = {
            tenant_id: this.state.tenant_id.value,
            site_name: this.state.site_name.value,
            show_landing_page: this.state.show_landing_page.value,
            max_members: this.state.max_members.value
        }
        this.props.onSubmit(tenant);
    }

    render() {
        return <div>
            {
                this.props.error &&
                <Alert color="danger">{this.props.error}</Alert>
            }
            <Form horizontal onSubmit={this.handleSubmit}>
                <CardTitle className="bg-info border-bottom p-3 mb-0 text-white">
                Site Configuration
                </CardTitle>
                <Card>
                    <CardBody>
                        <FormField id="site_name" label="Site Name">
                        <Input
                                required
                                type="text"
                                value={this.state.site_name.value}
                                placeholder="Site Name"
                                disabled={this.props.readonly}
                                onChange={this.handleChange}
                        />
                        <HelpBlock>Unique name for your site. Investors will see your site at http://invest.realpeek.com/yoursitename</HelpBlock>
                    </FormField>
                    <FormField id="show_landing_page" label="Show Default Landing Page">
                        <Checkbox id="show_landing_page" checked={this.state.show_landing_page.value} onChange={this.handleCheckbox} disabled={this.props.readonly}>
                        </Checkbox>
                    </FormField>
                    <FormField id="max_members" label="Max # Members">
                        <Input
                                required
                                type="number"
                                value={this.state.max_members.value}
                                placeholder="Max Members"
                                disabled={this.props.readonly}
                                onChange={this.handleChange}
                        />
                        <HelpBlock>Maximum number of members allowed.</HelpBlock>
                    </FormField>
                    </CardBody>
                </Card>


                {
                    !this.props.readonly && 
                    <LoaderButton type="submit" isLoading={this.props.loading} loadingText="Submitting...">
                        Save Changes
                    </LoaderButton>
                }
            </Form>
        </div>
    }
}

