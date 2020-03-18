import React, { Component } from "react";
// import { Button, FormGroup, FormControl, ControlLabel, Alert } from "react-bootstrap";
import { Button, FormGroup, Input, Label, Alert } from "reactstrap";
import { Auth } from "aws-amplify";
import queryString from "qs";
import { Redirect } from "react-router-dom";
import LoaderButton from '../../common/LoaderButton/LoaderButton'
import "./Login.css";
import RequireNewPassword from "./RequireNewPassword";
import ConfirmationForm from "../Signup/ConfirmationForm";
import {Link} from "react-router-dom";

class Login extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      username: "",
      password: "",
      requireNewPassword: false,
      requireConfirmation: false,
      authData: null,
      error: null
    };
  }
  componentDidMount() {
    this._isMounted = true;
    
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  validateForm = () => {
    return this.state.username.length > 0 && this.state.password.length > 0;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }


  signIn = event => {
    if (event) {
      event.preventDefault();
    }
    this.setState({ isLoading: true });

    const username = this.state.username.toLowerCase();
    const password = this.state.password;
    if (!Auth || typeof Auth.signIn !== 'function') {
        throw new Error('No Auth module found, please ensure @aws-amplify/auth is imported');
    }
    Auth.signIn(username, password)
        .then(async (user) => {
            await this.setState({authData: user});
            if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
                //logger.debug('require new password', user.challengeParam);
                //this.changeState('requireNewPassword', user);
                await this.setState({requireNewPassword: true, error: false});
            }
            else {
                this.props.userHasAuthenticated(true);
            }
        })
        .catch(async (err) => {
          if (err.code === "UserNotConfirmedException")
          {
            await this.setState({requireConfirmation: true, error: false});
          }
          else {
            this.setState({error: err.message});
          }
        })
        .finally(() => {
          if (this._isMounted) {
            this.setState({ isLoading: false });
          }
        });
}

  render() {
    if (this.props.isAuthenticated) {
      let redirect = '';
      if (this.props.location.search) {
        const search = queryString.parse(this.props.location.search, { ignoreQueryPrefix: true });
        redirect = search.redirect;
      }
      return <Redirect to={redirect} />
    }

    if (this.state.requireNewPassword) {
      return <div className="Login">
            <RequireNewPassword onSuccess={() => this.setState({requireNewPassword: false})} authData={this.state.authData} />
        </div>
    }
    if (this.state.requireConfirmation) {
      return <div className="Login">
        <ConfirmationForm email={this.state.username} password={this.state.password} onConfirm={this.signIn} />
      </div>
    }
    return (
      <div className="Login">
        <form onSubmit={this.signIn}>
          <h2>Login</h2>
          {this.state.error && 
                    <Alert color="danger">
                    <strong>{this.state.error}</strong>
                    </Alert>
                }
          <FormGroup size="lg">
            <Label>Email</Label>
            <Input
              autoFocus
              id="username"
              type="text"
              value={this.state.username}
              onChange={this.handleChange}
            />
          </FormGroup>
          <FormGroup size="lg">
            <Label>Password</Label>
            <Input
              id="password"
              value={this.state.password}
              onChange={this.handleChange}
              type="password"
            />
            <Link to={'forgot-password'}>Forgot Password?</Link>
          </FormGroup>
          <LoaderButton
            block
            size="lg"
            disabled={!this.validateForm()}
            type="submit"
            isLoading={this.state.isLoading}
            text="Login"
            loadingText="Logging in…"
          />
        <div className="SignUpLink">
          Need an account? <Link to={'signup'}>Sign up</Link>
        </div>
        </form>

      </div>
    );
  }
}

export default Login;