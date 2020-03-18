import React, {Component} from "react"
import {Button, Card, CardBody, Row, Col, Input, Label, FormGroup } from "reactstrap"
import {Link} from "react-router-dom";

import Confirm from 'react-confirm-bootstrap';
import { getFolioProperty, getFolioProperties, createFolioProperty, deleteFolioProperty, updateFolioProperty, getSearchOptions } from '../../../api/PropertyApi';
import {Storage} from "aws-amplify";
import LoaderButton from "../../common/LoaderButton/LoaderButton";
import {CreatePropertyForm} from "./CreatePropertyForm";
import Loader from 'react-loader-advanced';
import ReactTable from "react-table";
import "react-table/react-table.css";
import BootstrapTable from 'react-bootstrap-table-next';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';


const defaultPortfolio = {
    property_name: "",
    address: "",
    units: 2,
    unitnumber: "",
    mp_style: 1,
    year_built: "",
    sqft: "",
    market_vacancy_rate: 8.0,
    market_cap_rate: 5.0,
    bedrooms: "",
    bathrooms: "",
    purchase_price: "",
    current_closing_costs: "",
    original_loan: "",
    current_improvements: 0,
    current_loan: "",
    current_monthly_rent: "",
    current_other_monthly_income: 0,
    monthly_mortgage: "",
    annual_property_taxes: "",
    annual_insurance: "",
    annual_maintenance: "",
    annual_utilities: "",
    monthly_property_mgmt: 0.0,
    monthly_hoa_dues: 0,
    other_annual_expenses: 0,
    broker_commission: 6.0,
    excise_tax: 1.78
}
class PortfolioManager extends Component {
    constructor(props) {
        super(props);
        this.state = {
            portfolio: defaultPortfolio,
            portfolio_name: "",
            loading: false,
            addingProperty: false,
            editingProperty: false,
            deletingProperty: false,
            creating: false,
            created: false,
            saving: false,
            saved: false,
            error: null,
            options: null,
            savedPortfolioList: null,
            selected: null,
            rowIndex: null
        }
    }

    componentDidMount = async () => {
        getSearchOptions().then(val => {
            this.setState({options:val})
        })

        this.loadPortfolioList();
    }

    handleAction =(action) => {
        switch (action) {
            case "add":
                this.handleAddProperty();
                break;
            case "delete":
                this.handleDeleteProperty();
                break;
            case "save":
                this.handleSaveProperty();
                break;
            case "clear":
                this.setState({portfolio: defaultPortfolio});
                break;
        }
    }
    handlePortfolioChange = (id, newValue) => {
        this.setState((prevState) => {
            const newPortfolio = prevState.portfolio;
            newPortfolio[id] = newValue;
            return {portfolio: newPortfolio};
        })
    }
    handleAddProperty = () => {
        const f = {};
        if (this.state.savedPortfolioList) {
            const savedPortfolioList = this.state.savedPortfolioList;
            const savedproperty = savedPortfolioList.filter(x => x.folio_property.property_name === this.state.portfolio.property_name);
            if (savedproperty.length != 0) {
                console.log("handleAddProperty: returning null")
                return null;
            }
        }
        // this.setState({addingProperty: false})
        this.setState({creating: true})
        const folio_property = this.state.portfolio;
        console.log("handleAddProperty: f = ", f)

        createFolioProperty(folio_property, this.state.portfolio_name).then((pfolio) => {
            this.setState({addingProperty: false, created: true});
            this.setState({portfolio:pfolio, selected:pfolio.id});
            // this.loadPortfolioList();
        })
        .catch((e)=> {
            const error = e.response.data;
            this.setState({created: false, error: error});
        })
        .finally(() => {
            this.loadPortfolioList();
            this.setState({creating: false, portfolio: defaultPortfolio});
        })
    }

    handleSaveProperty = () => {
        const portfolio = {};
        this.setState({saving: true});
        portfolio.folio_property = this.state.portfolio;
        console.log("handleSaveProperty: portfolio = ", portfolio)

        return updateFolioProperty(this.state.selected, portfolio)
            .then(() => {
                this.setState({success: true});
            })
            .catch(() => this.setState({success: false}))
            .finally(() => this.setState({loading: false}))
    }

    loadPortfolioList = async() => {
        this.setState({loading: true});
        getFolioProperties().then((savedPortfolioList) => {
            this.setState({savedPortfolioList})
            // this.setState({portfolio:savedPortfolioList[0], selected:savedPortfolioList[0]})
        })
        .finally(() => {
            this.setState({loading: false})
        })
    }

    getProperty = async (id) => {
        const portfolio = await getFolioProperty(id);
        console.log("getProperty: portfolio = ", portfolio)
        this.setState({editingProperty: true, portfolio:portfolio.folio_property, selected:id});
    }
    handleDeleteProperty = async() => {
        deleteFolioProperty(this.state.selected).then(() => {
            this.loadPortfolioList();
        })
        .catch((e) => {
            this.setState({error: e.response.data});
        })
    }
    render() {
        const options = this.state.options;
        if (!options) {
            return null;
        }
        // console.log("PortfolioManager: render: portfolio = ", this.state.portfolio)
        const { portfolio_name, savedPortfolioList } = this.state;
        // console.log("PortfolioManager: render: savedPortfolioList = ", savedPortfolioList)

        const columns = [{
            dataField: 'id',
            text: 'Property ID',
            hidden: true
          }, {
            dataField: 'folio_property.property_name',
            text: 'Property Name'
          }, {
            dataField: 'folio_property.address',
            text: 'Address'
          }, {
            dataField: 'folio_property.mp_style',
            formatter: (cell, row) => {
                return this.typeStyleMatches[cell]
            },
            text: 'Type'
          }, {
            dataField: 'folio_property.bedrooms',
            text: 'Bedrooms'
          }, {
            dataField: 'folio_property.bathrooms',
            text: 'Bathrooms'
        }, {
            dataField: 'folio_property.sqft',
            text: 'SqFt'
          },
        ];
          
        const selectRow = {
            mode: 'radio',
            clickToSelect: true,
            bgColor: '#00BFFF',
            cursor: 'pointer'
        };

        const rowEvents = {
            onClick: (e, row, rowIndex) => {
                this.getProperty(row.id);
            }
        };

        // return <Loader show={this.state.loading} message={'loading'}><div>
        return <div>

            <CardBody>
            <FormGroup>
                <Row>
                    <Label sm={2} md={2}>Portfolio Name</Label>
                        <Col sm={2} md={6}>
                            <Input id="portfolio_name" type="text" placeholder="Portfolio Name" value={this.state.portfolio_name || ''} onChange={e => this.setState({ portfolio_name: e.target.value })} />
                    </Col>
                </Row>
            </FormGroup>
                {
                    savedPortfolioList && 
                        <BootstrapTable
                            keyField='id'
                            bootstrap4={true}
                            condensed={true}
                            striped
                            data={ savedPortfolioList }
                            columns={ columns }
                            selectRow={ selectRow }
                            rowEvents={ rowEvents }
                            />
                    }
            </CardBody>        

            <CreatePropertyForm pfolio={this.state.portfolio} onPortfolioChange={this.handlePortfolioChange} onAction={this.handleAction} options={options}/>

            {this.state.created &&
                <h6>Created property successfully</h6>
            }

        </div>
    }

    typeStyleMatches = {
        1:'Single Family Residence',
		2:'Town House',
		3:'Condo',
		7:'Multi-Family',
		4:'Manufactured Home',
		10:'Co-Op'
    }
}

export default PortfolioManager;
