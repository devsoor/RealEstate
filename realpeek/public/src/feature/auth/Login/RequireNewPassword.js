import React, { Component } from 'react';
import { FormGroup, Input, Label, Alert } from "reactstrap";
import {Link} from "react-router-dom";

import { Auth } from "aws-amplify";
import { BetaLicenseAgreement} from '../../disclaimers/RealPeekDisclaimers'
import LoaderButton from '../../common/LoaderButton/LoaderButton'
import "./Login.css";
import { PasswordFormControl } from '../PasswordFormControl';

export default class RequireNewPassword extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            password: '',
            firstName: '',
            lastName: '',
            agreeToLicense: false,
            error: null
        }
        this.change = this.change.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    validateForm() {
        return this.state.agreeToLicense &&
        this.state.password.length > 0 &&
        this.state.firstName.length > 0 &&
        this.state.lastName.length > 0 ;
    }

    handleInputChange(event) {
        const id = event.target.id;
        const value = event.target.value;
        const newState = {};
        newState[id] = value;
        this.setState(newState);
    }

    change(event) {
        event.preventDefault();
        this.setState({isLoading: true});
        const user = this.props.authData;
        const password = this.state.password;
        const requiredAttributes = {
            given_name: this.state.firstName,
            family_name: this.state.lastName
        }
        
        Auth.completeNewPassword(user, password, requiredAttributes)
            .then(user => {
                this.props.onSuccess();
            })
            .catch(err => {
                this.setState({error: err.message});
            })
            .finally(() => {
                this.setState({isLoading: false});
            });
    }


    render() {
        const { hide } = this.props;
        if (hide && hide.includes(RequireNewPassword)) { return null; }

        return (
            <div className="Login">
            <form onSubmit={this.change}>
                <h1>Change Password</h1>

                {this.state.error && 
                    <Alert bsStyle="danger">
                    <strong>{this.state.error}</strong>
                    </Alert>
                }
                <FormGroup>
                <Label>First Name (REQUIRED)</Label>
                <Input id="firstName"
                  autoFocus
                  size="lg"
                  type="text"
                  value={this.state.firstName}
                  onChange={this.handleInputChange}
                />
              </FormGroup>
              <FormGroup>
                <Label>Last Name (REQUIRED)</Label>
                <Input id="lastName"
                  type="text"
                  size="lg"
                  value={this.state.lastName}
                  onChange={this.handleInputChange}
                />
              </FormGroup>
              <PasswordFormControl passwordControlId="password" password={this.state.password} onChange={this.handleInputChange} />
              {/* <FormGroup controlId="password" bsSize="large">
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
              </FormGroup> */}
            
                <FormGroup check>
                    <Label check>
                        <Input type="checkbox" required value={this.state.agreeToLicense} onChange={(e)=>this.setState({agreeToLicense: e.target.checked})} />{' '}
                            I agree to the <Link to="/privacy" target="_blank">Privacy Policy</Link> and 
                            <Link to="/tos" target="_blank"> Terms and Conditions</Link>                    </Label>
                </FormGroup>
{/* 
                <Checkbox required value={this.state.agreeToLicense} onChange={(e)=>this.setState({agreeToLicense: e.target.checked})}>
                I agree to the <Link to="/privacy" target="_blank">Privacy Policy</Link> and 
                <Link to="/tos" target="_blank"> Terms and Conditions</Link>
                </Checkbox>
              </FormGroup> */}
              <LoaderButton
                    block
                    size="lg"
                    disabled={!this.validateForm()}
                    type="submit"
                    isLoading={this.state.isLoading}
                    text="Change"
                    loadingText="Changing Password"
                />
            </form>
                    {/* <Button onClick={() => this.props.onSuccess}>
                    Back to Sign In
                    </Button> */}
          </div>
        )
    }
}