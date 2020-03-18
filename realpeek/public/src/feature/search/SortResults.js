import React, { Component } from 'react';
import { MenuItem, Glyphicon } from 'react-bootstrap';
import { Dropdown, DropdownMenu, DropdownItem, DropdownToggle, UncontrolledDropdown, Label, Button, ButtonGroup } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSortAmountDown, faSortAmountUp } from '@fortawesome/free-solid-svg-icons'

import "./Search.css"

const sortOptions = {
    cash_flow_criteria:"Cash Flow",
    cap_rate_criteria: "Cap Rate",
    rent_to_value_criteria: "Rent To Value",
    price: "Price",
    city: "City",
    zipcode: "Zipcode",
    bedrooms: "Bedrooms",
    sqft: "Square Feet",
    list_date: "Days on Market"
}
const SortMenuItem = (props) => {
    return <DropdownItem onClick={props.onClick} >
        <div><span style={{paddingRight:'10px'}}>{props.children} </span>
        {
            props.selected == props.value && 
            <FontAwesomeIcon icon="check" />
        }
        </div>
    </DropdownItem>
}

class SortDirToggle extends Component {
    render() {
        if (this.props.desc) {
            return <FontAwesomeIcon icon={faSortAmountDown} style={{border:0}} />
        }
        else {
            return <FontAwesomeIcon icon={faSortAmountUp}  style={{border:0}}/>
        }
    }
}

class SortResults extends Component {
    constructor(props) {
        super(props);
        this.state = {
            desc: true
        }
    }
    handleSortClicked = (sortMode) => {
        if (this.state.desc) {
            sortMode = "-" + sortMode;
        }
        return this.props.onSortResults(sortMode);
    }
    handleSortDirClicked = () => {
        this.setState({
            desc: !this.state.desc
        }, () => {
            // resort after changing order
            const sortValue = this.props.selected.replace('-', '');
            this.handleSortClicked(sortValue);
        });
    }

    render() {
        const criteriaValue = this.props.criteria.success_criteria;
        const criteriaName = sortOptions[criteriaValue];

        let sortValue = this.props.selected.replace('-', '');
        if (sortValue == "success_criteria") {
            sortValue = criteriaValue;
        }
        const sortName = sortOptions[sortValue];
        return (
            <div>
                Sort by  
                <ButtonGroup>
                    <Button outline style={{border:0}} onClick={this.handleSortDirClicked}>
                        <SortDirToggle desc={this.state.desc} />
                    </Button>
                    <UncontrolledDropdown id="sort-button">
                        <DropdownToggle outline caret style={{border:0}}>{sortName}</DropdownToggle>
                        <DropdownMenu>
                            <SortMenuItem onClick={() => this.handleSortClicked(criteriaValue)} selected={sortValue}>{criteriaName}</SortMenuItem>
                            <DropdownItem divider />
                            <SortMenuItem onClick={() => this.handleSortClicked("list_date")} selected={sortValue}>{sortOptions["list_date"]}</SortMenuItem>
                            <SortMenuItem onClick={() => this.handleSortClicked("price")} selected={sortValue}>{sortOptions["price"]}</SortMenuItem>
                            <SortMenuItem onClick={() => this.handleSortClicked("city")} selected={sortValue}>{sortOptions["city"]}</SortMenuItem>
                            <SortMenuItem onClick={() => this.handleSortClicked("zipcode")}  selected={sortValue}>{sortOptions["zipcode"]}</SortMenuItem>
                            <SortMenuItem onClick={() => this.handleSortClicked("bedrooms")} selected={sortValue}>{sortOptions["bedrooms"]}</SortMenuItem>
                            <SortMenuItem onClick={() => this.handleSortClicked("sqft")} selected={sortValue}>{sortOptions["sqft"]}</SortMenuItem>
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </ButtonGroup>
            </div>
        )
    }
}

export default SortResults;
