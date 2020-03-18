import React, {Component, Fragment} from "react"
import { withRouter } from 'react-router-dom';
import {Container, Nav, Navbar} from 'reactstrap';
import Footer from "./Footer/Footer";
import HeaderMain from "./header/HeaderMain";
import { LinkContainer } from "react-router-bootstrap";
import Can from "../auth/Authorization/Can";
import {withSettings} from "../../api/SettingsProvider";
import './container.css';
import rpLogo from '../../assets/images/RealPeek_logo.png';

class Blanklayout extends Component {

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
                <HeaderMain {...this.props} />
                <div className="page-wrapper d-block">
                    <div className="page-content container-fluid">
                        <Container fluid className="container-wrapper">{{...this.props}.children}</Container>
                    </div>
                <Footer {...this.props} />
                </div>
            </div>
        );
      }
}

export default withRouter(withSettings(Blanklayout));
