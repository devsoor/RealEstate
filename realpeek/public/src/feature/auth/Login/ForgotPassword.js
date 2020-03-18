import React, { Component } from 'react';
import { HelpBlock, Checkbox } from "react-bootstrap";
import { Button, FormGroup, Input, Label, Alert } from "reactstrap";
import {Link} from "react-router-dom";

import { Auth } from "aws-amplify";
import ResetPassword from "./ResetPassword";
import LoaderButton from '../../common/LoaderButton/LoaderButton'
import "./Login.css";

export default class ForgotPassword extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            email: '',
            codeSent: false,
            error: null
        }
    }

    validateForm() {
        return this.state.email.length > 0
    }

    handleInputChange = (event) => {
        const id = event.target.id;
        const value = event.target.value;
        const newState = {};
        newState[id] = value;
        this.setState(newState);
    }

    forgotPassword = async (event) => {
        event.preventDefault();
        this.setState({isLoading: true});
        await Auth.forgotPassword(this.state.email.toLowerCase())
            .then(data => {
                this.setState({codeSent: true});
            })
            .catch(err => {
                this.setState({error: err.message});
            })
            .finally(() => {
                this.setState({isLoading: false})});
    }


    render() {
        if (this.state.codeSent) {
            return <ResetPassword email={this.state.email} />
        }
        
        return (
            <div className="Login">
            <form onSubmit={this.forgotPassword}>
                <h2>Forgot your password?</h2>

                {this.state.error && 
                    <Alert color="danger">
                    <strong>{this.state.error}</strong>
                    </Alert>
                }
                <FormGroup>
                <Label>Enter your email address to reset your password</Label>
                <Input id="email"
                  autoFocus
                  type="text"
                  value={this.state.email}
                  onChange={this.handleInputChange}
                />
              </FormGroup>

              <LoaderButton
                    block
                    size="lg"
                    disabled={!this.validateForm()}
                    type="submit"
                    isLoading={this.state.isLoading}
                    text="Reset Password"
                    loadingText=""
                />

            <div className="SignUpLink">
            <Link to={'login'}>Back to login</Link>
            </div>
            </form>
                    {/* <Button onClick={() => this.props.onSuccess}>
                    Back to Sign In
                    </Button> */}
          </div>
        )
    }
}