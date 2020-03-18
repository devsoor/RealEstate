import React, {Component} from "react";

import {Row, Col, Button, ButtonGroup} from "reactstrap"
import { RadioGroup, RadioButton } from 'react-radio-buttons';

export class ToggleLinkGroup extends Component {
    constructor(props) {
        super(props);
    }

    handleChange = (value) => {
        const event = {
            target: {
                id: this.props.id,
                value: value
            }
        }
        this.props.onChange(event);
    }

    render() {
        return <RadioGroup id={this.props.id} name={this.props.id} value={this.props.value} onChange={this.handleChange}  horizontal>
        <RadioButton value="include" rootColor="grey"  iconSize={20} padding={8}>
          Include
        </RadioButton>
        <RadioButton value="only" rootColor="grey" iconSize={20} padding={8}>
          Only
        </RadioButton>
        <RadioButton value="exclude" rootColor="grey" iconSize={20} padding={8}>
          Exclude
        </RadioButton>
      </RadioGroup>
    }
}