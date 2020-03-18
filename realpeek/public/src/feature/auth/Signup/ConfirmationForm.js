import React, { Component } from "react";
import {
  FormControl,
  ControlLabel
} from "react-bootstrap";

import {
  FormGroup,
  Input,
  Label, Alert, Button
} from "reactstrap";
import LoaderButton from "../../common/LoaderButton/LoaderButton"
import { Auth } from "aws-amplify";
import "./Signup.css";

class ConfirmationForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      confirmationCode: "",
      newUser: null, 
      error: null
    };
  }

  validateConfirmationForm() {
    return this.state.confirmationCode.length > 0;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleResendCode = async event => {
    event.preventDefault();
    this.setState({ isLoading: true });
    try {
        await Auth.resendSignUp(this.props.email);
        this.setState({error: null})
      } catch (e) {
          this.setState({error: 'Error sending code.'})
      } finally {
          this.setState({ isLoading: false });
      }
  }

  handleConfirmationSubmit = async event => {
    event.preventDefault();

    this.setState({ isLoading: true });

    try {
      await Auth.confirmSignUp(this.props.email.toLowerCase(), this.state.confirmationCode);
      await Auth.signIn(this.props.email.toLowerCase(), this.props.password);
  
      this.props.onConfirm();
    } catch (e) {
        this.setState({error: e.message})
    } finally {
        this.setState({ isLoading: false });
    }
  }

  render() {
    return (
      <form onSubmit={this.handleConfirmationSubmit}>
      <h2>Verify Your Email Address</h2>
      <p>A verification code has been sent to your email address.  Please enter it here to finish setting up your account.</p>
      {this.state.error && 
            <Alert color="danger">
            <strong>{this.state.error}</strong>
            </Alert>
        }
        <FormGroup>
          <Label>Verification Code</Label>
          <Input id="confirmationCode"
            size="lg"
            autoFocus
            type="tel"
            value={this.state.confirmationCode}
            onChange={this.handleChange}
          />
        </FormGroup>
        <LoaderButton
          block
          size="lg"
          disabled={!this.validateConfirmationForm()}
          type="submit"
          isLoading={this.state.isLoading}
          text="Verify"
          loadingText="Verifying…"
        />
        <div className="SignUpLink">
          <Button onClick={this.handleResendCode}> Resend Verification Code</Button>
        </div>
      </form>
    );
  }

}

export default ConfirmationForm;