import React, {Component} from "react"
import MultiPropertyReport from "./MultiPropertyReport";
import { getReport } from "../../api/PropertyApi"
import {Button} from "react-bootstrap"
import {Link} from "react-router-dom"

class ReportContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            report: {}
        }
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        
        getReport(id).then((report) => {this.setState({report})})
    }
    render() {
        if (!this.state.report) {
            return null;
        }

        return <div>
            <Link to="/user/reports">
                <Button bsStyle="link">Back to reports</Button>
            </Link>
            <MultiPropertyReport report={this.state.report}></MultiPropertyReport>
        </div>
    }
}

export default ReportContainer