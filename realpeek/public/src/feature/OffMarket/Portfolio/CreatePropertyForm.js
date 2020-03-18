import React, {Component} from "react"
import {Form, Input, Button, Row, Col, Label, FormGroup, Card, CardBody, CardTitle, ButtonGroup} from "reactstrap"
import PlacesSuggest from '../PlacesSuggest';
import {withSettings} from "../../../api/SettingsProvider";
import SimpleReactValidator from 'simple-react-validator';

import {FormField} from '../../admin/HorizontalFormField'
import LoaderButton from "../../common/LoaderButton/LoaderButton";


class CreatePropertyForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rSelected: 'seller'
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleValueChange = this.handleValueChange.bind(this);
        this.handleTypeChange = this.handleTypeChange.bind(this);
        this.onRadioBtnClick = this.onRadioBtnClick.bind(this);
        this.validator = new SimpleReactValidator();
    }

    onRadioBtnClick(rSelected) {
        this.setState({ rSelected });
    }
    handleChange(event) {
        this.handleValueChange(event.target.id, event.target.value);
    }
    handleValueChange = (id, value) => {
        this.props.onPortfolioChange(id, value);
    }

    handleTypeChange= async (event) => {
        const value = event.target.value;
        await this.handleValueChange(event.target.id, value);
        await this.handleValueChange("property_type", this.propertyTypeMatches[value])
        let n = this.props.options.styles.find(o => o.value === parseInt(value));
        await this.handleValueChange("mp_style_name", n.name)
    }

    changeBuyerSeller = (buyerSeller) => {
        this.handleValueChange('buyerseller', buyerSeller);
    }

    addProperty = async (e) => {
        e.preventDefault();
        if (!this.validator.allValid()) {
            this.validator.showMessages();
            // rerender to show messages for the first time
            this.forceUpdate();
            return;
        }
        var pfolio = this.props.pfolio;

        // this.handleValueChange("property_type", this.propertyTypeMatches[pfolio.mp_style])
        // this.handleValueChange("mp_status", "S")
        // this.handleValueChange("mp_status_name", "Sold")
        const style_code = this.getStyleCode(pfolio.mp_style, pfolio.floors, pfolio.basement, pfolio.units);
        await this.handleValueChange("style_code", style_code)
        // let n = this.props.options.styles.find(o => o.value === parseInt(pfolio.mp_style));
        // this.handleValueChange("mp_style_name", n.name)
        this.props.onAction("add");
    }

    deleteProperty = () => {
        this.props.onAction("delete");
    }

    saveProperty = () => {
        this.props.onAction("save");
    }

    clearProperty = () => {
        this.props.onAction("clear");
    }
    handleSubmit = (e) => {
        e.preventDefault();
        if (!this.validator.allValid()) {
            this.validator.showMessages();
            // rerender to show messages for the first time
            this.forceUpdate();
            return;
        }
        this.props.onAction();
    }

    
    handleSuggestion = (suggestion) => {;
        const id = suggestion.target.id;
        const value = suggestion.target.value;
        this.handleValueChange(id, value.address)
        const address = this.setAddressInfo(value.address_components, value.location)
        this.handleValueChange('street_address', address.street)
        this.handleValueChange('city', address.city)
        this.handleValueChange('statename', address.state)
        this.handleValueChange('zipcode', address.zip)
        this.handleValueChange('county', address.county)
        this.handleValueChange('lat', value.lat)
        this.handleValueChange('lng', value.lng)
    }
    setAddressInfo(components, location) {
        try {
            const address = {
                street: this.findAddressComponent(components, 'street_number', 'short_name') + ' ' + this.findAddressComponent(components, 'route', 'short_name'),
                city: this.findAddressComponent(components, 'locality', 'short_name'),
                state: this.findAddressComponent(components, 'administrative_area_level_1', 'short_name'),
                zip: this.findAddressComponent(components, 'postal_code', 'short_name'),
                county: this.findAddressComponent(components, 'administrative_area_level_2', 'short_name').replace(/ County/g, ""),
                lat: location.lat,
                lng: location.lng
            }

            // this.setState({
            //     address: address,
            //     lat: location.lat,
            //     lng: location.lng,
            // });
            return address;

        } catch (e) {
            console.log(e)
                // this.setState({
                // address: ""
            // });
        }
    }
    findAddressComponent(components, type, version) {
        const address = components.find(function(component) {
          return (component.types.indexOf(type) !== -1);
        });
      
        return address[version];
    }

    getStyleCode(mp_style, floors, basement, units) {
        const b = (basement=="Yes") ? "Y": "N";
        if (mp_style == 1) {
            const lookup = mp_style.toString()+floors.toString()+b;
            return this.mlsStylesLookup[lookup]();

        }
        if ((mp_style == 2) || (mp_style == 4)) {
            const lookup = mp_style.toString();
            return this.mlsStylesLookup[lookup]();
        }
        if (mp_style == 3) {
            const lookup = mp_style.toString()+floors.toString();
            return this.mlsStylesLookup[lookup]();

        }
        if (mp_style == 7) {
            const lookup = mp_style.toString()+units.toString();
            return this.mlsStylesLookup[lookup]();
        }

    }

    renderMultiProperty = (q) => {
        let units = q.units;
        let rowUnits = [];
        var colSize = 12 / (units || 3);

        for (let i = 1;i<=units; i++) {
            rowUnits.push(
                    <Col xs={6} md={colSize} key={"unitNumber"+i}>
                        <CardTitle className="bg-info p-1 mb-0 text-white align-content-center text-center">
                            <h6 key={i}>Unit {i}</h6>
                        </CardTitle>
                        <FormGroup>
                            <Row>
                            <Label xs={4}>Beds</Label>
                                <Col xs={8}>
                                    <Input id={"bed"+i} type="number" placeholder="Beds" onChange={this.handleChange}/>
                                </Col>
                            </Row>
                        </FormGroup>
                        <FormGroup>
                            <Row>
                                <Label xs={4}>Bath</Label>
                                <Col xs={8}>
                                    <Input id={"bath"+i} type="number" step="0.25" placeholder="Bath" onChange={this.handleChange}/>
                                </Col>
                            </Row>
                        </FormGroup>
                        <FormGroup>
                            <Row>
                                <Label  xs={4}>Sqft</Label>
                                <Col xs={8}>
                                    <Input id={"sqft"+i} type="number" placeholder="Sqft" onChange={this.handleChange} />
                                </Col>
                            </Row>
                        </FormGroup>
                        <FormGroup>
                            <Row>
                                <Label  xs={4}>Rent</Label>
                                <Col xs={8}>
                                    <Input id={"monthly_rent_unit"+i} type="number" placeholder="Rent" onChange={this.handleChange} />
                                </Col>
                            </Row>
                        </FormGroup>
                    </Col>
                );
        }
        return <div className="d-flex align-items-start">
                {rowUnits}
            </div>;
    }

    render() {
        this.validator.purgeFields();
        const options = this.props.options;

        var pfolio = this.props.pfolio;
        return <div>
        <CardBody>
            <Row>
                
                <Col sm={12} md={6}>
                    <Button className="btn bg-secondary" onClick={this.addProperty}>Add</Button>&nbsp;&nbsp;
                    <Button className="btn bg-secondary" onClick={this.saveProperty}>Save</Button>&nbsp;&nbsp;
                    <Button className="btn bg-secondary" onClick={this.clearProperty}>Clear</Button>&nbsp;&nbsp;
                    <Button className="btn bg-danger" onClick={this.deleteProperty}>Delete</Button>&nbsp;&nbsp;
                </Col>
                <Col sm={12} md={6}>
                <ButtonGroup>
                    <Button outline
                        className="bg-success font-bold"
                        onClick={() => this.onRadioBtnClick('seller')}
                        active={this.state.rSelected === 'seller'}
                    >
                        I am a Seller
                    </Button>&nbsp;&nbsp;&nbsp;
                    <Button outline
                        className="bg-success font-bold"
                        onClick={() => this.onRadioBtnClick('buyer')}
                        active={this.state.rSelected === 'buyer'}
                    >
                        I am a Buyer
                    </Button>
                </ButtonGroup>
                </Col>            
            </Row>
            </CardBody>


            
            {/* <Form className="form-material" horizontal="true" onSubmit={this.handleSubmit}> */}

                <CardTitle className="bg-info border-bottom p-1 mb-0 text-white">
                        Property Description
                </CardTitle>
                <CardBody>
                    <Row>
                        <Col sm={12} md={5}>
                            <FormGroup>
                                <Row>
                                    <Label sm="3">Property Name</Label>
                                        <Col sm="9">
                                            <Input id="property_name" type="text" placeholder="Name" value={pfolio.property_name || ''} onChange={this.handleChange} />
                                    </Col>
                                </Row>
                            </FormGroup>
                            
                            <FormGroup>
                                <Row>
                                    <Label sm="3">Address</Label>
                                        <Col sm="9">
                                        <PlacesSuggest id="address" address={pfolio.address} onChange={this.handleSuggestion} />
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup>
                                <Row>
                                    <Label sm="3" for="unitnumber">Unit</Label>
                                    <Col sm="9">
                                        <Input type="text" placeholder="Mix of Numbers & letters" id="unitnumber" value={pfolio.unitnumber || ''} onChange={this.handleChange} />
                                    </Col>
                                </Row>
                            </FormGroup>                                                        
                            <FormGroup>
                                <Row>
                                    <Label sm="3">Type</Label>
                                    <Col sm="9">
                                        <Input id="mp_style" type="select" placeholder=""  onChange={this.handleTypeChange} value={pfolio.mp_style}>
                                        {options.styles.map(option => <option key={option.value} value={option.value}>{option.name}</option>)} />
                                        </Input>
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup>
                                <Row>
                                    <Label sm="3">Year Built</Label>
                                    <Col sm="9">
                                        <Input id="year_built" type="number" placeholder="Year Built" value={pfolio.year_built || ''} onChange={this.handleChange} />
                                        {this.validator.message('year_built', pfolio.year_built, 'required|min:1800,num|max:2019,num')}
                                    </Col>
                                </Row>
                            </FormGroup>
                            {
                                this.state.rSelected === 'seller' && <div>
                                    <FormGroup>
                                        <Row>
                                            <Label sm="3">Vacancy Rate</Label>
                                            <Col sm="9">
                                                <Input id="market_vacancy_rate" type="number" value={pfolio.market_vacancy_rate || ''} onChange={this.handleChange} />
                                                {this.validator.message('market_vacancy_rate', pfolio.market_vacancy_rate, 'required|min:1.0,num|max:10.0,num')}
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                    <FormGroup>
                                        <Row>
                                            <Label sm="3">Market Cap Rate</Label>
                                            <Col sm="9">
                                                <Input id="market_cap_rate" type="number" value={pfolio.market_cap_rate || ''} onChange={this.handleChange} />
                                                {this.validator.message('market_cap_rate', pfolio.market_cap_rate, 'required|min:1.0,num|max:10.0,num')}
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                </div>
                            }
                        </Col>
                        <Col sm={12} md={7}>
                            {
                                pfolio.mp_style != 7 && <div>
                                    <FormGroup>
                                        <Row>
                                            <Label sm="2">SqFt</Label>
                                            <Col sm="6">
                                                <Input id="sqft" type="number" placeholder="Sqft" value={pfolio.sqft || ''} onChange={this.handleChange} />
                                                {this.validator.message('sqft', pfolio.sqft, 'required|min:100,num')}
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                    <FormGroup>
                                        <Row>
                                            <Label sm="2">Beds</Label>
                                            <Col sm="6">
                                                <Input id="bedrooms" type="number" placeholder="Beds" value={pfolio.bedrooms || ''} onChange={this.handleChange} />
                                                {this.validator.message('bedrooms', pfolio.bedrooms, 'required|min:1,num|max:10,num')}
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                    <FormGroup>
                                        <Row>
                                            <Label sm="2">Baths</Label>
                                            <Col sm="6">
                                                <Input id="bathrooms" type="number" step="0.25" placeholder="Baths" value={pfolio.bathrooms || ''} onChange={this.handleChange} />
                                                {this.validator.message('bathrooms', pfolio.bathrooms, 'required|min:1.0,num|max:10.0,num')}
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                    <FormGroup>
                                        <Row>
                                            <Label sm="2">Floors</Label>
                                            <Col sm="6">
                                                <Input id="floors" type="select" placeholder="Floors" value={pfolio.floors || ''} onChange={this.handleChange} >
                                                    <option>1</option>
                                                    <option>2</option>
                                                    <option>3</option>
                                                </Input>
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                    <FormGroup>
                                        <Row>
                                            <Label sm="2">Basement</Label>
                                            <Col sm="6">
                                                <Input type="select" id="basement" placeholder="Basement" value={pfolio.basement || ''} onChange={this.handleChange} >
                                                    <option>Y</option>
                                                    <option>N</option>
                                                </Input>
                                            </Col>
                                        </Row>
                                    </FormGroup>
                                    <FormGroup>
                                        <Row>
                                            <Label sm="2">Monthly Rent</Label>
                                            <Col sm="6">
                                                <Input id="current_monthly_rent" type="number" placeholder="Rent"  value={pfolio.current_monthly_rent || ''} onChange={this.handleChange} />
                                                {/* {this.validator.message('current_monthly_rent', pfolio.current_monthly_rent, 'required|min:0,num')} */}
                                            </Col>
                                        </Row>
                                    </FormGroup>

                                </div>
                            }
                            {
                                pfolio.mp_style == 7 && <div>
                                    <FormGroup>
                                        <Row>
                                            <Label sm="4">Number of Units</Label>
                                            <Col sm="8">
                                                <Input type="select" id="units" placeholder="Units" value={pfolio.units} onChange={this.handleChange} >
                                                <option>2</option>
                                                <option>3</option>
                                                <option>4</option>
                                                </Input>
                                            </Col>
                                        </Row>
                                    </FormGroup>
                        
                                    {this.renderMultiProperty(pfolio)}
                                </div>
                            }
                        </Col>
                    </Row>
                </CardBody>
                    <CardTitle className="bg-info border-bottom p-1 mb-0 text-white">
                                Purchase
                    </CardTitle>
                    <CardBody>
                        <FormGroup>
                            <Row>
                                <Label sm="2">Improvements</Label>
                                <Col sm="6">
                                    <Input id="current_improvements" type="number" placeholder="Improvements"  value={pfolio.current_improvements || ''} onChange={this.handleChange} />
                                    {this.validator.message('current_improvements', pfolio.current_improvements, 'required|min:0,num')}
                                </Col>
                            </Row> 
                        </FormGroup>
                    {
                        this.state.rSelected === 'buyer' &&
                                <FormGroup>
                                    <Row>
                                        <Label sm="2">Desired Purchase Price</Label>
                                        <Col sm="6">
                                            <Input id="purchase_price" type="number" placeholder="Purchase Price"  value={pfolio.purchase_price || ''} onChange={this.handleChange} />
                                            {this.validator.message('purchase_price', pfolio.purchase_price, 'required|min:0,num')}
                                        </Col>
                                    </Row>
                                </FormGroup>
                    }
                    {
                        this.state.rSelected === 'seller' && <div>
                                <FormGroup>
                                    <Row>
                                        <Label sm="2">Original Purchase Price</Label>
                                        <Col sm="6">
                                            <Input id="purchase_price" type="number" placeholder="Purchase Price"  value={pfolio.purchase_price || ''} onChange={this.handleChange} />
                                            {this.validator.message('purchase_price', pfolio.purchase_price, 'required|min:0,num')}
                                        </Col>
                                    </Row>
                                </FormGroup>
                                <FormGroup>
                                    <Row>
                                        <Label sm="2">Closing Costs</Label>
                                        <Col sm="6">
                                            <Input id="current_closing_costs" type="number" placeholder="Closing Costs"  value={pfolio.current_closing_costs || ''} onChange={this.handleChange} />
                                            {this.validator.message('current_closing_costs', pfolio.current_closing_costs, 'required|min:0,num')}
                                        </Col>
                                    </Row>
                                </FormGroup>
                                <FormGroup>
                                    <Row>
                                        <Label sm="2">Original Loan Amount</Label>
                                        <Col sm="6">
                                            <Input id="original_loan" type="number" placeholder="Original Loan Amount"  value={pfolio.original_loan || ''} onChange={this.handleChange} />
                                            {this.validator.message('original_loan', pfolio.original_loan, 'required|min:0,num')}                
                                        </Col>
                                    </Row>                
                                </FormGroup>
                                <FormGroup>
                                    <Row>
                                        <Label sm="2">Current Loan Amount</Label>
                                        <Col sm="6">
                                            <Input id="current_loan" type="number" placeholder="Current Loan Amount"  value={pfolio.current_loan || ''} onChange={this.handleChange} />
                                            {this.validator.message('current_loan', pfolio.current_loan, 'required|min:0,num')}
                                        </Col>
                                    </Row> 
                                </FormGroup>
                        </div>
                    }
                    </CardBody>
                        
                    <CardTitle className="bg-info border-bottom p-1 mb-0 text-white">
                        Income
                    </CardTitle>
                    <CardBody>
                        <FormGroup>
                            <Row>
                                <Label sm="2">Other Monthly Income</Label>
                                <Col sm="6">
                                    <Input id="current_other_monthly_income" type="number" placeholder="Other Monthly Income"  value={pfolio.current_other_monthly_income || ''} onChange={this.handleChange} />
                                    {this.validator.message('current_other_monthly_income', pfolio.current_other_monthly_income, 'required|min:0,num')}
                                </Col>
                            </Row>
                        </FormGroup>
                    </CardBody>

                <CardTitle className="bg-info border-bottom p-1 mb-0 text-white">
                        Expenses
                </CardTitle>
                <CardBody>
                    {
                            this.state.rSelected === 'seller' &&
                        <FormGroup>
                            <Row>
                                <Label sm="2">Monthly Mortgage Payment</Label>
                                <Col sm="6">
                                    <Input id="monthly_mortgage" type="number" placeholder="Mortgage payment ($)"  value={pfolio.monthly_mortgage || ''} onChange={this.handleChange} />
                                    {this.validator.message('monthly_mortgage', pfolio.monthly_mortgage, 'required|min:0,num')}
                                </Col>
                            </Row>
                        </FormGroup>
                    }
                    <FormGroup>
                        <Row>
                            <Label sm="2">Annual Property Taxes</Label>
                            <Col sm="6">
                                <Input id="annual_property_taxes" type="number" placeholder="Property Tax ($)"  value={pfolio.annual_property_taxes || ''} onChange={this.handleChange} />
                                {this.validator.message('annual_property_taxes', pfolio.annual_property_taxes, 'required|min:0,num')}
                            </Col>
                        </Row>
                    </FormGroup>
                    <FormGroup>
                        <Row>
                            <Label sm="2">Annual Insurance</Label>
                            <Col sm="6">
                                <Input id="annual_insurance" type="number" placeholder="Insurance ($)"  value={pfolio.annual_insurance || ''} onChange={this.handleChange} />
                                {this.validator.message('annual_insurance', pfolio.annual_insurance, 'required|min:0,num')}
                            </Col>
                        </Row>
                    </FormGroup>
                    <FormGroup>
                        <Row>
                            <Label sm="2">Annual Maintenance & Repairs</Label>
                            <Col sm="6">
                                <Input id="annual_maintenance" type="number" placeholder="Maintenance ($)"  value={pfolio.annual_maintenance || ''} onChange={this.handleChange} />
                                {this.validator.message('annual_maintenance', pfolio.annual_maintenance, 'required|min:0,num')}
                            </Col>
                        </Row>
                    </FormGroup>
                    <FormGroup>
                        <Row>
                            <Label sm="2">Annual Utilities (Water,Sewer,Garbage)</Label>
                            <Col sm="6">
                                <Input id="annual_utilities" type="number" placeholder="Utilities ($)"  value={pfolio.annual_utilities || ''} onChange={this.handleChange} />
                                {this.validator.message('annual_utilities', pfolio.annual_utilities, 'required|min:0,num')}
                            </Col>
                        </Row>
                    </FormGroup>
                    <FormGroup>
                        <Row>
                            <Label sm="2">Monthly Property Managemet Fees</Label>
                            <Col sm="6">
                                <Input id="monthly_property_mgmt" type="number" placeholder="Monthly Property Managemet Fees ($)"  value={pfolio.monthly_property_mgmt || ''} onChange={this.handleChange} />
                                {this.validator.message('monthly_property_mgmt', pfolio.monthly_property_mgmt, 'required|min:0,num')}
                            </Col>
                        </Row>
                    </FormGroup>
                    <FormGroup>
                        <Row>
                            <Label sm="2">Monthly HOA dues</Label>
                            <Col sm="6">
                                <Input id="monthly_hoa_dues" type="number" placeholder="Dues"  value={pfolio.monthly_hoa_dues || ''} onChange={this.handleChange} />
                                {this.validator.message('monthly_hoa_dues', pfolio.monthly_hoa_dues, 'required|min:0,num')}
                            </Col>
                        </Row>
                    </FormGroup>
                    <FormGroup>
                        <Row>
                            <Label sm="2">Other Annual Expenses</Label>
                            <Col sm="6">
                                <Input id="other_annual_expenses" type="number" placeholder="Other Expenses"  value={pfolio.other_annual_expenses || ''} onChange={this.handleChange} />
                                {this.validator.message('other_annual_expenses', pfolio.other_annual_expenses, 'required|min:0,num')}
                            </Col>
                        </Row>
                    </FormGroup>
                </CardBody>

                {
                        this.state.rSelected === 'seller' && <div>
                        <CardTitle className="bg-info border-bottom p-1 mb-0 text-white">
                                Cash Out
                        </CardTitle>
                        <CardBody>
                            <FormGroup>
                                <Row>
                                    <Label sm="2">Broker Commission</Label>
                                    <Col sm="6">
                                        <Input id="broker_commission" type="number" placeholder="Commission"  value={pfolio.broker_commission || ''} onChange={this.handleChange} />
                                        {this.validator.message('broker_commission', pfolio.broker_commission, 'required|min:0,num')}
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup>
                                <Row>
                                    <Label sm="2">Sales Excise Tax</Label>
                                    <Col sm="6">
                                        <Input id="excise_tax" type="number" placeholder="Excise Tax"  value={pfolio.excise_tax || ''} onChange={this.handleChange} />
                                        {this.validator.message('excise_tax', pfolio.excise_tax, 'required|min:0,num')}
                                    </Col>
                                </Row>
                            </FormGroup>
                        </CardBody>
                    </div>
                }

                <Row>
                <CardBody>
                    <Button className="btn bg-secondary" onClick={this.addProperty}>Add</Button>&nbsp;&nbsp;
                    <Button className="btn bg-danger" onClick={this.deleteProperty}>Delete</Button>&nbsp;&nbsp;
                    <Button className="btn bg-secondary" onClick={this.saveProperty}>Save</Button>&nbsp;&nbsp;
                    <Button className="btn bg-secondary" onClick={this.clearProperty}>Clear</Button>&nbsp;&nbsp;
                </CardBody>
            </Row>

                {/* <LoaderButton type="submit" isLoading={this.props.loading} loadingText="Adding Property...">
                    {this.props.mode}</LoaderButton> */}
            {/* </Form> */}
        </div>
    }

    propertyTypeMatches = {
        1:"RESI",
        2:"RESI",
        3:"COND",
        7:"MULT",
        10:"COND"
    }

    mlsStylesLookup = {
        "11N": function() {return 10;},
        "12N": function() {return 12;},
        "13N": function() {return 13;},
        "11Y": function() {return 16;},
        "12Y": function() {return 18;},
        "13Y": function() {return 13;},
        "2": function() {return 32;},
        "31": function() {return 30;},
        "32": function() {return 31;},
        "33": function() {return 34;},
        "4": function() {return 20;},
        "72": function() {return 52;},
        "73": function() {return 53;},
        "74": function() {return 54;}
    };
}

export { CreatePropertyForm};
