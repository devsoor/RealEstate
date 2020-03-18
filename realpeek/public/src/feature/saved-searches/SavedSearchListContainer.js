import React, {Component} from "react"
import SavedSearchList from "./SavedSearchList";
import { getSavedSearches, deleteSavedSearch } from "../../api/PropertyApi";

class SavedSearchListContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            savedSearches: null
        }
    }

    componentDidMount() {
        this.getSavedSearchList();
    }

    getSavedSearchList = () => {
        getSavedSearches().then((savedSearches) => {this.setState({savedSearches})})
    }

    handleDelete = (id) => {
        deleteSavedSearch(id).then(() => {
            this.getSavedSearchList();
        })
    }

    render() {
        if (!this.state.savedSearches) {
            return null;
        }
        return <SavedSearchList searches={this.state.savedSearches} onDelete={this.handleDelete} {...this.props} />
    }
}

export default SavedSearchListContainer