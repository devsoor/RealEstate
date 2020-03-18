import React, { Component } from 'react';

import {
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Dropdown,
    UncontrolledDropdown,
    Label
  } from 'reactstrap';
import {Link} from 'react-router-dom'
import {createReport} from '../../api/PropertyApi';
import SaveResultsDialog from './SaveResultsDialog';
import SaveSearchDialog from '../saved-searches/SaveSearchDialog';

class SaveResults extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showSaveResultsDialog: false,
            // showSaveSearchDialog: false,
            success: null,
            saveMode: ''
        }

    }

    openSaveDialog = (mode) => {
        this.setState({showSaveResultsDialog: true, saveMode: mode});
    }
    
/*     openSaveSearchDialog = () => {
        this.setState({showSaveSearchDialog: true});
    }
 */
    closeDialog = () => {
        this.setState({showSaveResultsDialog: false, showSaveSearchDialog: false, saveMode: null});
    }

    handleSaveResults = (reportName) => {
        return this.props.onSaveResults(reportName, this.state.saveMode);
    }

    handleSaveSearch = (savedSearchSettings) => {
        return this.props.onSaveSearch(savedSearchSettings);
    }


    render() {
        return (
            <div>
                <SaveResultsDialog 
                    show={this.state.showSaveResultsDialog} 
                    onClose={this.closeDialog}
                    saveMode={this.state.saveMode}
                    onConfirm={this.handleSaveResults} 
                />
{/*                 <SaveSearchDialog
                    show={this.state.showSaveSearchDialog}
                    onClose={this.closeDialog}
                    onConfirm={this.handleSaveSearch}
                /> */}

                <UncontrolledDropdown id="dropdown-save-results">
                    <DropdownToggle caret color="info">
                    <i className="mdi mdi-content-save-all"></i> Save Results
                    </DropdownToggle>  
                    <DropdownMenu>       
                    <DropdownItem  onClick={() => this.openSaveDialog("successful")} disabled={!this.props.totalSuccess}>Successful Results <Label>{this.props.totalSuccess}</Label></DropdownItem>
                    <DropdownItem  onClick={() => this.openSaveDialog("selected")} disabled={!this.props.totalSelected}>Selected Listings <Label>{this.props.totalSelected}</Label></DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem  onClick={() => this.openSaveDialog("all")} disabled={!this.props.resultsOnPage}>All Results on Page <Label>{this.props.resultsOnPage}</Label></DropdownItem>
{/*                     <DropdownItem divider />
                    <DropdownItem onClick={() => this.openSaveSearchDialog()} >Save Search</DropdownItem> */}
                </DropdownMenu>  
                </UncontrolledDropdown>  
            </div>
        )
    }
}

export default SaveResults;

