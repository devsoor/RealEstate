import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Form, FormGroup, Input, Label } from 'reactstrap';
import {withSettings} from "../../../../api/SettingsProvider"
import {getSearchOptions} from '../../../../api/PropertyApi';


class Step2 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      'type': props.getStore().type,
      'bedrooms': props.getStore().bedrooms,
      'otherType': props.getStore().otherType,
      options: null
    };
  }

  componentDidMount() {
    getSearchOptions().then(val => {
        this.setState({options:val})
    })
}


  render() {
    const options = this.state.options;

    var localStyles = [];
    options && 
    options.styles.map((m => {
        if (m.value == "1") {localStyles.push({name:m.name, value:m.value})};
        if (m.value == "2") {localStyles.push({name:m.name, value:m.value})};
        if (m.value == "3") {localStyles.push({name:m.name, value:m.value})};
        if (m.value == "7") {localStyles.push({name:m.name, value:m.value})};
        if (m.value == "10") {localStyles.push({name:m.name, value:m.value})};
    }))
    
    return (
      <div className="step step2 mt-5">
        <div className="row justify-content-md-center">
          <div className="col-lg-4">
            <Form>
            <div className="form-group content form-block-holder">
                  <FormGroup>
                      <Label className="control-label">What type of property are you looking for?</Label>
                      <Input id="type"
                          required
                          type="select" 
                          ref={(t) => { this.type = t; }}
                          defaultValue={this.state.type}>
                          {localStyles.map(option => <option key={option.value} value={option.value}>{option.name}</option>)} </Input>
                  </FormGroup>
              </div>
              <div className="form-group content form-block-holder">
                  <FormGroup>
                      <Label className="control-label">What is ideal number of bedrooms?</Label>
                      <Input id="bedrooms"
                          required
                          type="select" 
                          ref={(b) => { this.bedrooms = b; }}
                          defaultValue={this.state.bedrooms}>
                              <option>2</option>
                              <option>3</option>
                              <option>4</option>
                        </Input>
                  </FormGroup>
              </div>
              <div className="form-group content form-block-holder">
                  <FormGroup>
                      <Label className="control-label">What condition of property is acceptable?</Label>
                      <Input id="otherType"
                          required
                          type="select" 
                          ref={(o) => { this.otherType = o; }}
                          defaultValue={this.state.otherType}>
                              <option>Turnkey (under 20 years old)</option>
                              <option>Over 20 years old</option>
                              <option>Fixer-upper</option>
                              <option>Short-sale</option>
                              <option>Bank-owned REO</option>
                              <option>New construction</option>
                        </Input>
                  </FormGroup>
              </div>
            </Form>
          </div>
        </div>
      </div>
    );
  }
}
export default withSettings(Step2);
