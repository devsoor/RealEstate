import React, {Component} from "react";
import { Row, Col, FormGroup, Input, InputGroup, InputGroupAddon } from 'reactstrap';

import "./property.css"

class CmaFormControl extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isChanged: false
        }
    }

    formatValue = (value) => {
        let props = this.props;
        if (value && isNaN(value)) {
            return 0;
        }
        // get rid of commas so we can parse it correctly.  note this is for US currency only; need a different solution for different currencies
        if (value && !isNaN(value)) {
            if (props.type === "currency") {
                let digits = props.decimals || 0;
                value = (Number(value) ).toLocaleString('en-US', { 
                    style: 'decimal', 
                    maximumFractionDigits : digits, 
                    minimumFractionDigits : digits });
            }
            if (props.type === "percent") {
                let digits = props.decimals || 2;
                value = props.readOnly ? value*100 : value;
                value = (Number(value) ).toLocaleString('en-US', { 
                    style: 'decimal', 
                    maximumFractionDigits : digits, 
                    minimumFractionDigits : digits });
            }
        }
        return value;
    }
    onValueChange = (event) => {
        let value = event.target.value;
        value = value.toString().replace(/,/g, "");
        this.setState({isChanged: true});
        this.props.onChange({id: event.target.id, value: value});
    }
    renderInputGroup(type, name, id, value, period, readOnly) {
        return <InputGroup>
            {
                type === "currency" && 
                <InputGroupAddon addonType="prepend">$</InputGroupAddon>
            }
            <Input type="text" placeholder={name} id={id} value={value} readOnly={readOnly} onChange={this.onValueChange} />
            {
                type === "percent" &&
                <InputGroupAddon addonType="append">%</InputGroupAddon>
            }
            {
                period &&
                <InputGroupAddon addonType="append">{period === "monthly" ? "/mo" : "/yr"}</InputGroupAddon>
            }
        </InputGroup>
    }
    render() {
        let value = this.props.value;
        if (!this.state.isChanged) {
            value = this.formatValue(this.props.value);
        }
        const currentValue = this.formatValue(this.props.current);

        const hasCurrentValue = currentValue != undefined;
        const props = this.props;


        return <FormGroup>
            <Row>
                <Col sm={4}>
                    <div className={this.props.isSubItem ? "sub-item" : null}>
                    {props.name}
                    </div>
                </Col>
                {
                    hasCurrentValue && 
                    <Col sm={4}>
                    {
                        this.renderInputGroup(props.type, props.name, props.id, currentValue, props.period, true)
                    }
                    </Col>
                }
                <Col sm={hasCurrentValue ? 4 : 8}>
                    {
                        this.renderInputGroup(props.type, props.name, props.id, value, props.period, props.readOnly)
                    }
                </Col>
            </Row>
        </FormGroup>
    }

}

export default CmaFormControl;