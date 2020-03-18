
import React, { Component } from "react";

import { Card, Form, Input, Row, Col, FormGroup, Button, ButtonGroup, CardBody, CardTitle, CardFooter, Label, Alert} from 'reactstrap';

// import LoaderButton from "../common/LoaderButton/LoaderButton";
import {getSearchOptions} from '../../api/PropertyApi';
import Geocode from "react-geocode";
import { CSVReader } from 'react-papaparse';
import PlacesSuggest from './PlacesSuggest';
import SimpleReactValidator from 'simple-react-validator';
import {Storage} from "aws-amplify";

const uuidv4 = require('uuid/v4');

const defaultQueryProp = {
    mp_style: "1",
}

// keep global google below as a comment, DO NOT REMOVE THIS LINE
/* global google */ 
//const googleApiKey = 'AIzaSyAwtYJhBWHqxiV27OgdXUyr2KklYVTsulQ'; // prod key
const googleApiKey = 'AIzaSyBT6koyESZ1xjk7XJKcUdEa7AKgTwfAa3g'; // dev key

// const googleApiKey = process.env.REACT_APP_GOOGLE_API; // dev key
Geocode.setApiKey(googleApiKey);

class InputForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            uploadedFile: null,
            qPropList: defaultQueryProp,
            qCsvList: [],
            options: null,
            address: "",
            selectType: '',
            geo: true,
            csvFilename: ""
        };
        this.validator = new SimpleReactValidator();

        this.fileInput = React.createRef();
        this.handleChange = this.handleChange.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);
        this.handleValueChange = this.handleValueChange.bind(this);

    }
    componentDidMount() {
        getSearchOptions().then(val => {
            this.setState({options:val})
        })
    }
    handleSubmit = (e) => {
        e.preventDefault();
          
        // Add custom fields for single property input
        if (this.state.selectType == 'selectAddressMode') {
            if (!this.validator.allValid()) {
                this.validator.showMessages();
                // rerender to show messages for the first time
                this.forceUpdate();
                return;
            }
            var qPropList = this.state.qPropList;
            for (let [key, value] of Object.entries(qPropList)) {
                if (this.rpMappingTypes.hasOwnProperty(key)) {
                    qPropList[key] = this.setFormat(this.rpMappingTypes[key], value);
                } else {
                    qPropList[key] = value;
                }
            };

            this.addCustomFields(qPropList, false);
            var q = [];
            q.push(qPropList);
            this.props.onQueryChange("offprops", q);
        }
        this.props.onSubmit();
        
    }
    handleReadCSV = (data, filename) => {
        if (Object.keys(data.data).length > 10) {
            return <Alert>
                <div>Maximium allowed properties is 10</div>
            </Alert>
        }
        if (!data.meta.fields) {
            return <div> File must have header row </div>
        }
        // Remove properties that have no address
        Object.keys(data.data).forEach((key) => (data.data[key].Address == "") && delete data.data[key])

        this.setState({uploadedFile: data.data, csvFilename:filename});
        this.setState({geo: true});
        const qCsvList = this.standardizeFileFormat(data.data, true);
        this.setState({qCsvList});

    }
    
    handleOnError = (err, file, inputElem, reason) => {
        console.log(err);
    }
    handleImportOffer = (e) => {
        this.fileInput.current.click();
        this.changeoffMarketType('selectFileMode');
    }

    handleSample() {
        Storage.get('Sample Properties.csv')
        .then(result => {
            const link = document.createElement('a');
            link.href = result;
            link.setAttribute('download', 'Sample Properties.csv');
            document.body.appendChild(link);
            link.click();
        })
        .catch(err => console.log(err));

    }

    changeoffMarketType = (type) => {
        this.setState({selectType: type});
    }
    
    handleSelectChange(event) {
        this.setState({
          selectType: event.target.value
        });
      }
      
    handleChange = (e) => {
        const id = e.target.id;
        const value = e.target.value;

        this.handleValueChange(id, value);
    }
    handleValueChange = (id, value) => {
        let qPropList = {...this.state.qPropList};
        qPropList[id] = value;
        this.setState({qPropList});
    }
    
    handleClearAll = () => {
        this.setState({qPropList:defaultQueryProp, qCsvList:null, address:""});
        this.props.onClearAll();
    }

    handleSuggestion = (suggestion) => {
        this.changeoffMarketType('selectAddressMode');
        this.setState({csvFilename:""});
        this.handleClearAll();
        const id = suggestion.target.id;
        const value = suggestion.target.value;
        this.handleValueChange(id, value.address)
        const address = this.setAddressInfo(value.address_components, value.location)
        this.handleValueChange('street_address', address.street)
        this.handleValueChange('city', address.city)
        this.handleValueChange('state', address.state)
        this.handleValueChange('zipcode', address.zip)
        this.handleValueChange('county', address.county)
        this.handleValueChange('lat', value.lat)
        this.handleValueChange('long', value.lng)
    }

    submitProperty = () => {
        const options = this.state.options;

        const qList = this.state.qPropList
        this.setState({uploadedFile: null});
        const newProperty = [];
        for (let key in this.rpToUserMapping) {
            let newKey = this.rpToUserMapping[key];

            if (newKey == "Type") {
                var n = options.styles.find(o => o.value === parseInt(qList.mp_style));
                n && (newProperty[newKey] = n.name);
            } else if (newKey == undefined) {
                newProperty[newKey] = "";
            } else {
                newProperty[newKey] = qList[key];
            }
        }
        var newFile = [];
        newFile[0] = newProperty;
        this.setState({uploadedFile: newFile});
        return newFile;
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
    addCustomFields = (qList, geo) => {
        const options = this.state.options;
        qList["listing_id"] = uuidv4();
        qList["mp_status"] = "S";
        qList["mp_status_name"] = "Sold";
        !qList.mp_style && (qList["mp_style"] = 1);
        let n = options.styles.find(o => o.value === parseInt(qList.mp_style));
        qList["style_name"] = n.name;
        qList["mp_style_name"] = qList["style_name"];
        qList["style"] = this.getStyleCode(qList.mp_style, qList.floors, qList.basement, qList.units);
        qList["property_type"] = this.typeStyleMatches[qList.style_name];
        qList["original_price"] = qList.price && qList.price;
        qList["selling_price"] = qList.price && qList.price;

        !qList.hoa_dues && (qList["hoa_dues"] = 0);
        if (qList.mp_style == 7) {
            if (!qList.sqft) {
                var totalSqft = 0;
                for (let i = 1; i<=qList.units; i++) {
                    totalSqft += Number(qList["sqft"+i]);
                }
                qList["sqft"] = totalSqft;
            }
            var totalMonthlyIncome = 0;
            for (let i = 1; i<=qList.units; i++) {
                totalMonthlyIncome += Number(qList["rent"+i]);
            }
            qList["Current_TotalMonthlyIncome"] = totalMonthlyIncome;
            qList.bedrooms = 0;
            qList.bathrooms = 0;
            !qList.Current_WaterSewerGarbage && (qList["Current_WaterSewerGarbage"] = 0)
            !qList.Current_PropertyTaxes && (qList["Current_PropertyTaxes"] = 0)
            !qList.Current_Insurance && (qList["Current_Insurance"] = 0)
            !qList.Current_HODAnnual && (qList["Current_HODAnnual"] = qList.hoa_dues*12)
            !qList.Current_GrossSchedIncome && (qList["Current_GrossSchedIncome"] = 0)
            !qList.Current_EffectiveGrossIncome && (qList["Current_EffectiveGrossIncome"] = 0)
            !qList.Current_GrossRentMultiplier && (qList["Current_GrossRentMultiplier"] = 0)
            !qList.Current_NetOperatingIncome && (qList["Current_NetOperatingIncome"] = 0)
            !qList.Current_OperatingExpenses && (qList["Current_OperatingExpenses"] = 0)
            !qList.Current_PropertyMgmt && (qList["Current_PropertyMgmt"] = 0)
            !qList.Current_VacancyRate && (qList["Current_VacancyRate"] = 0)
            !qList.Current_ExpensesOther && (qList["Current_ExpensesOther"] = 0)

        }
        if (geo && qList.address) {
            Geocode.fromAddress(qList.address).then(
                response => {
                const address = this.setAddressInfo(response.results[0].address_components, response.results[0].geometry.location);
                const addr = address.street + ", " + address.city + " " + address.state + " " + address.zip;
                qList["address"] = addr;
                qList["street_address"] = address.street;
                qList["city"] =  address.city;
                qList["state"] =  address.state;
                qList["zipcode"] =  address.zip;
                qList["county"] = address.county;
                qList["lat"] =  address.lat;
                qList["long"] = address.long;
                },
                error => {
                console.error("Geocode error for property: ", qList.address, error);
                }
            ); 
        }           
    }
    setFormat = (type, value) => {
        var v = "";
        (type == "currency") && (v = Number(value.replace(/[^0-9.-]+/g,"")));
        (type == "number") && (v = parseInt(value));
        (type == "decimal") && (v = parseFloat(value));
        (type == "string") && (v = value.toString());
        return v;
    }

    standardizeFileFormat(uploadedFile, geo) {
        var qCsvList = this.state.qCsvList;
        qCsvList = [];
        // var newQuery = [];
        const options = this.state.options;

        uploadedFile.map(p => {
            // Fix the property Type first
            const sfrPattern = /^Single|SFR/i;
            const thPattern = /\s^Town|Townhome|Townhouse|Town house|Town Home/i;
            const condoPattern = /^Condo|Condominium/i;
            const coopPattern = /^Coop|Co-op/i;
            const multiPattern = /^Multi|Multifamily|Multi family|Multi-Family/i;
            
            var qList = {};
            for (let [key, value] of Object.entries(p)) {
                if (this.rpMapping[key] != undefined) {
                    const rpKey = this.rpMapping[key]();
                    if (rpKey) {
                        if (key == "Type") {
                                options.styles.map(o => {
                                (sfrPattern.test(value) && sfrPattern.test(o.name)) && (qList[rpKey.name] = o.value);
                                (thPattern.test(value) && thPattern.test(o.name)) && (qList[rpKey.name] = o.value);
                                (condoPattern.test(value) && condoPattern.test(o.name)) && (qList[rpKey.name] = o.value);
                                (coopPattern.test(value) && coopPattern.test(o.name)) && (qList[rpKey.name] = o.value);
                                (multiPattern.test(value) && multiPattern.test(o.name)) && (qList[rpKey.name] = o.value);
                            });
                        } else if (key == "Basement") {
                            qList[rpKey.name] = (value=="Yes") ? "Y": "N";
                        } else {
                            (value && qList.mpstyle) && this.validateValue(key, value, qList.mpstyle);
                            qList[rpKey.name] = (value && this.setFormat(rpKey.type, value))
                        }
                    }
                }
            };
            // done building list from user columns, now add RP specific columns from rpCustomKeys
            this.addCustomFields(qList, geo);
            qCsvList.push(qList);

        });

        this.props.onQueryChange("offprops", qCsvList);
        return qCsvList;
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
                long: location.lng
            }

            this.setState({
                address: address,
                lat: location.lat,
                long: location.lng,
            });
            return address;

        } catch (e) {
                this.setState({
                address: ""
            });
        }
    }
    findAddressComponent(components, type, version) {
        const address = components.find(function(component) {
          return (component.types.indexOf(type) !== -1);
        });
      
        return address[version];
    }
    renderMultiProperty = (q) => {
        let units = q.units;
        let rowUnits = [];
        var colSize = 12 / (units || 3);

        for (let i = 1;i<=units; i++) {
            rowUnits.push(
                    <Col xs={6} md={colSize} key={"unitNumber"+i}>
                        <CardTitle className="bg-info p-2 mb-0 text-white align-content-center text-center">
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
                                    <Input id={"rent"+i} type="number" placeholder="Rent" onChange={this.handleChange} />
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
        var queryProp = this.state.qPropList ? this.state.qPropList : [];

        // queryProp.mp_style = 1;
        queryProp.units = queryProp.units || 2;
        queryProp.basement = queryProp.basement || "N";
        queryProp.floors = queryProp.floors || 1;
        const options=this.state.options;
        
        if (!options) {
            return null;
          }

        return <div>
                <Form onSubmit={this.handleSubmit}>
                    {/* <Row> */}
                        <Card>
                            <CardBody>
                                <Row className="d-flex">
                                    <Col sm={6} md={3} className="d-flex">
                                        <Col xs={12} md={12}>
                                                    <CSVReader
                                                        onFileLoaded={this.handleReadCSV}
                                                        accept='text/csv'
                                                        inputRef={this.fileInput}
                                                        style={{display: 'none'}}
                                                        onError={this.handleOnError}
                                                        configOptions={{header: true}}
                                                    />
                                                <Col>
                                                    <p className="text-muted font-12">Maximum 10 properties</p>
                                                    <Row>
                                                        <Col md={8}>
                                                            <Button color="info" onClick={this.handleImportOffer}>Upload CSV file ...</Button>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Button color="secondary" onClick={this.handleSample}>Sample file</Button>  
                                                        </Col>                                                      
                                                    </Row>
                                                    <CardBody>
                                                    Current: <Label className="text-warning font-bold">{this.state.csvFilename}</Label>
                                                    </CardBody>
                                                </Col>
                                                <Col className="p-2">
                                                    <PlacesSuggest id="address" onChange={this.handleSuggestion} />&nbsp;&nbsp;
                                                    {/* <Row> */}
                                                        <FormGroup>
                                                            <Row>
                                                                <Col md={4}>
                                                                    <Label for="unitnumber">Unit: </Label>
                                                                </Col>
                                                                <Col md={8}>
                                                                    <Input type="text" placeholder="Mix of Numbers & letters" id="unitnumber" value={queryProp.unitnumber} onChange={this.handleChange} />
                                                                </Col>
                                                            </Row>
                                                        </FormGroup>                                                        
                                                    {/* </Row> */}
                                                    <FormGroup>
                                                        <Input id="mp_style" type="select" placeholder=""  onChange={this.handleChange} value={queryProp.mp_style}>
                                                            {options.styles.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
                                                        </Input>
                                                    </FormGroup>
                                                </Col>
                                        </Col>
                                    </Col>

                                    <Col sm={6} md={9}>
                                        {
                                        queryProp.mp_style != 7 &&
                                            <Col>
                                                <Row>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Beds</Label>
                                                                <Input id="bedrooms" type="number" placeholder="Beds" value={queryProp.bedrooms || ''} onChange={this.handleChange} />
                                                                {this.validator.message('bedrooms', queryProp.bedrooms, 'required|min:1,num|max:10,num')}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Baths </Label>
                                                                <Input id="bathrooms" type="number" step="0.25" placeholder="Baths" value={queryProp.bathrooms || ''} onChange={this.handleChange} />
                                                                {this.validator.message('bathrooms', queryProp.bathrooms, 'required|min:1.0,num|max:10.0,num')}
                                                            
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Sqft</Label>
                                                                <Input id="sqft" type="number" placeholder="Sqft" value={queryProp.sqft || ''} onChange={this.handleChange} />
                                                                {this.validator.message('sqft', queryProp.sqft, 'required|min:100,num')}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Year</Label>
                                                                <Input id="year_built" type="number" placeholder="Year Built" value={queryProp.year_built || ''} onChange={this.handleChange} />
                                                                {this.validator.message('year_built', queryProp.year_built, 'required|min:1800,num|max:2019,num')}
                                                            </FormGroup>
                                                        </Col>
                                                </Row>
                                                <Row>
                                                            <Col xs={6} md={3}>
                                                                <FormGroup>
                                                                    <Label>Price </Label>
                                                                    <Input id="price" type="number" placeholder="Price"  value={queryProp.price || ''} onChange={this.handleChange} />
                                                                    {this.validator.message('price', queryProp.price, 'required|min:0,num')}
                                                                </FormGroup>
                                                            </Col>
                                                            <Col xs={6} md={3}>
                                                                <FormGroup>
                                                                    <Label>HOA</Label>
                                                                    <Input id="hoa_dues" type="number" placeholder="HOA" value={queryProp.hoa_dues || ''}  onChange={this.handleChange} />
                                                                    {this.validator.message('hoa_dues', queryProp.hoa_dues, 'currency|min:0,num')}
                                                                </FormGroup>
                                                            </Col>
                                                            <Col xs={6} md={3}>
                                                                <FormGroup>
                                                                    <Row>
                                                                        <Label>Floors</Label>
                                                                        <Input id="floors" type="select" placeholder="Floors" value={queryProp.floors} onChange={this.handleChange} >
                                                                            <option>1</option>
                                                                            <option>2</option>
                                                                            <option>3</option>
                                                                        </Input>
                                                                    </Row>
                                                                </FormGroup>
                                                            </Col>
                                                            <Col xs={6} md={3}>
                                                                <FormGroup>
                                                                    <Label>Basement</Label>
                                                                    <Input type="select" id="basement" placeholder="Basement" value={queryProp.basement} onChange={this.handleChange} >
                                                                    <option>Y</option>
                                                                    <option>N</option>
                                                                    </Input>
                                                                </FormGroup>
                                                            </Col>
                                                </Row>
                                            </Col>
                                        }
                                        
                                        {
                                            queryProp.mp_style == 7 &&
                                            <div className="d-flex justify-content-between">
                                                <Col xs={12} md={6}>
                                                    <Row>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Year</Label>
                                                                <Input id="year_built" type="number" placeholder="Year Built" value={queryProp.year_built || ''} onChange={this.handleChange} />
                                                                {this.validator.message('year_built', queryProp.year_built, 'required|min:1800,num|max:2019,num')}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Sqft</Label>
                                                                <Input id="sqft" type="number" placeholder="Sqft" value={queryProp.sqft || ''} onChange={this.handleChange} />
                                                                {this.validator.message('sqft', queryProp.sqft, 'min:100,num')}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Price</Label>
                                                                <Input id="price" type="number" placeholder="Price" value={queryProp.price || ''} onChange={this.handleChange} />
                                                                {this.validator.message('price', queryProp.price, 'required|currency')}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Utilities</Label>
                                                                <Input id="Current_WaterSewerGarbage" type="number" placeholder="Utilities" value={queryProp.Current_WaterSewerGarbage || ''} onChange={this.handleChange} />
                                                                {this.validator.message('Utilities', queryProp.Current_WaterSewerGarbage, 'currency')}
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Taxes</Label>
                                                                <Input id="Current_PropertyTaxes" type="number" placeholder="Taxes" value={queryProp.Current_PropertyTaxes || ''} onChange={this.handleChange} />
                                                                {this.validator.message('Property Taxes', queryProp.Current_PropertyTaxes, 'currency')}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Insurance</Label>
                                                                <Input id="Current_Insurance" type="number" placeholder="Insurance" value={queryProp.Current_Insurance || ''} onChange={this.handleChange} />
                                                                {this.validator.message('Insurance', queryProp.Current_Insurance, 'currency')}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Other Expenses</Label>
                                                                <Input id="Current_ExpensesOther" type="number" placeholder="Insurance" value={queryProp.Current_ExpensesOther || ''} onChange={this.handleChange} />
                                                                {this.validator.message('Other Expenses', queryProp.Current_Insurance, 'currency')}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label>Property Mgmt</Label>
                                                                <Input id="Current_PropertyMgmt" type="number" placeholder="Prop Mgmt" value={queryProp.Current_PropertyMgmt || ''} onChange={this.handleChange} />
                                                                {this.validator.message('Property Mgmt', queryProp.Current_PropertyMgmt, 'currency')}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col xs={6} md={3}>
                                                            <FormGroup>
                                                                <Label># Units</Label>
                                                                <Input type="select" id="units" placeholder="Units" value={queryProp.units} onChange={this.handleChange} >
                                                                <option>2</option>
                                                                <option>3</option>
                                                                <option>4</option>
                                                                </Input>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                                <Col xs={12} md={6}>
                                                    {this.renderMultiProperty(queryProp)}
                                                </Col>
                                            
                                            </div>
                                        }
                                    </Col>
                                            </Row>
                                </CardBody>
                                <CardFooter>
                                    <ButtonGroup className="pull-right" >
                                        <Button  className="bg-success" type="submit" size="lg">Analyze</Button> &nbsp;&nbsp;
                                        <Button  color="danger" className="mdi mdi-notification-clear-all" onClick={this.handleClearAll}> Clear All</Button>
                                    </ButtonGroup>
                                </CardFooter>
                            </Card>
                    {/* </Row> */}

                </Form>
             </div>
    }

    rpMappingTypes = {
        "address":"string",
        "unitnumber":"string",
        "bedrooms":"number",
        "bathrooms":"decimal",
        "price":"currency",
        "sqft":"number",
        "year_built":"number",
        "hoa_dues":"currency",
        "style_name":"string",
        "floors":"number",
        "basement":"string",
        "Current_WaterSewerGarbage":"currency",
        "Current_Insurance":"currency",
        "Current_PropertyTaxes":"currency",
        "Current_ExpensesOther":"currency",
        "units":"number",
        "bed1":"number",
        "bath1":"decimal",
        "sqft1":"number",
        "rent1":"currency",
        "bed2":"number",
        "bath2":"decimal",
        "sqft2":"number",
        "rent2":"currency",
        "bed3":"number",
        "bath3":"decimal",
        "sqft3":"number",
        "rent3":"currency",
        "bed4":"number",
        "bath4":"decimal",
        "sqft4":"number",
        "rent4":"currency",
        "original_price":"currency",
        "mp_style":"number"
    }

    rpToUserMapping = {
        "address":"Address",
        "unitnumber":"Unit",
        "bedrooms":"Beds",
        "bathrooms":"Baths",
        "price":"Price",
        "sqft":"Sqft",
        "year_built":"Year Built",
        "hoa_dues":"HOA",
        "mp_style":"Type",
        "floors":"Floors",
        "basement":"Basement",
        "Current_WaterSewerGarbage":"WaterSewerGarbage",
        "Current_Insurance":"Insurance",
        "Current_PropertyTaxes":"Property Taxes",
        "Current_ExpensesOther":"Other Expenses",
        "units":"Number of Units",
        "bed1":"Bed1",
        "bath1":"Bath1",
        "sqft1":"Sqft1",
        "rent1":"Rent1",
        "bed2":"Bed2",
        "bath2":"Bath2",
        "sqft2":"Sqft2",
        "rent2":"Rent2",
        "bed3":"Bed3",
        "bath3":"Bath3",
        "sqft3":"Sqft3",
        "rent3":"Rent3",
        "bed4":"Bed4",
        "bath4":"Bath4",
        "sqft4":"Sqft4",
        "rent4":"Rent4"
    }

    rpMapping = {
        "Address": function() {const rpKey = {name: "address", type:"string"};return rpKey},
        "Unit": function() {const rpKey = {name: "unitnumber", type:"string"};return rpKey},
        "Beds": function() {const rpKey = {name: "bedrooms", type:"number"}; return rpKey},
        "Baths": function() {const rpKey = {name: "bathrooms", type:"decimal"};return rpKey},
        "Price": function() {const rpKey = {name: "price", type:"currency"}; return rpKey},
        "Sqft": function() {const rpKey = {name: "sqft", type:"number"}; return rpKey},
        "Year Built": function() {const rpKey = {name: "year_built", type:"number"}; return rpKey},
        "HOA": function() {const rpKey = {name: "hoa_dues", type:"currency"}; return rpKey},
        "Type": function() {const rpKey = {name: "mp_style", type:"string"}; return rpKey},
        "Floors": function() {const rpKey = {name: "floors", type:"number"}; return rpKey},
        "Basement": function() {const rpKey = {name: "basement", type:"string"}; return rpKey},
        "WaterSewerGarbage": function() {const rpKey = {name: "Current_WaterSewerGarbage", type:"currency"}; return rpKey},
        "Insurance": function() {const rpKey = {name: "Current_Insurance", type:"currency"}; return rpKey},
        "Property Taxes": function() {const rpKey = {name: "Current_PropertyTaxes", type:"currency"}; return rpKey},
        "Other Expenses": function() {const rpKey = {name: "Current_ExpensesOther", type:"currency"}; return rpKey},
        "Number of Units": function() {const rpKey = {name: "units", type:"number"}; return rpKey},
        "Bed1": function() {const rpKey = {name: "bed1", type:"number"}; return rpKey},
        "Bath1": function() {const rpKey = {name: "bath1", type:"decimal"}; return rpKey},
        "Sqft1": function() {const rpKey = {name: "sqft1", type:"number"}; return rpKey},
        "Rent1": function() {const rpKey = {name: "rent1", type:"currency"}; return rpKey},
        "Bed2": function() {const rpKey = {name: "bed2", type:"number"}; return rpKey},
        "Bath2": function() {const rpKey = {name: "bath2", type:"decimal"}; return rpKey},
        "Sqft2": function() {const rpKey = {name: "sqft2", type:"number"}; return rpKey},
        "Rent2": function() {const rpKey = {name: "rent2", type:"currency"}; return rpKey},
        "Bed3": function() {const rpKey = {name: "bed3", type:"number"}; return rpKey},
        "Bath3": function() {const rpKey = {name: "bath3", type:"decimal"}; return rpKey},
        "Sqft3": function() {const rpKey = {name: "sqft3", type:"number"}; return rpKey},
        "Rent3": function() {const rpKey = {name: "rent3", type:"currency"}; return rpKey},
        "Bed4": function() {const rpKey = {name: "bed4", type:"number"}; return rpKey},
        "Bath4": function() {const rpKey = {name: "bath4", type:"decimal"}; return rpKey},
        "Sqft4": function() {const rpKey = {name: "sqft4", type:"number"}; return rpKey},
        "Rent4": function() {const rpKey = {name: "rent4", type:"currency"}; return rpKey}
    }

    typeStyleMatches = {
        "Single Family Residence":"RESI",
        "Town House":"RESI",
        "Condo":"COND",
        "Manufactured Home":"MANU",
        "Rental":"RENT",
        "Multi-Family":"MULT",
        "Co-Op":"COND"
    }

    mlsStyleMatches = [
        {type:1,floors:1,basement:"N", code:10},	// 10,11,14 SFR
        {type:1,floors:2,basement:"N", code:12},	// 12 SFR
        {type:1,floors:3,basement:"N", code:13},	// 13 SFR
        {type:1,floors:1,basement:"Y", code:16},	// 16,17 SFR
        {type:1,floors:2,basement:"Y", code:18},	// 18 SFR
        {type:1,floors:3,basement:"Y", code:13},	// 18 SFR
        {type:2, code:32},	// 32 Townhouse
        {type:3,floors:1, code:30},	// 30 Condo
        {type:3,floors:2, code:31},	// 31 Condo
        {type:3,floors:3, code:34},	// 34 Condo
        {type:4, code:20},	// 20,21,22 Manu
        {type:7, units:2, code:52},	// 52,42 MF
        {type:7, units:3, code:53},	// 53,42 MF
        {type:7, units:4, code:54}	// 54,42 MF
    
    ]

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

export default InputForm;