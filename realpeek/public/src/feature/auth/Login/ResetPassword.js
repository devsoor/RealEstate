import React, { Component } from 'react';
import { Button, FormGroup, FormControl, ControlLabel, Alert, HelpBlock, Checkbox } from "react-bootstrap";
import {Link} from "react-router-dom";

import { Auth } from "aws-amplify";
import LoaderButton from '../../common/LoaderButton/LoaderButton'
import "./Login.css";

export default class ResetPassword extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            new_password: '',
            code: '',
            error: null,
            success: false
        }
    }

    validateForm() {
        return this.state.new_password.length > 0 && this.state.code > 0;
    }

    handleInputChange = (event) => {
        const id = event.target.id;
        const value = event.target.value;
        const newState = {};
        newState[id] = value;
        this.setState(newState);
    }

    resetPassword = async (event) => {
        event.preventDefault();
        this.setState({isLoading: true});
        Auth.forgotPasswordSubmit(this.props.email.toLowerCase(), this.state.code, this.state.new_password)
            .then(data => {
                this.setState({success: true})
            })
            .catch(err => {
                this.setState({error: err.message});
            })
            .finally(() => {
                this.setState({isLoading: false})});
    }


    render() {
        if (this.state.success) {
            return <div className="Login">
            <form>
                <div><p>Your password was reset successfully.</p>
                <Link to={'login'}>Back to login</Link>
                </div>
            </form>
            </div>
        }
        return (
            <div className="Login">
            <form onSubmit={this.resetPassword}>
                <h2>Reset your Password</h2>
                <p>A password reset code was emailed to the address you provided.  Please enter the code and a new password to reset your password.</p>
                {this.state.error && 
                    <Alert bsStyle="danger">
                    <strong>{this.state.error}</strong>
                    </Alert>
                }
                <FormGroup controlId="code" bsSize="large">
                    <ControlLabel>Enter your password reset code</ControlLabel>
                    <FormControl
                    autoFocus
                    type="text"
                    value={this.state.code}
                    onChange={this.handleInputChange}
                    />
                </FormGroup>
                <FormGroup controlId="new_password" bsSize="large">
                    <ControlLabel>New Password (REQUIRED)</ControlLabel>
                    <FormControl
                    type="password"
                    value={this.state.password}
                    onChange={this.handleInputChange}
                    />
                    <HelpBlock>
                        <ul>
                            <li>Must be at least 8 characters.</li>
                            <li>Must contain at least one uppercase and one lowercase letter.</li>
                            <li>Must contain at least one number and one symbol.</li>
                        </ul> 
                    </HelpBlock>
                </FormGroup>

              <LoaderButton
                    block
                    bsSize="large"
                    disabled={!this.validateForm()}
                    type="submit"
                    isLoading={this.state.isLoading}
                    text="Reset Password"
                    loadingText=""
                />
            </form>
                    {/* <Button onClick={() => this.props.onSuccess}>
                    Back to Sign In
                    </Button> */}
          </div>
        )
    }
}