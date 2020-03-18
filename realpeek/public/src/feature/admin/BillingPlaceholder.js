import React, {Component} from "react"
import {Authorization} from "../auth/Authorization/Can";

class BillingPlaceholder extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return <div>Billing info (Placeholder) </div>
    }
}

export default Authorization(BillingPlaceholder, "edit", "billing")