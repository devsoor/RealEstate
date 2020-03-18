import React, { Component } from 'react';
import {
    Card,
    CardBody,
    CardTitle,
    Row,
    Col,
    Table,
    CardSubtitle,
    Button
} from 'reactstrap';
import Search from '../../../search/Search';

class RentDashboard extends Component {
	constructor(props) {
		super(props);
	}
	render() {
		return <Search {...this.props}></Search>
	}
}

export default RentDashboard;
