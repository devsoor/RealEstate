import React, {Component, Fragment} from "react"
import { withRouter } from 'react-router-dom';
import {Container, Nav, Navbar, NavbarBrand, UncontrolledDropdown, DropdownItem} from 'reactstrap';
import {withSettings} from "../../../api/SettingsProvider";
import '../container.css';
import rpLogo from '../../../assets/images/RealPeek_logo.png';

class HeaderMain extends Component {

    handleLogout = event => {
        this.props.userHasAuthenticated(false);
        this.props.history.push("/login");
      }
        render() {
        let settings = this.props.settings;
        if (!settings) {
            return null;
        }
        const logo = this.props.settings && this.props.settings.logo_url ? this.props.settings.logo_url : rpLogo;
        const caption = this.props.settings ? this.props.settings.logo_caption : null;
        return (
                <div>
                    <Navbar>
                        <NavbarBrand className="logo logo-desktop">
                            <img src={logo} alt="logo" />
                            {caption 
                            && <div className="logo-caption">{caption}</div>}
                        </NavbarBrand>
                            <Nav className="ml-auto" navbar>
                                {this.props.isAuthenticated && 
                                <Fragment>
                                    <UncontrolledDropdown  nav inNavbar>
                                        <DropdownItem  onClick={this.handleLogout}>Logout</DropdownItem>
                                    </UncontrolledDropdown >
                                </Fragment>
                            }
                            </Nav>
                    </Navbar>
                </div>
        );
      }
}

export default withRouter(withSettings(HeaderMain));
