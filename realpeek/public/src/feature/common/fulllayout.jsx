import React, {Component} from "react"
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import {Container} from 'reactstrap';
// import Header from '../components/header/header.jsx';
import Sidebar from './sidebar/sidebar.jsx.js';
// import Footer from '../components/footer/footer.jsx';
import ThemeRoutes from './themeroutes.jsx.js';
import Header from "./header/Header";
import Footer from "./Footer/Footer";
import {withSettings} from "../../api/SettingsProvider";
// import Customizer from './customizer';
import './container.css';

class Fulllayout extends Component {
  /*--------------------------------------------------------------------------------*/
  /*Change the layout settings [HEADER,SIDEBAR && DARK LAYOUT] from here            */
  /*--------------------------------------------------------------------------------*/
  constructor(props) {
    super(props);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.state = {
      isOpen: false,
      width: window.innerWidth,
      settings: [
        {
          theme: 'light',
          layout: 'vertical',
          dir: 'ltr',
          sidebartype: 'full',
          sidebarpos: 'fixed',
          headerpos: 'fixed',
          boxed: 'full',
          navbarbg: 'skin4',
          sidebarbg: 'skin1',
          logobg: 'skin4'
        }
      ]
    };

    this.props.history.listen((location, action) => {
      if (
        window.innerWidth < 767 &&
        document
          .getElementById('main-wrapper')
          .className.indexOf('show-sidebar') !== -1
      ) {
        document
          .getElementById('main-wrapper')
          .classList.toggle('show-sidebar');
      }
    });
  }
  /*--------------------------------------------------------------------------------*/
  /*Life Cycle Hook, Applies when loading or resizing App                           */
  /*--------------------------------------------------------------------------------*/
  componentDidMount() {
    window.addEventListener('load', this.updateDimensions);
    window.addEventListener('resize', this.updateDimensions);
  }
  /*--------------------------------------------------------------------------------*/
  /*Function that handles sidebar, changes when resizing App                        */
  /*--------------------------------------------------------------------------------*/ 
  
  updateDimensions() {
    let element = document.getElementById('main-wrapper');
    this.setState({
      width: window.innerWidth
    });
    switch (this.state.settings[0].sidebartype) {
      case 'full':
      case 'iconbar':
        if (this.state.width < 1170) {
          element.setAttribute('data-sidebartype', 'mini-sidebar');
          element.classList.add('mini-sidebar');
        } else {
          element.setAttribute(
            'data-sidebartype',
            this.state.settings[0].sidebartype
          );
          element.classList.remove('mini-sidebar');
        }
        break;

      case 'overlay':
        if (this.state.width < 767) {
          element.setAttribute('data-sidebartype', 'mini-sidebar');
        } else {
          element.setAttribute(
            'data-sidebartype',
            this.state.settings[0].sidebartype
          );
        }
        break;

      default:
    }
/*     if (this.state.settings[0].sidebarpos === 'fixed') {
      document.getElementById('sidebar-position').setAttribute('checked', '');
    } */
/*     if (this.state.settings[0].headerpos === 'fixed') {
      document.getElementById('header-position').setAttribute('checked', '');
    } */
    if (this.state.settings[0].theme === 'dark') {
      document.getElementById('theme-view').setAttribute('checked', '');
    }
    if (this.state.settings[0].boxed === 'boxed') {
      document.getElementById('boxed-layout').setAttribute('checked', '');
    }
    if (this.state.settings[0].dir === 'rtl') {
      document.getElementById('rtl').setAttribute('checked', '');
    }
  }
  /*--------------------------------------------------------------------------------*/
  /*Life Cycle Hook                                                                 */
  /*--------------------------------------------------------------------------------*/
  componentWillUnmount() {
    window.removeEventListener('load', this.updateDimensions);
    window.removeEventListener('resize', this.updateDimensions);
  }

