import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Nav, NavItem, ButtonGroup, Button, Label, FormGroup, Input} from 'reactstrap';
import {importPropertyTaxes, updateRentometer} from "../../api/PropertyApi";
class ManageConfiguration extends Component {
    constructor(props) {
        super(props);
        this.state = {uploadType: ""};
        this.handleChange = this.handleChange.bind(this);
        this.handleApply = this.handleApply.bind(this);

    }
    handleChange(event) {
        const uploadType = event.target.id;
        this.setState({uploadType});
    }
    handleApply() {
        switch (this.state.uploadType) {
            case "taxbycity":
                // importPropertyTaxesByCity();
                break;
            case "taxbycounty":
                importPropertyTaxes();
                break;
            case "rentalstats":
                updateRentometer();
                break;
        }
    }
    render() {
        return <div>
            <CardBody>
                <Row>
                    {/* <Col md={4}>
                        <FormGroup>
                        <Label check> 
                            <Input type="radio" name="rentaltax" id="taxbycity" onChange={this.handleChange}></Input>
                            Property taxes by City</Label>
                        </FormGroup>
                    </Col> */}
                    <Col md={6}>
                    <FormGroup>
                        <Label check>
                            <Input type="radio" name="rentaltax" id="taxbycounty"  onChange={this.handleChange}></Input>
                            Property taxes by County</Label>
                    </FormGroup>
                    </Col>
                    <Col md={6}>
                    <FormGroup>
                        <Label check>
                        <Input type="radio" name="rentaltax" id="rentalstats"  onChange={this.handleChange}></Input>
                        Update Rentometer file</Label>
                    </FormGroup>
                    </Col>
                </Row>
                </CardBody>
            <div className="text-center">
                <Button color="primary" onClick={this.handleApply}>Apply</Button>
            </div>
        </div>
    }
}

export default ManageConfiguration