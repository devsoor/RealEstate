import React, { Component }  from "react";
import {CardBody, CardTitle, Alert} from "reactstrap";
import {Authorization} from "../auth/Authorization/Can";
import EditAssumptions from "../cmaAssumptions/EditAssumptions";
import {getDefaultAssumptions, updateDefaultAssumptions} from '../../api/PropertyApi';

class PlatformAssumptions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            assumptions: null
        }
    }
    componentWillMount() {
        getDefaultAssumptions().then((assumptions) => {
            this.setState({assumptions: assumptions.parameters});
        })
    }

    
    handleAssumptionsChanged = (assumptions) => {
        updateDefaultAssumptions(assumptions).then(() => {
            this.setState({assumptions});
        })
    }

    render() {
        return <div>
        <CardBody><CardTitle>RealPeek Platform Settings</CardTitle></CardBody>
        <Alert color="warning"><strong>Edit default settings for the RealPeek platform.</strong>  
        These settings don't override values that agents have set on their account.</Alert>
        <EditAssumptions assumptions={this.state.assumptions} onAssumptionsChange={this.handleAssumptionsChanged} type="global" />
        </div>
    }
}

export default Authorization(PlatformAssumptions, "update", "platformassumptions")