import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Form, FormGroup, Input, Label } from 'reactstrap';
import {withSettings} from "../../../../api/SettingsProvider"
class Step3 extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'interest': props.getStore().interest,
			'downpayment': props.getStore().downpayment,
			'propertyMgmt': props.getStore().propertyMgmt
		  };	
	}

	render() {
		return (
			<div className="step step3 mt-5">
				<div className="row justify-content-md-center">
					<div className="col-lg-4">
						<Form>
						<div className="form-group content form-block-holder">
							<FormGroup>
								<Label className="control-label">How much down payment do you have?</Label>
								<Input id="downpayment"
									required
									type="select" 
									ref={(d) => { this.downpayment = d; }}
									defaultValue={this.state.downpayment}>
										<option>5%</option>
										<option>10%</option>
										<option>15%</option>
										<option>20%</option>
										<option>25%</option>
										<option>30%</option>
										<option>40%</option>
										<option>50%</option>
										<option>100% (all cash offer)</option>
									</Input>
							</FormGroup>
							</div>
							<div className="form-group content form-block-holder">
								<FormGroup>
									<Label>What is your mortgage interest rate?</Label>
									<Input id="interest" 
										type="number"
										placeholder="Interest rate" 
										ref={(i) => { this.interest = i; }}
										defaultValue={this.state.interest}
									/>
								</FormGroup>
								</div>
								<div className="form-group content form-block-holder">
									<FormGroup>
										<Label className="control-label">Will you be managing your own property?</Label>
										<Input id="propertyMgmt"
											required
											type="select" 
											ref={(p) => { this.propertyMgmt = p; }}
											defaultValue={this.state.propertyMgmt}>
												<option>Yes</option>
												<option>No</option>
											</Input>
									</FormGroup>
							</div>
						</Form>
					</div>
				</div>
			</div>
		)
	}
}

export default withSettings(Step3);
