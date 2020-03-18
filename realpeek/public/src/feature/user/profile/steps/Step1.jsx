import React, { Component } from 'react';
import { Card, CardBody, CardTitle, Form, FormGroup, Input, Label } from 'reactstrap';
import {withSettings} from "../../../../api/SettingsProvider"
// import PlacesSuggest from '../../../OffMarket/PlacesSuggest';
import LocationSuggest from '../../../search/LocationSuggest/LocationSuggest';

class Step1 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      'location': props.getStore().location,
      'price': props.getStore().price
    };
  
  }
  render() {

    return (
      <div className="step step1 mt-5 ">
        <div className="row justify-content-md-center">
          <div className="col col-lg-6">
            <div className="">
              <Label className="control-label">Where are you monitoring properties for investment?</Label>
              <Form id="Form" className="form-horizontal mt-2">
              <div className="form-group content form-block-holder">
                  <LocationSuggest id="location" placeholder="Enter City, County or Zip"
                       ref={(loc) => { this.location = loc; }}
                  />
                  </div>
                  <div className="form-group content form-block-holder">
                   <FormGroup>
                      <Label>What is your budget? </Label>
                      <Input id="price" 
                        type="number"
                        placeholder="Price" 
                        ref={(p) => { this.price = p; }}
                        defaultValue={this.state.price}
                      />
                  </FormGroup>
                  </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withSettings(Step1);
