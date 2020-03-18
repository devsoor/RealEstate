import React, { Component } from 'react';
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import {Link} from 'react-router-dom'
import SavedSearchForm from './SavedSearchForm';

class SaveSearchDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            savedSearch: {
                name: '',
                email_enabled: false,
                email_frequency: 'instantly',
            },
            success: null
        }
    }

    resetForm = () => {
        this.setState({savedSearch: {
            name: '',
            email_enabled: false,
            email_frequency: 'instantly',
        }})
    }
    handleClose = () => {
        this.setState({success: null, loading: false});
        this.resetForm();
        this.props.onClose();
    }

    handleSave = () => {
        return this.props.onConfirm(this.state.savedSearch).then((savedSearch) => {
            this.setState({loading: false, success: true, savedSearch: savedSearch});
        })
        .catch((err) => {
            this.setState({loading: false, success: false});
        });
    }

    render() {
        if (!this.props.show) {
            return null;
        }
        let body = null;
        if (this.state.success === null) {
            body = <SavedSearchForm value={this.state.savedSearch} onSave={this.handleSave} onCancel={this.handleClose} />
        }
        else {
            if (this.state.success === true) {
                body = <div>
                    <h1>Good job!</h1>
                    <div>
                        Your search was saved.  Visit "Saved Searches" under your account to view later.
                        <div>
                            <Link to={'/user/saved-searches'} target="_blank"><Button className="bg-success">Saved Searches</Button></Link>
                            <Button onClick={this.handleClose} color="info">Done</Button>
                        </div>
                    </div>
                </div>
            } 
            else {
                body = <div>Whoops, something went wrong!  Try saving again later.</div>
            }
        }
        return <Modal isOpen={this.props.show} onClosed={this.handleClose}>
                    <ModalHeader className="bg-info">
                            Save Search
                    </ModalHeader>
                    <ModalBody>
                        {body}
                    </ModalBody>
             </Modal>
    }
}

export default SaveSearchDialog