  /*--------------------------------------------------------------------------------*/
  /*Theme Setting && Changes default(LIGHT) THEME to DARK COLOR:-                   */
  /*--------------------------------------------------------------------------------*/
  darkTheme = a => {
    if (a.target.checked) {
      let darktheme = JSON.parse(JSON.stringify(this.state.settings));
      darktheme[0].theme = 'dark';
      this.setState({ settings: darktheme });
    } else {
      let lighttheme = JSON.parse(JSON.stringify(this.state.settings));
      lighttheme[0].theme = 'light';
      this.setState({ settings: lighttheme });
    }
  };
  /*--------------------------------------------------------------------------------*/
  /*Theme Setting && Changes Default(FULL) LAYOUT to BOXED LAYOUT                   */
  /*--------------------------------------------------------------------------------*/
  boxedTheme = b => {
    if (b.target.checked) {
      let boxtheme = JSON.parse(JSON.stringify(this.state.settings));
      boxtheme[0].boxed = 'boxed';
      this.setState({ settings: boxtheme });
    } else {
      let fulltheme = JSON.parse(JSON.stringify(this.state.settings));
      fulltheme[0].boxed = 'full';
      this.setState({ settings: fulltheme });
    }
  };
  /*--------------------------------------------------------------------------------*/
  /*Theme Setting && Changes Default(ltr) DIRECTION to rtl DIRECTION                   */
  /*--------------------------------------------------------------------------------*/
  rtl = h => {
    if (h.target.checked) {
      let rtl = JSON.parse(JSON.stringify(this.state.settings));
      rtl[0].dir = 'rtl';
      this.setState({ settings: rtl });
    } else {
      let ltr = JSON.parse(JSON.stringify(this.state.settings));
      ltr[0].dir = 'ltr';
      this.setState({ settings: ltr });
    }
  };
  /*--------------------------------------------------------------------------------*/
  /*Theme Setting && Changes Default(FIXED) POSITION of HEADER to ABSOLUTE POSITION */
  /*--------------------------------------------------------------------------------*/
  headerPosition = c => {
    if (c.target.checked) {
      let fixedpos = JSON.parse(JSON.stringify(this.state.settings));
      fixedpos[0].headerpos = 'fixed';
      this.setState({ settings: fixedpos });
    } else {
      let absolutepos = JSON.parse(JSON.stringify(this.state.settings));
      absolutepos[0].headerpos = 'absolute';
      this.setState({ settings: absolutepos });
    }
  };
  /*--------------------------------------------------------------------------------*/
  /*Theme Setting && Changes Default(FIXED) POSITION of SIDEBAR to ABSOLUTE POSITION*/
  /*--------------------------------------------------------------------------------*/
  sidebarPosition = d => {
    if (d.target.checked) {
      let sidebarfixedpos = JSON.parse(JSON.stringify(this.state.settings));
      sidebarfixedpos[0].sidebarpos = 'fixed';
      this.setState({ settings: sidebarfixedpos });
    } else {
      let sidebarabsolutepos = JSON.parse(JSON.stringify(this.state.settings));
      sidebarabsolutepos[0].sidebarpos = 'absolute';
      this.setState({ settings: sidebarabsolutepos });
    }
  };
  /*--------------------------------------------------------------------------------*/
  /*Theme Setting && Changes NAVBAR BACKGROUND-COLOR from given options             */
  /*--------------------------------------------------------------------------------*/
  navbarbgChange = e => {
    let navskin = e.currentTarget.dataset.navbarbg;
    let newsettings = JSON.parse(JSON.stringify(this.state.settings));
    newsettings[0].navbarbg = navskin;
    this.setState({
      settings: newsettings
    });
  };
  /*--------------------------------------------------------------------------------*/
  /*Theme Setting && Changes SIDEBAR-MENU BACKGROUND-COLOR from given options       */
  /*--------------------------------------------------------------------------------*/
  sidebarbgChange = f => {
    let sidebarskin = f.currentTarget.dataset.sidebarbg;
    let newsettings = JSON.parse(JSON.stringify(this.state.settings));
    newsettings[0].sidebarbg = sidebarskin;
    this.setState({
      settings: newsettings
    });
  };
  /*--------------------------------------------------------------------------------*/
  /*Theme Setting && Changes LOGO BACKGROUND-COLOR from given options               */
  /*--------------------------------------------------------------------------------*/
  logobgChange = g => {
    let logoskin = g.currentTarget.dataset.logobg;
    let newsettings = JSON.parse(JSON.stringify(this.state.settings));
    newsettings[0].logobg = logoskin;
    this.setState({
      settings: newsettings
    });
  };
  render() {

    /*--------------------------------------------------------------------------------*/
    /* Theme Setting && Layout Options wiil be Change From Here                       */
    /*--------------------------------------------------------------------------------*/
    return (
      <div
        id="main-wrapper"
        dir={this.state.settings[0].dir}
        data-theme={this.state.settings[0].theme}
        data-layout={this.state.settings[0].layout}
        data-sidebartype={this.state.settings[0].sidebartype}
        data-sidebar-position={this.state.settings[0].sidebarpos}
        data-header-position={this.state.settings[0].headerpos}
        data-boxed-layout={this.state.settings[0].boxed}
      >
      
        {/*--------------------------------------------------------------------------------*/}
        {/* Header                                                                         */}
        {/*--------------------------------------------------------------------------------*/}
        <Header data={this.state} {...this.props} routes={ThemeRoutes}/>
        {/*--------------------------------------------------------------------------------*/}
        {/* Sidebar                                                                        */}
        {/*--------------------------------------------------------------------------------*/}
        <Sidebar data={this.state} {...this.props} routes={ThemeRoutes} />
        {/*--------------------------------------------------------------------------------*/}
        {/* Page Main-Content                                                              */}
        {/*--------------------------------------------------------------------------------*/}
          <div className="page-wrapper d-block">
          <div className="page-content container-fluid">
          <Container fluid className="container-wrapper">{{...this.props}.children}</Container>
          </div>
          <Footer {...this.props} />
        </div>
                {/*--------------------------------------------------------------------------------*/}
        {/* Customizer from which you can set all the Layout Settings                      */}
        {/*--------------------------------------------------------------------------------*/}
{/*         <Customizer
          darkTheme={this.darkTheme}
          boxedTheme={this.boxedTheme}
          rtl={this.rtl}
          headerPosition={this.headerPosition}
          sidebarPosition={this.sidebarPosition}
          navbarbgChange={this.navbarbgChange}
          sidebarbgChange={this.sidebarbgChange}
          logobgChange={this.logobgChange}
        /> */}
      </div>
    );
  }
}
export default withRouter(withSettings(Fulllayout));

