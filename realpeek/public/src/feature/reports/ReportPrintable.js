import React, {Component} from "react"
import { getReport } from "../../api/PropertyApi"
import MultiPropertyReport from "./MultiPropertyReport";

class ReportPrintable extends Component {

    constructor(props) {
        super(props);
        this.state = {
            report: null
        }
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        
        getReport(id).then((report) => {this.setState({report})})
    }

    render() {
        let report = this.state.report;

        return <MultiPropertyReport report={report} print={true}/>
    }
}

export default ReportPrintable