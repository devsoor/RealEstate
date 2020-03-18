import React, { Component } from 'react';
import SavedSearchForm from './SavedSearchForm';
import { CardTitle, BreadcrumbItem } from 'reactstrap';
import { getSavedSearch, updateSavedSearch } from "../../api/PropertyApi";
// import {BreadcrumbsItem} from "react-breadcrumbs-dynamic";

class EditSavedSearch extends Component {
    constructor(props) {
        super(props);

        this.state = {
            savedSearch: null,
            loading: false,
            success: null
        }
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        getSavedSearch(id).then((savedSearch) => {
            this.setState({savedSearch: savedSearch})
        })
    }

    handleSave = (savedSearchUpdate) => {
        this.setState({loading: true});
        return updateSavedSearch(this.state.savedSearch.id, savedSearchUpdate)
            .then(() => {
                this.setState({success: true});
                this.props.history.push('/user/saved-searches');
            })
            .catch(() => this.setState({success: false}))
            .finally(() => this.setState({loading: false}))
    }

    handleCancel = () => {
        this.props.history.push('/user/saved-searches');
    }
    render() {
        if (!this.state.savedSearch) {
            return null;
        }
        return <div>
            <CardTitle className="bg-info border-bottom p-3 mb-4 h3 text-white">{this.state.savedSearch.name}</CardTitle>

            <BreadcrumbItem to={this.props.match.url}>{this.state.savedSearch.name}</BreadcrumbItem>
            {
                this.state.success === null &&
                <SavedSearchForm value={this.state.savedSearch} onSave={this.handleSave} onCancel={this.handleCancel} loading={this.state.loading} />
            }
            {
                this.state.success &&
                <div>Settings updated successfully</div>
            }
            {
                this.state.success === false &&
                <div>Whoops! An error occurred.  Please try again later.</div>
            }
            </div>
    }
}

export default EditSavedSearch