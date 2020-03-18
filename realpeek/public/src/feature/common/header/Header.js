import React, { Component, Fragment } from 'react';
import {Link, withRouter} from 'react-router-dom';
import {
  Form, Input, Row, Col, Collapse, DropdownToggle, DropdownMenu, DropdownItem, UncontrolledDropdown,
  UncontrolledCarousel, Nav, Navbar, NavItem, NavLink, NavbarBrand, Progress, FormGroup, Button, ListGroup, ListGroupItem
} from 'reactstrap';
import { LinkContainer } from "react-router-bootstrap";
import { getCurrentUser } from '../../../api/PropertyApi';
import Can from "../../auth/Authorization/Can";
import {withSettings} from "../../../api/SettingsProvider";
import './header.css';


import rpLogo from '../../../assets/images/RealPeek_logo.png';
import profilephoto from '../../../assets/images/users/blankphoto.jpg';

  class Header extends Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.showMobilemenu = this.showMobilemenu.bind(this);
        this.sidebarHandler = this.sidebarHandler.bind(this);
        this.state = {
          isOpen: false,
          loading: false,
          profile: null
        };
        this.toggleMenu = this.toggleMenu.bind(this);

  }
  /*--------------------------------------------------------------------------------*/
  /*To open Search Bar                                                              */
  /*--------------------------------------------------------------------------------*/
  toggleMenu() {
    document.getElementById('searchbar').classList.toggle('show-search');
  }
  /*--------------------------------------------------------------------------------*/
  /*To open NAVBAR in MOBILE VIEW                                                   */
  /*--------------------------------------------------------------------------------*/
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  /*--------------------------------------------------------------------------------*/
  /*To open SIDEBAR-MENU in MOBILE VIEW                                             */
  /*--------------------------------------------------------------------------------*/
  showMobilemenu() {
    document.getElementById('main-wrapper').classList.toggle('show-sidebar');
  }
  sidebarHandler = () => {
    let element = document.getElementById('main-wrapper');
    switch (this.props.data.settings[0].sidebartype) {
      case 'full':
      case 'iconbar':
        element.classList.toggle('mini-sidebar');
        if (element.classList.contains('mini-sidebar')) {
          element.setAttribute('data-sidebartype', 'mini-sidebar');
        } else {
          element.setAttribute(
            'data-sidebartype',
            this.props.data.settings[0].sidebartype
          );
        }
        break;

      case 'overlay':
      case 'mini-sidebar':
        element.classList.toggle('full');
        if (element.classList.contains('full')) {
          element.setAttribute('data-sidebartype', 'full');
        } else {
          element.setAttribute(
            'data-sidebartype',
            this.props.data.settings[0].sidebartype
          );
        }
        break;

      default:
    }
  };
 /*  toggle() {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  } */   
  
  async componentWillMount() {
    let profile = await getCurrentUser();
    this.setState({loading: false, profile})
  }
  handleLogout = event => {
    this.props.userHasAuthenticated(false);
    this.props.history.push("/login");
  }
  handleLink = (path) => {
    this.props.history.push(path);
  }


  renderAgentInfo() {
    let settings = this.props.settings;
    if (!settings) {
      return null;
    }
    else {
      return <div className="report-image">
      <div>
          {
              settings.agent_photo &&
              <img src={settings.agent_photo} rounded />
          }
      </div>
      <div>
          <div>
              {settings.agent_name}, {settings.agent_title}</div>
          <div>{settings.agent_email}, {settings.agent_phone}</div>
        
      </div>
  </div>
    }
  }
  render() {
    const {loading, profile } = this.state;
    if (!profile) {
      return null;
    }
    const user_name = profile.attributes.given_name;
    const user_email = profile.attributes.email;
    const logo = this.props.settings && this.props.settings.logo_url ? this.props.settings.logo_url : rpLogo;
    const caption = this.props.settings ? this.props.settings.logo_caption : null;
    const tenant_id = this.props.settings ? this.props.settings.tenant_id : null;
    const settings = this.props.settings;
    return (

      <header
        className="topbar navbarbg"
        data-navbarbg={this.props.data.settings[0].navbarbg}
      >
          <Navbar className={
            'top-navbar ' +
            (this.props.data.settings[0].navbarbg === 'skin6'
              ? 'navbar-light'
              : 'navbar-dark')
          }
          expand="md">
          <div
            className="navbar-header"
            id="logobg"
            data-logobg={this.props.data.settings[0].logobg}
          >
            {/*--------------------------------------------------------------------------------*/}
            {/* Mobile View Toggler  [visible only after 768px screen]                         */}
            {/*--------------------------------------------------------------------------------*/}
            <span
              className="nav-toggler d-block d-md-none text-white"
              onClick={this.showMobilemenu}
            >
              <i className="ti-menu ti-close" />
            </span>
            {/*--------------------------------------------------------------------------------*/}
            {/* Logos Or Icon will gohere for Light Layout && Dark Layout                */}
            {/*--------------------------------------------------------------------------------*/}

            {/*--------------------------------------------------------------------------------*/}
            {/* Mobile View Toggler  [visible only after 768px screen]                         */}
            {/*--------------------------------------------------------------------------------*/}
            <span
              className="topbartoggler d-block d-md-none text-white"
              onClick={this.toggle}
            >
              <i className="ti-more" />
            </span>

          </div>

          {this.props.isAuthenticated
                    ? <Fragment>
          <Collapse
            className="navbarbg"
            isOpen={this.state.isOpen}
            navbar
            data-navbarbg={this.props.data.settings[0].navbarbg}
          >
            <Nav className="float-left" navbar>

              <NavItem>
                <NavLink
                  href="#"
                  className="d-none d-md-block"
                  onClick={this.sidebarHandler}
                >
                  <i className="ti-menu" />
                </NavLink>
              </NavItem>
              <NavbarBrand className="logo logo-desktop">
              <Link to="/">
                <Row>
                    <img src={logo} alt="logo" />&nbsp;&nbsp;
                    {caption 
                      && <div style={{textAlignVertical: 'bottom'}} className="logo-caption">{caption}</div>}
                  </Row>
              </Link>
            </NavbarBrand>
              {/*--------------------------------------------------------------------------------*/}
              {/* Start Search-box toggle                                                        */}
              {/*--------------------------------------------------------------------------------*/}
     {/*          <NavItem className="hidden-sm-down search-box">
                <NavLink
                  href="#"
                  className="hidden-sm-down"
                  onClick={this.toggleMenu}
                >
                  <i className="ti-search" />
                </NavLink>
                <Form className="app-search" id="searchbar">
                  <Input type="text" placeholder="Search & enter" />
                  <span className="srh-btn" onClick={this.toggleMenu}>
                    <i className="ti-close" />
                  </span>
                </Form>
              </NavItem> */}
              {/*--------------------------------------------------------------------------------*/}
              {/* End Search-box toggle                                                          */}
              {/*--------------------------------------------------------------------------------*/}
            </Nav>
            <Nav className="ml-auto float-right" navbar>
            <NavItem>
              <div className="right"><font color="white">{this.props.settings.agent_name}, {this.props.settings.agent_title}</font></div>
                <div ><font size="small" color="white">{this.props.settings.agent_email}</font></div>
                <div><font size="small" color="white">{this.props.settings.agent_phone}</font></div>
            </NavItem>
                      {/*--------------------------------------------------------------------------------*/}
                      {/* Start Notifications Dropdown                                                   */}
                      {/*--------------------------------------------------------------------------------*/}
         {/*              <UncontrolledDropdown nav inNavbar>
                        <DropdownToggle nav caret>
                          <i className="mdi mdi-message" />
                          <div className="notify">
                            {' '}
                            <span className="heartbit" /> <span className="point" />{' '}
                          </div>
                        </DropdownToggle>
                        <DropdownMenu right className="mailbox">
                          <div className="p-4 text-dark border-bottom">
                            <h6 className="mb-0 font-medium">Notifications</h6>
                          </div>
                          <div className="message-center notifications">
                            {data.notifications.map((notification, index) => {
                              return (
                                <span className="message-item" key={index}>
                                  <span
                                    className={
                                      'btn btn-circle btn-' + notification.iconbg
                                    }
                                  >
                                    <i className={notification.iconclass} />
                                  </span>
                                  <div className="mail-contnet">
                                    <h5 className="message-title">
                                      {notification.title}
                                    </h5>
                                    <span className="mail-desc">
                                      {notification.desc}
                                    </span>
                                    <span className="time">{notification.time}</span>
                                  </div>
                                </span>
                              );
                            })}
                          </div>
                          <a className="nav-link text-center mb-1 text-muted" href=";">
                            <strong>Check all notifications</strong>{' '}
                            <i className="fa fa-angle-right" />
                          </a>
                        </DropdownMenu>
                      </UncontrolledDropdown> */}
                      {/*--------------------------------------------------------------------------------*/}
                      {/* End Notifications Dropdown                                                     */}
                      {/*--------------------------------------------------------------------------------*/}
                      {/*--------------------------------------------------------------------------------*/}
                      {/* Start Messages Dropdown                                                        */}
                      {/*--------------------------------------------------------------------------------*/}
      {/*                 <UncontrolledDropdown nav inNavbar>
                        <DropdownToggle nav caret>
                          <i className="mdi mdi-email" />
                          <div className="notify">
                            {' '}
                            <span className="heartbit" /> <span className="point" />{' '}
                          </div>
                        </DropdownToggle>
                        <DropdownMenu right className="mailbox">
                          <div className="p-4 text-dark border-bottom">
                            <h6 className="mb-0 font-medium">
                              You have 4 new messages
                            </h6>
                          </div>
                          <div className="message-center message-body">
                            {data.messages.map((message, index) => {
                              return (
                                <span className="message-item" key={index}>
                                  <span className="user-img">
                                    <img
                                      src={message.image}
                                      alt="user"
                                      className="rounded-circle"
                                      width=""
                                    />
                                    <span
                                      className={
                                        'profile-status pull-right ' + message.status
                                      }
                                    />
                                  </span>
                                  <div className="mail-contnet">
                                    <h5 className="message-title">{message.title}</h5>
                                    <span className="mail-desc">{message.desc}</span>
                                    <span className="time">{message.time}</span>
                                  </div>
                                </span>
                              );
                            })}
                          </div>
                          <span className="nav-link text-center link text-muted" href="">
                            <b>See all e-Mails</b> <i className="fa fa-angle-right" />
                          </span>
                        </DropdownMenu>
                      </UncontrolledDropdown> */}
                      {/*--------------------------------------------------------------------------------*/}
                      {/* End Messages Dropdown                                                          */}
                      {/*--------------------------------------------------------------------------------*/}
                      {/*--------------------------------------------------------------------------------*/}
                      {/* Start Profile Dropdown                                                         */}
                      {/*--------------------------------------------------------------------------------*/}
                      <UncontrolledDropdown nav inNavbar>
                        <DropdownToggle nav caret className="pro-pic">
                          <img
                            src={profilephoto}
                            alt="user"
                            className="rounded-circle"
                            width="31"
                          />
                        </DropdownToggle>
                        <DropdownMenu right className="user-dd">
                          <div className="d-flex no-block align-items-center p-3 mb-2 border-bottom">
                            <div className="">
                              <img
                                src={profilephoto}
                                alt="user"
                                className="rounded"
                                width="80"
                              />
                            </div>
                            <div className="ml-3">
                              <h4 className="mb-0">{user_name}</h4>
                              <p className="text-muted mb-0">{user_email}</p>
{/*                               <Button color="danger" className="btn-rounded mt-2">
                                View Profile
                              </Button> */}
                            </div>
                          </div>
                            <LinkContainer to="/user/profile"><DropdownItem><i className="ti-user mr-1 ml-1" /> Profile </DropdownItem></LinkContainer>
                            {/* <LinkContainer to="/user/saved-searches"><DropdownItem><i className="ti-search mr-1 ml-1" />Help</DropdownItem></LinkContainer> */}
                            <DropdownItem  onClick={this.handleLogout}><i className="fa fa-power-off mr-1 ml-1" />Logout</DropdownItem>
                          </DropdownMenu>
                      </UncontrolledDropdown>
                      {/*--------------------------------------------------------------------------------*/}
                      {/* End Profile Dropdown                                                           */}
                      {/*--------------------------------------------------------------------------------*/}
                    </Nav>
                  </Collapse>
                  </Fragment>
              : <div></div>
          }
          </Navbar>
        </header>
    );
  }
}

export default withRouter(withSettings(Header));