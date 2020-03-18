
import React from "react"
import {Col, FormGroup, Label} from "reactstrap"

export const FormField = (props) => {
    return <FormGroup id={props.controlId}>
        <Col componentClass={Label} sm={2}>
            {props.label}
        </Col>
        <Col sm={10}>
            {props.children}
        </Col>
    </FormGroup>
}