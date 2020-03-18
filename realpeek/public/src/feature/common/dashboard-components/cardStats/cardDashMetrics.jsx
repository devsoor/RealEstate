import React, { Component } from 'react';
import { Card, CardBody, Button, CardSubtitle, Col, Row } from 'reactstrap';
import { withRouter} from 'react-router-dom';
import {withSettings} from "../../../../api/SettingsProvider";
import {searchProperties, getAssumptions} from '../../../../api/PropertyApi';


import { Line } from 'react-chartjs-2';
// import 'c3/c3.css';


class CardDashMetrics extends Component {
  constructor(props) {
    super(props);
  }
  

   render() {
      const date = new Date();
      const mdy = date.toDateString();
      const totalHits = this.props.totalHits;
      const totalCount = this.props.totalCount;
      const totalSuccess = this.props.totalSuccess;
      const maxCashFlow = this.props.maxCashFlow;
      const medianPrice = this.props.medianPrice;


      return (
        /*--------------------------------------------------------------------------------*/
        /* Used In Dashboard-2                                                            */
        /*--------------------------------------------------------------------------------*/
        <Row>
          <Col xs="12" md="4">
            <Card className="bg-danger">
              <CardBody >
                <div className="d-flex flex-row">
                  <div className="round round-lg align-self-center round-info">
                    <i className="ti-home" />
                  </div>
                  <div className="ml-2 align-self-center">
                    <Row>
                        <Col md={9}><h2 className="mb-0 font-light" className="text-white">{totalHits}</h2></Col>
                        <Col md={3}><Button id="refresh" size="lg" className="mdi mdi-refresh text-white op-5" outline style={{border:0}} onClick={this.props.onRefresh}> </Button></Col>
                    </Row>
                    <h5 className="text-muted mb-0"  className="text-white op-5">Active Properties</h5>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
  
          <Col xs="12" md="4">
            <Card className="bg-warning">
              <CardBody>
                <div className="d-flex flex-row">
                  <div className="round round-lg align-self-center round-warning">
                    <i className="ti-check-box" />
                  </div>
                  <div className="ml-2 align-self-center">
                    <h2 className="mb-0 font-lgiht" className="text-white" >{totalCount}</h2>
                    <h5 className="text-muted mb-0"  className="text-white op-5">Met Criteria</h5>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
  
          <Col xs="12" md="4">
            <Card className="bg-success">
              <CardBody>
                <div className="d-flex flex-row">
                  <div className="round round-lg align-self-center round-primary">
                    <i className="ti-thumb-up" />
                  </div>
                  <div className="ml-2 align-self-center">
                    <h2 className="mb-0 font-lgiht" className="text-white">{totalSuccess}</h2>
                    <h5 className="text-muted mb-0"  className="text-white op-5">Successful</h5>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
  
          {/* <Col lg="3" md="6">
            <Card className="bg-danger">
              <CardBody>
                <div className="d-flex flex-row">
                  <div className="round round-lg align-self-center round-danger">
                    <i className="ti-money" />
                  </div>
                  <div className="ml-2 align-self-center">
                    <h2 className="mb-0 font-lgiht" className="text-white">{medianPrice}</h2>
                    <h5 className="text-muted mb-0" className="text-white op-5">Median Price</h5>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col> */}
        </Row>
      );
  }
}

export default withRouter(withSettings(CardDashMetrics));
