import React, { Component } from 'react';
import {
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Dropdown,
    UncontrolledDropdown,
    UncontrolledButtonDropdown,
    Label
  } from 'reactstrap';
class FilterResults extends Component {
    handleFilterClicked = (filterMode) => {
        return this.props.onFilterResults(filterMode);
    }

    render() {
        return (
            <div>

                <UncontrolledDropdown id="filter-button">
                    <DropdownToggle caret color="info" >
                        <i className="mdi mdi-filter"></i>  Filter By
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem onClick={() => this.handleFilterClicked("successful")} disabled={!this.props.totalSuccess}>Successful Results <Label>{this.props.totalSuccess}</Label></DropdownItem>
                        <DropdownItem onClick={() => this.handleFilterClicked("selected")} disabled={!this.props.totalSelected}>Selected Listings <Label>{this.props.totalSelected}</Label></DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem onClick={() => this.handleFilterClicked("all")}>Show All Results</DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown> 
            </div>
        )
    }
}

export default FilterResults;
