import React, { Component } from "react";
import {
  HelpBlock, Form,
  FormGroup,
  FormControl,
  ControlLabel, Checkbox, Alert, OverlayTrigger, Popover
} from "react-bootstrap";
import FormControlFeedback from "../common/form/FormControlFeedback";

function hasLowerCase(str) {
    return str.toUpperCase() != str;
}

function hasUpperCase(str) {
    return str.toLowerCase() != str;
}
const passwordHelpPopover = (
    <Popover id="password-help">
      <HelpBlock>
            <h5>Password Requirements</h5>
                    <ul>
                        <li>Must be at least 8 characters.</li>
                        <li>Must contain at least one uppercase and one lowercase letter.</li>
                        <li>Must contain at least one number and one symbol.</li>
                    </ul> 
                </HelpBlock>
    </Popover>
  );

export class PasswordFormControl extends Component {
    constructor(props) {
        super(props);

        this.state = {
            password: { validatationState: null, error: null},
            confirmPassword: { validatationState: null, error: null},

        }
    }

    validatePassword = () => {
        const password = this.props.password;
        const length = password.length;
        let validationState = null;
        let error = null;

        if (length> 0) {
            if (0 < length && length < 8) {
                validationState = 'error';
                error = 'Password must be at least 8 characters.'
            }
            else if (!hasUpperCase(password) || !hasLowerCase(password)) {
                validationState = 'error';
                error = 'Password must contain at least one uppercase and one lowercase letter'
            }
            else {
                validationState = 'success';
            }
        }
        this.setState((prevState) => { 
            return {password: {
                validationState: validationState,
                error: error}}
        })
    }

    validateConfirmPassword = () => {
        let password = this.props.password;
        let confirmPassword = this.props.confirmPassword;
        let validationState = null;
        let error = null;
        if (password && confirmPassword) {
            if (password=== confirmPassword) {
                validationState = 'success';
            } else {    
                validationState = 'error';
                error = 'Password and Confirm Password do not match';
            }
        }
        this.setState((prevState) => { 
            return {confirmPassword: {
                validationState: validationState,
                error: error}}
        })
    }


  render() {
      const confirmPassword = this.props.confirmPasswordControlId;
      const passwordControlId = this.props.passwordControlId;
      const confirmPasswordControlId = this.props.confirmPasswordControlId;
      
        return (
            <div>
            <FormGroup controlId={passwordControlId} bsSize="large" validationState={this.state.password.validationState}>
            <ControlLabel>Password * </ControlLabel>
            <OverlayTrigger trigger="focus" placement="top" overlay={passwordHelpPopover}>
            <FormControl
                value={this.props.password}
                onChange={this.props.onChange}
                onBlur={this.validatePassword}
                type="password"
                />
            </OverlayTrigger>
    
            <FormControl.Feedback />

            <FormControlFeedback validationState={this.state.password.validationState}>{this.state.password.error}</FormControlFeedback>
        </FormGroup>
        {
            confirmPasswordControlId && 
            <FormGroup controlId={confirmPasswordControlId} bsSize="large" validationState={this.state.confirmPassword.validationState}>
                <ControlLabel>Confirm Password * </ControlLabel>
                <FormControl
                disabled={this.state.password.validationState === 'error'}
                value={this.props.confirmPassword}
                onChange={this.props.onChange}
                onBlur={this.validateConfirmPassword}
                type="password"
                />
                <FormControl.Feedback />

                <FormControlFeedback validationState={this.state.confirmPassword.validationState}>{this.state.confirmPassword.error}</FormControlFeedback>
            </FormGroup>
        }
        {/* <HelpBlock>
            <h5>Password Requirements</h5>
                    <ul>
                        <li>Must be at least 8 characters.</li>
                        <li>Must contain at least one uppercase and one lowercase letter.</li>
                        <li>Must contain at least one number and one symbol.</li>
                    </ul> 
                </HelpBlock> */}
                </div>
        );
  }
}