import React, { Component } from 'react';

import { Row, Col, Card, CardBody, CardTitle, FormGroup, Label, Input, TabPane, TabContent, Button, Collapse } from 'reactstrap';
import {CheckboxGroup, Checkbox as CheckboxGroupCheckbox} from '@lahzenegar/react-checkbox-group';
import Places from '../common/places/Places';
import { getSearchOptions } from '../../api/PropertyApi';
import { ToggleLinkGroup } from '../common/ToggleLink/ToggleLink';
import LocationSuggest from './LocationSuggest/LocationSuggest';
import Select, { components } from 'react-select';

import "./Search.css"
// import OffMarket from './OffMarket/OffMarket';

class SearchForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      advancedSearch: false,
      options: null,
      activeTab: '1',
      propsSelectOptions: []
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleMultiSelect = this.handleMultiSelect.bind(this);
  }

  componentDidMount() {
    let optionStylesSelect = [];
    getSearchOptions().then(options => {
      this.setState({options})
      // this.state.options.styles.map(option => {
      //   optionStylesSelect.push({label: option.name, value: option.value});
      // });
      // this.setState({
      //   propsSelectOptions: optionStylesSelect
      // });
    })
  }

  handleValueChange = (id, value) => {
    this.props.onQueryChange(id, value);
  }

  handleMultiSelect(event) {
     let selected = [];
    if (event.target.selectedOptions) {
      selected = [...event.target.selectedOptions].map(o => o.value);
    }

    this.handleValueChange(event.target.id, selected);
  }

  changeSearchType = (searchType) => {
    this.handleValueChange('searchType', searchType);
  }

  handleCheckbox = (event) => {
    this.handleValueChange(event.target.id, event.target.checked);
  }

  handleChange(event) {
    this.handleValueChange(event.target.id, event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onSubmit();
  }

/*   handleAnalyze(event) {
    event.preventDefault();
    this.props.onAnalyze();
  } */
  render() {
    const query=this.props.query;
    query.searchType = query.searchType || "location";
    const options=this.state.options;
     query.bank_owned = query.bank_owned || "include";
    query.short_sale = query.short_sale || "include";
    query.new_construction = query.new_construction || "include";
    query.fixer = query.fixer || "include";

    if (!options) {
      return null;
    }

    return (
       <form onSubmit={this.handleSubmit} ref="form">
          <Row className="form-row">
                  <Col xs={12} md={12}>
                    <Row>
                          <Col>
                              <FormGroup>
                                <Label check> 
                                  <Input type="radio" name="searchType" checked={query.searchType === 'location'} onChange={() => this.changeSearchType('location')}></Input>
                                  Standard</Label>
                              </FormGroup>
                          </Col>
                          <Col>
                            <FormGroup>
                              <Label check>
                                  <Input type="radio" name="searchType" checked={query.searchType === 'poi'} onChange={ () => this.changeSearchType('poi') }></Input>
                                  POI</Label>
                            </FormGroup>
                          </Col>
                          <Col>
                            <FormGroup>
                              <Label check>
                                <Input type="radio" name="searchType" checked={query.searchType === 'ids'} onChange={ () => this.changeSearchType('ids') }></Input>
                                MLS IDs</Label>
                            </FormGroup>
                          </Col>
                    </Row>
                    {
                      query.searchType === "location" &&
                      <Col>
                      <FormGroup>
                          {/* <Label>Location</Label> */}
                              <LocationSuggest id="locations" placeholder="Address, city, county, zip, or MLS ID" onChange={this.handleValueChange} value={query.locations || []} />
                      </FormGroup> 
                      </Col>
                    }
                    {
                      query.searchType === "ids" &&
                      <FormGroup>
                        {/* <Label>MLS IDs (space-separated)</Label> */}
                        <Input id="ids" type="text" placeholder="MLS IDs" onChange={this.handleChange} value={query.ids || ''}>
                          </Input>
                      </FormGroup>
                    }
                    {
                      query.searchType === "poi" &&
                      <div>
                        <FormGroup>
                          {/* <Label>Point of Interest</Label> */}
                          <Places id="poi" onChange={this.handleChange} />
                        </FormGroup>

                        <FormGroup>
                          <Label>Distance (miles)</Label>
                          <Input id="distance" type="number" placeholder="Distance" onChange={this.handleChange} value={query.distance || ''}>
                          </Input>
                        </FormGroup>
                      </div>
                    }
 {/*                    {
                      query.searchType === "offMarket" &&
                      <div>
                        <OffMarket query={query} onQueryChange={this.handleValueChange} options={options}/>
                         <Button  className="bg-success" type="submit" size="lg">
                          Analyze
                        </Button>
                      </div>
                    } */}
                  </Col>
            </Row>
       {/*      {
                query.searchType != "offMarket" &&
                <div> */}
                <Row>
                  <Col xs={12} md={6}>
                      <Row>
                          {/* <Col xs={12} md={6}> */}
                              <Col xs={12} md={6}>
                                    <FormGroup>
                                      <Label>Min Price</Label>
                                      <Input id="min_price" type="select" placeholder="Min Price" onChange={this.handleChange} value={query.min_price || ''}>
                                        <option value="">No Min</option>
                                        {options.prices.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
                                      </Input>
                                    </FormGroup>
                                </Col>
                                <Col xs={12} md={6}>
                                        <FormGroup>
                                            <Label>Max Price</Label>
                                            <Input id="max_price" type="select" placeholder="Max Price" onChange={this.handleChange} value={query.max_price  || ''}>
                                            <option value="">No Max</option>
                                              {options.prices.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
                                            </Input>
                                        </FormGroup>
                                </Col>
                          {/* </Col> */}
                      </Row>
                      <Row>
                                  <Button  className="bg-success" type="submit" size="lg">
                                    Search
                                  </Button>&nbsp;&nbsp;&nbsp;&nbsp;
                              <Button 
                                color="info"
                                onClick={() => this.setState((prevState)=>this.setState({ advancedSearch: !prevState.advancedSearch }))}
                              >
                                More Options {this.state.advancedSearch ? "<<" : ">>"}
                              </Button>
                          {/* </Col> */}
                      </Row>
                    </Col>
                    <Col xs={12} md={6}>
                            <FormGroup>
                            <Label>Property Type</Label>
                            <Input id="style" type="select" multiple placeholder="Property Type" onChange={this.handleMultiSelect} value={query.style || []}>
                                {/* <option value="">All</option> */}
                                {options.styles.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
                              </Input>
                          </FormGroup>
                  </Col> 
              </Row>

              <Collapse isOpen={this.state.advancedSearch}>
                        <CardTitle className="adv-search">
                                <CardBody>
                                        <Row>
                                          <Col xs={6} md={4} className="search-form-group">
                                              <Row>
                                                <Col sm={6}>
                                                  <FormGroup>
                                                    <Label>Min Beds</Label>
                                                    <Input id="min_beds" type="number" placeholder="Min" onChange={this.handleChange} value={query.min_beds || ''}>
                                                    </Input>
                                                  </FormGroup>
                                                </Col>
                                                <Col sm={6}>
                                                  <FormGroup>
                                                    <Label>Max Beds</Label>
                                                    <Input id="max_beds" type="number" placeholder="Max" onChange={this.handleChange} value={query.max_beds || ''}>
                                                    </Input>
                                                  </FormGroup>
                                                </Col>
                                              </Row>
                                          </Col>
                                          <Col xs={6} md={4} className="search-form-group">
                                              <Row>
                                                <Col sm={6}>
                                                  <FormGroup>
                                                    <Label>Min Baths</Label>
                                                    <Input id="min_baths" type="number" placeholder="Min" onChange={this.handleChange} value={query.min_baths || ''}>
                                                    </Input>
                                                  </FormGroup>
                                                </Col>
                                                <Col sm={6}>
                                                  <FormGroup>
                                                    <Label>Max Baths</Label>
                                                    <Input id="max_baths" type="number" placeholder="Max" onChange={this.handleChange} value={query.max_baths || ''}>
                                                    </Input>
                                                  </FormGroup>
                                                </Col>
                                              </Row>
                                          </Col>
                                          <Col xs={6} md={4} className="search-form-group">
                                              <Row>
                                                <Col sm={6}>
                                                  <FormGroup>
                                                    <Label>Built After</Label>
                                                    <Input id="built_after" type="select" placeholder="" onChange={this.handleChange} value={query.built_after  || ''}>
                                                      <option value="">No Min</option>
                                                      {options.built_after.map(option => <option key={option} value={option}>{option}</option>)}
                                                    </Input>
                                                  </FormGroup>
                                                </Col>
                                                <Col sm={6}>
                                                <FormGroup>
                                                    <Label>Built Before</Label>
                                                    <Input id="built_before" type="select" placeholder="" onChange={this.handleChange} value={query.built_before  || ''}>
                                                      <option value="">No Min</option>
                                                      {options.built_after.map(option => <option key={option} value={option}>{option}</option>)}
                                                    </Input>
                                                  </FormGroup>
                                                </Col>
                                              </Row>
                                          </Col>
                                          </Row>
                                          <Row>
                                          <Col xs={6} md={4} className="search-form-group">
                                            <Row>
                                              <Col sm={6}>
                                                <FormGroup>
                                                  <Label>Min Sqft</Label>
                                                  <Input id="min_sqft" type="select" placeholder="Min Sqft" onChange={this.handleChange} value={query.min_sqft || ''}>
                                                    <option value="">No Min</option>
                                                    {options.sqft.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
                                                  </Input>
                                                </FormGroup>
                                              </Col>
                                              <Col sm={6}>
                                                <FormGroup>
                                                <Label>Max Sqft</Label>
                                                <Input id="max_sqft" type="select" placeholder="Max Sqft" onChange={this.handleChange} value={query.max_sqft || ''}>
                                                  <option value="">No Max</option>
                                                  {options.sqft.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
                                                </Input>
                                              </FormGroup>
                                              </Col>
                                            </Row>
                                          </Col>
                                          <Col xs={6} md={2}>
                                            <FormGroup>
                                              <Label>Min Lot Size</Label>
                                              <Input id="min_lot" type="select" placeholder="Min Lot Size" onChange={this.handleChange} value={query.min_lot || ''}>
                                                <option value="">No Min</option>
                                                {options.lot_size.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
                                              </Input>
                                            </FormGroup>
                                          </Col>
                      
                                          <Col sm={6} md={2}>
                                            <FormGroup>
                                              <Label>Max HOA</Label>
                                              <Input id="max_hoa" type="select" placeholder="Max HOA" onChange={this.handleChange} value={query.max_hoa || ''}>
                                                <option value="">No Max</option>
                                                {options.hoa.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
                                              </Input>
                                            </FormGroup>
                                          </Col>
                                          <Col sm={6} md={2}>
                                            <Label>DOM (Max)</Label>
                                            <Input id="max_days_on_market" type="number" placeholder="Max Days on Market" onChange={this.handleChange} value={query.max_days_on_market || ''}>
                                            </Input>
                                          </Col>
                                        {/*  <Col sm={6} md={3}>
                                            <Label check>
                                            <Input addon type="checkbox" id="include_pending" value={query.include_pending || ''} onChange={this.handleCheckbox} /> &nbsp;
                                            Include Pending
                                            </Label>
                                          </Col> */}
                                        </Row>
                                        <Row>
                                          <Col sm={6} md={8}>
                                            <CardTitle>Advanced Types</CardTitle>
                                            <FormGroup>
                                              <Row>
                                                <Col xs={3}>Bank Owned</Col>
                                                <Col xs={9}><ToggleLinkGroup id="bank_owned" value={query.bank_owned} onChange={this.handleChange} /></Col>
                                              </Row>&nbsp;
                                              <Row>
                                                <Col xs={3}>Short Sale</Col>
                                                <Col xs={9}><ToggleLinkGroup id="short_sale" value={query.short_sale} onChange={this.handleChange} /></Col>
                                              </Row>&nbsp;
                                              <Row>
                                                <Col xs={3}>Fixer-Upper</Col>
                                                <Col xs={9}><ToggleLinkGroup id="fixer" value={query.fixer} onChange={this.handleChange} /></Col>
                                              </Row>&nbsp;
                                              <Row>
                                                <Col xs={3}>New Construction</Col>
                                                <Col xs={9}><ToggleLinkGroup id="new_construction" value={query.new_construction} onChange={this.handleChange} /></Col>
                                              </Row>
                                            </FormGroup>
                                          </Col>
                                          <Col sm={6} md={4}>
                                              <CardTitle>Other Features</CardTitle>
                                              <CheckboxGroup name="features" value={query.features || []} onChange={(value) => {this.handleValueChange("features", value)}}>
                                                <CheckboxGroupCheckbox value="A">2nd Kitchen</CheckboxGroupCheckbox>
                                                <CheckboxGroupCheckbox value="B">2nd Master Bedroom</CheckboxGroupCheckbox>
                                              </CheckboxGroup>
                                            <Row>
                                            <Label check>
                                            <Input addon type="checkbox" id="include_pending" value={query.include_pending || ''} onChange={this.handleCheckbox} /> &nbsp;
                                            Include Pending
                                            </Label>
                                            </Row>
                                          </Col>
                                        </Row>
                              </CardBody>
                            </CardTitle>     
                        </Collapse>
         {/*            </div>
                  } */}
      </form>
    );
  }
}

export default SearchForm;
