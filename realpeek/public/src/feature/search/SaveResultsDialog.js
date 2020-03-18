import React, { Component } from 'react';
import { Row, Col, Label, Button, FormGroup, Modal, ModalHeader, ModalBody, Input } from 'reactstrap';

import { LinkContainer } from "react-router-bootstrap";


const capitalize = (str) => {
    if (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

class SaveResultsDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            reportName: '',
            reportId: '',
            saving: false,
            success: null,
            error: null
        }
    }
    handleClose = () => {
        this.setState({success: null, reportName: '', reportId: '', saving: false});
        this.props.onClose();
    }

    handleChange = (e) => {
        let newState = {}
        newState[e.target.id] = e.target.value;
        this.setState(newState);
    }
    handleSave = (event) => {
        event.preventDefault();

        this.setState({saving: true});
        this.props.onConfirm(this.state.reportName).then((report) => {

            this.setState({saving: false, success: true, reportId: report.id});
        })
        .catch((err) => {
            const error = err.response.data.error;
            this.setState({saving: false, success: false, error: error});
        });
    }

    render() {
        if (!this.props.show) {
            return null;
        }

        let body = null;
        if (this.state.saving) {
            body = <div>Saving ... </div>
        }

        if (this.state.success === null) {
            body = <form onSubmit={this.handleSave}>
                <FormGroup >
                <Label>Name your result set</Label>
                <Input type="text" id="reportName"
                    value={this.state.reportName}
                    placeholder="Report Name"
                    onChange={this.handleChange} />
                </FormGroup>
                <div>
                    <Button type="submit" color="primary">Save</Button>
                    <Button onClick={this.handleClose} color="secondary">Cancel</Button>
                </div>
            </form>
        }
        else if (this.state.success === true) {
            body = <div>
                <h1>Good job!</h1>
                <div>
                    Your report was successfully saved.  Click "View Report" to see the report, or visit "My Reports" under your account to view later.
                    <div>
                        <LinkContainer to={'/user/reports/' + this.state.reportId} target="_blank"><Button color="primary">View Report</Button></LinkContainer>
                        <Button onClick={this.handleClose} color="secondary">Done</Button>
                    </div>
                </div>
                </div>
        } 
        else {
            if (this.state.error) {
                body = <div>{this.state.error}</div>
            }
            else {
                body = <div>
                Whoops, something went wrong!  Try saving again later.
                </div>
            }
        }

        return <Modal isOpen={this.props.show} onClosed={this.handleClose}>
            <ModalHeader>
                Save {capitalize(this.props.saveMode)} Results
            </ModalHeader>
            <ModalBody>
                {body}
            </ModalBody>
            </Modal>
    }
}

export default SaveResultsDialog