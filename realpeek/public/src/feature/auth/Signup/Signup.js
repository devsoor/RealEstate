import React, { Component } from "react";
// import {
//   HelpBlock, Form,
//   FormGroup,
//   FormControl,
//   ControlLabel, Checkbox, Alert
// } from "react-bootstrap";
import {
  Form,
  FormGroup,
  Input,
  Label, Checkbox, Alert
} from "reactstrap";
import FormControlFeedback from "../../common/form/FormControlFeedback";
import {Link} from "react-router-dom";
import { Auth } from "aws-amplify";
import { signUp } from "../../../api/PropertyApi";
import LoaderButton from "../../common/LoaderButton/LoaderButton"
import "./Signup.css";
import {withSettings} from "../../../api/SettingsProvider"
import ConfirmationForm from "./ConfirmationForm"
import { PasswordFormControl } from "../PasswordFormControl";

function hasLowerCase(str) {
    return str.toUpperCase() != str;
}

function hasUpperCase(str) {
    return str.toLowerCase() != str;
}

class Signup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      email: { value: "", validatationState: null, error: null},
      firstName: { value: "", validatationState: null, error: null},
      lastName: { value: "", validatationState: null, error: null},
      password: { value: "", validatationState: null, error: null},
      confirmPassword: { value: "", validatationState: null, error: null},
      confirmationCode: { value: "", validatationState: null, error: null},
      agreeToLicense: false,
      newUser: null,
      error: null
    };
  }

    validateForm() {
        return (
            this.state.agreeToLicense &&
            this.state.email.value.length > 0 &&
            this.state.firstName.value.length > 0 &&
            this.state.lastName.value.length > 0 &&
            this.state.password.value.length > 0 &&
            this.state.password.value === this.state.confirmPassword.value
        );
    }


  handleChange = event => {
    const field = event.target.id;
    const newState = {};
    newState[field] = {
        value: event.target.value, validatationState: null, error: null
    }
    this.setState(newState);
  }

  handleSubmit = async event => {
    event.preventDefault();
    
    this.setState({ isLoading: true });
    try {
        const newUser = await signUp(this.state.email.value.toLowerCase(), this.state.password.value, 
            this.state.firstName.value, this.state.lastName.value,
            this.props.settings.tenant_id);

        this.setState({newUser});
    } catch (e) {
        let error = e.message;
        if (e.code === "InvalidParameterException") {
            error = "Password does not meet complexity requirements."
        }
        console.log(e);
        this.setState({error: error});
    } finally {
        this.setState({ isLoading: false });
    }
  }

  handleConfirm = () => {
    this.props.userHasAuthenticated(true);
    this.props.history.push("/");
  }


  renderForm() {
    return (
        <div>
      <Form onSubmit={this.handleSubmit}>
      <h2>Sign up</h2>
        {this.state.error && 
            <Alert color="danger">
            <strong>{this.state.error}</strong>
            </Alert>
        }
        <FormGroup>
          <Label>Email * </Label>
          <Input id="email"
            size="lg"
            autoFocus
            type="email"
            value={this.state.email.value}
            onChange={this.handleChange}
          />
        </FormGroup>
        <FormGroup >
                <Label>First Name * </Label>
                <Input id="firstName"
                  size="lg"
                  type="text"
                  value={this.state.firstName.value}
                  onChange={this.handleChange}
                />
              </FormGroup>
              <FormGroup>
                <Label>Last Name * </Label>
                <Input id="lastName"
                  size="lg"
                  type="text"
                  value={this.state.lastName.value}
                  onChange={this.handleChange}
                />
              </FormGroup>
        <PasswordFormControl passwordControlId="password" confirmPasswordControlId="confirmPassword"
            password={this.state.password.value} confirmPassword={this.state.confirmPassword.value}
            onChange={this.handleChange} />

        <FormGroup>
                <Label check>
                    <Input addon required type="checkbox" value={this.state.agreeToLicense} onChange={(e)=>this.setState({agreeToLicense: e.target.checked})}/>
                      I agree to the <Link to="/privacy" target="_blank">Privacy Policy</Link> and 
                      <Link to="/tos" target="_blank"> Terms and Conditions</Link>
                </Label>
                {/* <Checkbox required value={this.state.agreeToLicense} onChange={(e)=>this.setState({agreeToLicense: e.target.checked})}>
                I agree to the <Link to="/privacy" target="_blank">Privacy Policy</Link> and 
                <Link to="/tos" target="_blank"> Terms and Conditions</Link>
                </Checkbox> */}
              </FormGroup>
        <LoaderButton
          block
          size="lg"
          disabled={!this.validateForm()}
          type="submit"
          isLoading={this.state.isLoading}
          text="Signup"
          loadingText="Signing up…"
        />

        <div className="SignUpLink">
          Have an account? <Link to={'login'}>Log in</Link>
        </div>
      </Form>
      </div>
    );
  }

  render() {
    return (
      <div className="Signup">
        {this.state.newUser === null
          ? this.renderForm()
          : <ConfirmationForm email={this.state.email.value} password={this.state.password.value} onConfirm={this.handleConfirm} />
          }
      </div>
    );
  }
}

export default withSettings(Signup);