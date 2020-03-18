import React, { Component }  from "react";

import EditAssumptions from "./EditAssumptions";
import {getAssumptions, updateAssumptions} from '../../api/PropertyApi';

class AssumptionsContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSaving: false,
            assumptions: null
        }
        this.closeAssumptions = this.closeAssumptions.bind(this);

    }
    componentWillMount() {
        getAssumptions().then((assumptions) => {
            this.setState({assumptions: assumptions.parameters});
        })
    }
    
    handleAssumptionsChanged = (assumptions) => {
        this.setState({isSaving: true});
        updateAssumptions(assumptions).then(() => {
            this.setState({assumptions});
        })
        .finally(() => {
            this.setState({isSaving: false});
        })
    }
    closeAssumptions() {
        this.setState({ isSaving: false });
      }
    render() {
        return <EditAssumptions assumptions={this.state.assumptions} onAssumptionsChange={this.handleAssumptionsChanged} onAssumptionsCancel={this.closeAssumptions}
            type={this.props.type || "user"} isSaving={this.state.isSaving} submitButtonText="Save"/>
    }
}

export default AssumptionsContainer;