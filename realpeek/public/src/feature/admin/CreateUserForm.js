import React, {Component} from "react"
import { FormControl, HelpBlock} from "react-bootstrap"
import {Form, Input, Alert} from "reactstrap"

import {FormField} from './HorizontalFormField'
import LoaderButton from "../common/LoaderButton/LoaderButton";

class CreateUserForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: {value: '', isValid: true, message: ''},
            temp_password: {value: '', isValid: true, message: ''}
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

    handleSubmit = (e) => {
        e.preventDefault();
        const user = {
            email: this.state.email.value,
            temp_password: this.state.temp_password.value
        }
        this.props.onCreate(user);
    }

    render() {
        return <Form horizontal onSubmit={this.handleSubmit}>
            {
                this.props.error &&
                <Alert color="danger">{this.props.error}</Alert>
            }
                <FormField controlId="email" label="Email Address">
                    <Input
                        required={this.props.required}
                        type="email"
                        value={this.state.email.value}
                        placeholder="Email"
                        onChange={this.handleChange}
                    />
                    <HelpBlock>Email address will be used to send a Welcome Email.</HelpBlock>
                </FormField>
            <LoaderButton type="submit" isLoading={this.props.loading} loadingText="Creating User...">
                Create User Account</LoaderButton>
        </Form>
    }
}

export { CreateUserForm}