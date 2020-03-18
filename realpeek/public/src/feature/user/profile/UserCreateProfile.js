import React, {Component} from "react"
import { Card, CardBody, CardTitle } from 'reactstrap';
import StepZilla from 'react-stepzilla';
import {withSettings} from "../../../api/SettingsProvider"
import {getSearchOptions} from '../../../api/PropertyApi';

import Step1 from './steps/Step1.jsx.js';
import Step2 from './steps/Step2.jsx.js';
import Step3 from './steps/Step3.jsx.js';
import Step4 from './steps/Step4.jsx.js';

class UserCreateProfile extends Component {
    constructor(props) {
		super(props);
		this.state = {};

		this.userProfileParmams = {
			'location': '',
			'price': '',
			'type': '',
			'bedrooms': '',
			'otherType': '',
			'interest': 0,
			'downpayment': 0,
			'propertyMgmt': 0,
			'criteria': '',
			'tolerance': '',
			'savedToCloud': false
		};
	}


	getStore() {
		return this.userProfileParmams;
	}

	updateStore(update) {
		this.sampleStore = {
			...this.userProfileParmams,
			...update
		};
	}
    render() {
        let firstName = this.props.firstName;
        let lastName = this.props.lastName;
		let email = this.props.email;

        const steps =
			[
				{
					'component': <Step1 getStore={() => (this.getStore())} updateStore={u => {
						this.updateStore(u);
					}} />,
					'name': 'Location'
				},
				{
					'component': <Step2 getStore={() => (this.getStore())} updateStore={u => {
						this.updateStore(u);
					}} />,
					'name': 'Property Type and Features'
				},
				{

					'component': <Step3 getStore={() => (this.getStore())} updateStore={u => {
						this.updateStore(u);
					}} />,
					'name': 'Financing'
				},
				{
					'component': <Step4 getStore={() => (this.getStore())} updateStore={u => {
						this.updateStore(u);
					}} />,
					'name': 'Success Criteria and Done'
				}
			];
            return (
                <Card>
                    <CardBody className="border-bottom">
                        <CardTitle className="mb-0"><i className="mdi mdi-border-right mr-2"></i>Set up your personal profile</CardTitle>
                    </CardBody>
                    <CardBody>
                        <div className="example">
                            <div className="step-progress">
                                <StepZilla
                                    steps={steps}
                                    nextTextOnFinalActionStep={'Next'}
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>
    
            );
    }
}

export default withSettings(UserCreateProfile);
