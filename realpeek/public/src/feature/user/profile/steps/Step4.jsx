import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Form, FormGroup, Input, Label } from 'reactstrap';
import {withSettings} from "../../../../api/SettingsProvider"
class Step4 extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'savedToCloud': props.getStore().savedToCloud,
			'criteria': props.getStore().criteria,
			'tolerance': props.getStore().tolerance
		};
	}

	render() {
		return (
			<div className="step step4 mt-5">
				<div className="row justify-content-md-center">
					<div className="col-lg-8">
						<Form id="Form" className="form-horizontal">
						<div className="form-group content form-block-holder">
									<FormGroup>
										<Label className="control-label">What investment criteria is important to make your decision?</Label>
										<Input id="criteria"
											required
											type="select" 
											ref={(c) => { this.criteria = c; }}
											defaultValue={this.state.criteria}>
												<option>Positive Cash Flow</option>
												<option>Cap Rate</option>
												<option>Rent to value ratio</option>
												<option>I'm open to anything that fits my budget</option>
											</Input>
									</FormGroup>
							</div>
							<div className="form-group content form-block-holder">
									<FormGroup>
										<Label className="control-label">Are you willing to explore properties a little outside your criteria?</Label>
										<Input id="tolerance"
											required
											type="select" 
											ref={(p) => { this.tolerance = p; }}
											defaultValue={this.state.tolerance}>
												<option>Yes</option>
												<option>No</option>
											</Input>
									</FormGroup>
							</div>
							<div className="form-group">
								<label className="col-md-12 control-label">
									{
										(this.state.savedToCloud)
											? <div>
												<h1>Thanks!</h1>
												<h2>Data was successfully saved to cloud...</h2>
											</div>
											: <div>
												<h1>Thanks</h1>
												<h2>Data was successfully saved to cloud...</h2>
												<span className="btn btn-info text-white" onClick={() => {
													this.props.jumpToStep(4);
												}}>Save</span>
											</div>

									}
								</label>
							</div>
						</Form>
					</div>
				</div>
			</div>
		);
	}
}

export default withSettings(Step4);
