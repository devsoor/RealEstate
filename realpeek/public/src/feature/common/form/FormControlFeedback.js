import React from "react";
import "./FormControlFeedback.css"
import {HelpBlock } from "react-bootstrap";

const FormControlFeedback = (props) => {
    if (props.validationState) {
        return <HelpBlock bsClass='feedback'>{props.children}</HelpBlock>
    }
    else {
        return null;
    }
}

export default FormControlFeedback
