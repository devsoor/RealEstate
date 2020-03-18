import React, { Component } from 'react';
import {Grid, Row, Col, Image, Glyphicon} from 'react-bootstrap';
import Signup from '../auth/Signup/Signup';
import {withSettings} from "../../api/SettingsProvider"

import './LandingPage.css';
import HeaderMain from '../common/header/HeaderMain';
import Footer from '../common/Footer/Footer';
import RpLogo from '../../assets/images/RealPeek_logo_tran.png'
class LandingPage extends Component {
  constructor(props) {
    super(props);
  
  }

  render() {
    const props = this.props;
    return <div className="landing-page">
      <HeaderMain {...props} />
      <section className="header-section">
        <Grid>
          <Row>
            <Col md={8} sm={8} className="intro-section text-center">
              <h1 className="intro">
                Invest with Confidence
              </h1>
              <h3>Technology-driven Real Estate Investment Services</h3>
              <div className="intro-video">
                <iframe width="380" height="220" src="https://www.youtube.com/embed/dIiBDMoO4o8"
                allowfullscreen="allowfullscreen"
                mozallowfullscreen="mozallowfullscreen" 
                msallowfullscreen="msallowfullscreen" 
                oallowfullscreen="oallowfullscreen" 
                webkitallowfullscreen="webkitallowfullscreen">
                </iframe>
              </div>
              <div>
                <p>We specialize in working with real estate investors. We offer a powerful technology platform* to investors at no cost where you can search and analyze thousands of investment properties in seconds</p>
                <div className="pull-right">* Powered by <Image src={RpLogo} height="40" /></div>
              </div>
              <Row className="features">
                <div className="feature">
                  <h4>Search</h4>
                  <ul className="feature-detail">
                    <li>Search by city, zip, county, MLS ID, price, bedrooms, size, point of interest etc.</li>
                    <li>Set your investment success criteria based on minimum cash flow, cap rate or rent-to-value ratios</li>
                    <li>Market and property assumptions: rates, taxes, maintenance, insurance and management costs, etc</li>
                    <li>Find fixer-uppers, short sales, bank-owned properties and new construction</li>
                  </ul>
                </div>
                <div className="feature">
                  <h4>Analyze</h4>
                  <ul className="feature-detail">
                    <li>Properties that meet investment success criteria displayed within seconds</li>
                    <li>Make educated decisions by running various performance scenarios on each property</li>
                    <li>Print single property and multi-property reports</li>
                    <li>No need for old-style spreadsheets</li>
                  </ul>
                </div>
                <div className="feature">
                  <h4>Buy</h4>
                  <div className="feature-detail text-center">
                  Contact us when you are ready to buy your ideal property 
                  </div>
                </div>
              </Row>
            </Col>
            <Col md={4} sm={4}>
              <Signup {...this.props} />
            </Col>
          
          </Row>
        </Grid>
      </section>
      {/* <section className="section">
        <Grid>
          <h2>Investment Features</h2>
          <div className="line-break"></div>
          <div className="features">
            <Row>
              <Col md={4}>
                <div class="feature">
                  <div class="icon">
                    <Glyphicon glyph="search" />
                  </div>
                  <h4>Search</h4>
                </div>
              </Col>
              <Col md={4}>
                <div class="feature">
                <div class="icon">
                    <Glyphicon glyph="signal" />
                  </div>
                  <h4>Analyze</h4>
                </div>
              </Col>
              <Col md={4}>
                <div class="feature">
                  <div class="icon">
                    <Glyphicon glyph="shopping-cart" />
                  </div>
                  <h4>Buy</h4>
                </div>
              </Col>
            </Row>
          </div>
        </Grid>
      </section> */}
      <Footer {...props} />
    </div>
  }
}

export default withSettings(LandingPage);
