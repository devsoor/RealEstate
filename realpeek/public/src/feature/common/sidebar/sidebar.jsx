import React, { Fragment, Component } from 'react';
import { NavLink, withRouter } from 'react-router-dom';

import {
  Nav,
  Collapse,
  Card,
  CardBody,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {withSettings} from "../../../api/SettingsProvider";
import { LinkContainer } from "react-router-bootstrap";
import Can from "../../auth/Authorization/Can";

import bgimage from '../../../assets/images/background/profile-bg.jpg';

const sidebarBackground = {
  backgroundImage: 'url(' + bgimage + ')',
  backgroundRepeat: 'no-repeat'
};

class Sidebar extends Component {
  constructor(props) {
    super(props);

    this.expandLogo = this.expandLogo.bind(this);
    this.activeRoute.bind(this);
    this.state = {
      authentication: this.activeRoute('/authentication') !== '' ? true : false,
      dropdownOpen: false,
      showContactInfo: true
    };
    this.toggle = this.toggle.bind(this);
  }
  toggle() {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }
  handleLogout = event => {
    this.props.userHasAuthenticated(false);
    this.props.history.push("/login");
  }
  /*--------------------------------------------------------------------------------*/
  /*To Expand SITE_LOGO With Sidebar-Menu on Hover                                  */
  /*--------------------------------------------------------------------------------*/
  expandLogo() {
    document.getElementById('logobg').classList.toggle('expand-logo');
  }
  /*--------------------------------------------------------------------------------*/
  /*Verifies if routeName is the one active (in browser input)                      */
  /*--------------------------------------------------------------------------------*/
  activeRoute(routeName) {
    return this.props.location.pathname.indexOf(routeName) > -1
      ? 'selected'
      : '';
  }
  render() {

    return (
      <aside
        className="left-sidebar"
        id="sidebarbg"
        data-sidebarbg={this.props.data.settings[0].sidebarbg}
        // onMouseEnter={this.expandLogo}
        // onMouseLeave={this.expandLogo}
      >
        <div className="scroll-sidebar">
          <PerfectScrollbar className="sidebar-nav">
            <div className="user-profile" style={sidebarBackground}>
              <div className="profile-img"><img src={this.props.settings.agent_photo} alt="user" /> </div>
                  {/* <CardBody>
                    <div className="right"><font color="white">{this.props.settings.agent_title}</font></div>
                    <div ><font color="white">{this.props.settings.agent_email}</font></div>
                    <div><font color="white">{this.props.settings.agent_phone}</font></div>
                  </CardBody> */}

              {/* </Fragment>: <div> a </div>} */}
              <Can action="update" on="tenant">
                <div className="profile-text hide-menu">
                  <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
                    <DropdownToggle caret>{this.props.settings.agent_name}</DropdownToggle>
                    <DropdownMenu>
                        <LinkContainer to={`/admin/sites/profile`}>
                          <DropdownItem className="border-bottom"><i className="ti-settings mr-1 ml-1" />
                            Manage Site
                          </DropdownItem>
                        </LinkContainer>
                      {/* <DropdownItem>
                        <i className="ti-email" /> Billing
                      </DropdownItem> */}
                        <Can action="edit" on="platformassumptions">
                            <LinkContainer to={"/admin/config"}><DropdownItem className="border-bottom"><i className="ti-settings mr-1 ml-1" />RealPeek Admin</DropdownItem></LinkContainer>
                        </Can>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                </Can>
            </div>

            {this.props.isAuthenticated
            ? <Fragment>
                {/*--------------------------------------------------------------------------------*/}
                {/* Sidebar Menus go here                                                     */}
                {/*--------------------------------------------------------------------------------*/}
                <Nav id="sidebarnav">
                  {this.props.routes.map((prop, key) => {
                    if (prop.redirect) {
                      return null;
                    } else if (prop.navlabel) {
                      return (
                        <li className="nav-small-cap" key={key}>
                          <i className={prop.icon} />
                          <span className="hide-menu">{prop.name}</span>
                        </li>
                      );
                    } else if (prop.collapse) {
                      let firstdd = {};
                      firstdd[prop['state']] = !this.state[prop.state];
                      return (
                        /*--------------------------------------------------------------------------------*/
                        /* Menus will go here                                                        */
                        /*--------------------------------------------------------------------------------*/
                        <li
                          className={this.activeRoute(prop.path) + ' sidebar-item'}
                          key={key}
                        >
                          <span
                            data-toggle="collapse"
                            className="sidebar-link has-arrow"
                            aria-expanded={this.state[prop.state]}
                            onClick={() => this.setState(firstdd)}
                          >
                            <i className={prop.icon} />
                            <span className="hide-menu">{prop.name}</span>
                          </span>
                          {/*--------------------------------------------------------------------------------*/}
                          {/* Sub-Menus will go here                                                    */}
                          {/*--------------------------------------------------------------------------------*/}
                          <Collapse isOpen={this.state[prop.state]}>
                            <ul className="first-level">
                              {prop.child.map((prop, key) => {
                                if (prop.redirect) return null;
                                if (prop.collapse) {
                                  let seconddd = {};
                                  seconddd[prop['state']] = !this.state[prop.state];
                                  return (
                                    <li
                                      className={
                                        this.activeRoute(prop.path) +
                                        ' sidebar-item'
                                      }
                                      key={key}
                                    >
                                      <span
                                        data-toggle="collapse"
                                        className="sidebar-link has-arrow"
                                        aria-expanded={this.state[prop.state]}
                                        onClick={() => this.setState(seconddd)}
                                      >
                                        <i className={prop.icon} />
                                        <span className="hide-menu">
                                          {prop.name}
                                        </span>
                                      </span>
                                      {/*--------------------------------------------------------------------------------*/}
                                      {/* Sub-Menus will go  here                                                    */}
                                      {/*--------------------------------------------------------------------------------*/}
                                      <Collapse isOpen={this.state[prop.state]}>
                                        <ul className="second-level">
                                          {prop.subchild.map((prop, key) => {
                                            if (prop.redirect) return null;
                                            return (
                                              <li
                                                className={
                                                  this.activeRoute(prop.path) +
                                                  ' sidebar-item'
                                                }
                                                key={key}
                                              >
                                                <NavLink
                                                  to={prop.path}
                                                  activeClassName="active"
                                                  className="sidebar-link"
                                                >
                                                  <i className={prop.icon} />
                                                  <span className="hide-menu">
                                                    {prop.name}
                                                  </span>
                                                </NavLink>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </Collapse>
                                    </li>
                                  );
                                }
                                return (
                                  /*--------------------------------------------------------------------------------*/
                                  /* Adding Sidebar Item                                                            */
                                  /*--------------------------------------------------------------------------------*/
                                  <li
                                    className={
                                      this.activeRoute(prop.path) +
                                      (prop.pro ? ' active active-pro' : '') +
                                      ' sidebar-item'
                                    }
                                    key={key}
                                  >
                                    <NavLink
                                      to={prop.path}
                                      className="sidebar-link"
                                      activeClassName="active"
                                    >
                                      <i className={prop.icon} />
                                      <span className="hide-menu">{prop.name}</span>
                                    </NavLink>
                                  </li>
                                );
                              })}
                            </ul>
                          </Collapse>
                        </li>
                      );
                    } else {
                      return (
                        /*--------------------------------------------------------------------------------*/
                        /* Adding Sidebar Item                                                            */
                        /*--------------------------------------------------------------------------------*/
                        <li
                          className={
                            this.activeRoute(prop.path) +
                            (prop.pro ? ' active active-pro' : '') +
                            ' sidebar-item'
                          }
                          key={key}
                        >
                          <NavLink
                            to={prop.path}
                            className="sidebar-link"
                            activeClassName="active"
                          >
                            <i className={prop.icon} />
                            <span className="hide-menu">{prop.name}</span>
                          </NavLink>
                        </li>
                      );
                    }
                  })}
                </Nav>
            </Fragment>: <div>  </div>
            }
          </PerfectScrollbar>
        </div>
      </aside>
    );
  }
}
export default withRouter(withSettings(Sidebar));
