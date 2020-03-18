import React, { Component } from 'react';
import { Row, Col, Label, Button, FormGroup, Input, CardBody } from 'reactstrap';

import {Link} from 'react-router-dom'

class SavedSearchForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: this.props.value
        }
    }

    handleClose = () => {
        this.setState({value: ''});
        this.props.onCancel();
    }

    componentDidUpdate(prevProps) {
        if (this.props.value !== prevProps.value) {
            this.setState({value: this.props.value});
        }
    }
    handleValueChange = (name, value) => {
        this.setState((prevState, props) => {
            const newVal = prevState.value;
            newVal[name] = value;
            return {value: newVal}
        });
    }
    handleChange = (e) =>{
        this.handleValueChange(e.target.id, e.target.value);
        
    }

    handleCheckboxChange = (e) => {
        this.handleValueChange(e.target.id, e.target.checked);
        if (e.target.checked) {
            this.handleValueChange("email_frequency", "instantly");
        }
    }

    handleSave = (event) => {
        event.preventDefault();

        let savedSearchSettings = {
            name: this.state.value.name,
            email_enabled: this.state.value.email_enabled,
            email_frequency: this.state.value.email_frequency,
            email_day_of_week: this.state.value.email_day_of_week
        }
        this.props.onSave(savedSearchSettings).then((value) => {
            this.setState({value: value});
        })
    }

    render() {
        if (this.props.loading) {
            return <div>Saving ... </div>
        }

        const savedSearch = this.state.value;
        if (!savedSearch) {
            return null;
        }

        return <form onSubmit={this.handleSave}>
            <FormGroup >
                <Label>Name Your Search</Label>
                <Input id="name" type="text"
                    value={savedSearch.name}
                    placeholder="Search Name"
                    onChange={this.handleChange} />
            </FormGroup>
            <Row>
                <Col xs={12} md={12} >
                    <CardBody>
                        <FormGroup check id="email_enabled">
                            <Label check>
                                <Input addon type="checkbox" id="email_enabled" value={savedSearch.email_enabled} checked={savedSearch.email_enabled} onChange={this.handleCheckboxChange}/>&nbsp;
                                Email Me
                            </Label>
                        </FormGroup>
                    </CardBody>
                </Col>
                {
                    savedSearch.email_enabled &&
                    <Col xs={6} className="float-left">
                        <FormGroup>
                            <Label>Email Frequency</Label>
                            <Input id="email_frequency" type="select" placeholder="select" value={savedSearch.email_frequency.toLowerCase()} onChange={this.handleChange}>
                                <option value="instantly">INSTANTLY</option>
                                <option value="daily">DAILY</option>
                                <option value="weekly">WEEKLY</option>
                            </Input>
                        </FormGroup>
                    </Col>
                }
                {
                    savedSearch.email_frequency.toLowerCase() === "weekly" &&
                    <Col xs={6}>
                        <FormGroup>
                            <Label>Day of Week</Label>
                            <Input id="email_day_of_week" type="select" placeholder="select" value={savedSearch.email_day_of_week} onChange={this.handleChange}>
                                <option value="1">Sunday</option>
                                <option value="2">Monday</option>
                                <option value="3">Tuesday</option>
                                <option value="4">Wednesday</option>
                                <option value="5">Thursday</option>
                                <option value="6">Friday</option>
                                <option value="7">Saturday</option>
                            </Input>
                        </FormGroup>
                    </Col>
                }
            </Row>
            <div>
                <Button type="submit" color="info">Save</Button>&nbsp;
                <Button onClick={this.handleClose} color="secondary">Cancel</Button>
            </div>
        </form>
    }
}

export default SavedSearchForm