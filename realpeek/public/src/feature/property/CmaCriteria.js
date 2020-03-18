import React from "react";
import { Currency, Percent, Number } from '../common/Format';

export const CmaCriteria = (props) => {
    let value = props.value;
    let criteria_type = props.type;
    if (criteria_type == "cash_flow_criteria") {
        return <Currency value={value} decimals={0} />
    }
    if (criteria_type == "cap_rate_criteria" || criteria_type == "rent_to_value_criteria") {
        return <Percent value={value} decimals={2} />
    }

    return value;
}
