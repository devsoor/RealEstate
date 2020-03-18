import React, {Component} from "react"
import ReportList from "./ReportList";
import Loader from 'react-loader-advanced';
import { getReports, deleteReport, updateReport } from "../../api/PropertyApi";

class ReportListContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reports: null,
            loading: false
        }
    }

    componentDidMount() {
        this.loadReports();
    }

    loadReports = () => {
        this.setState({loading: true});
        getReports()
            .then((reports) => {this.setState({reports})})
            .finally(
                this.setState({loading: false})
            )
    }

    handleUpdate = (id, fieldName, newValue) => {
        const results = this.state.reports.map((report) => {
            if (report.id === id) {
                const newRow = { ...report };
                const oldValue = report[fieldName];
                if (oldValue != newValue) {
                    this.setState({loading: true});
                    newRow[fieldName] = newValue;
                    updateReport(id, fieldName, newValue);
                    return newRow;
                }
            }
            return report;
        });
        this.setState({reports: results, loading: false});
    }
    handleDelete = (id) => {
        this.setState({loading: true});
        return deleteReport(id).then((success)=> {
            this.loadReports();
        })
    }
    render() {
        if (!this.state.reports) {
            return null;
        }
        return <ReportList reports={this.state.reports} onDelete={this.handleDelete} onUpdate={this.handleUpdate} loading={ this.state.loading }  />
    }
}

export default ReportListContainer