import React from "react";

export const Currency = (props) => {
    if (isNaN(props.value)) {
        return 0
    } else {
    return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: props.decimals || 0,
            maximumFractionDigits: props.decimals || 0
        }).format(props.value)
    }
}

export const FixedNumber = (props) => {
    return Number(props.value).toFixed(props.decimals || 0);
}

export const Percent = (props) => {
    let val = Number(props.value);
    if (props.format === "percent") {
        val = val/100;
    }
    return (val*100).toFixed(props.decimals || 0) + "%";
}

export const PercentDecimal = (props) => {
    let digits = props.decimals || 2;
    let value = Number(props.value);
    value = value*100;
    value = (Number(value) ).toLocaleString('en-US', { 
        style: 'decimal', 
        maximumFractionDigits : digits, 
        minimumFractionDigits : digits });
    return value;
}

export const FormattedValue = (props) => {
    const { type, ...other} = props;
    if (type === "currency") {
        return <Currency {...other} />
    }
    if (type === "percent") {
        return <Percent {...other} />
    }
    if (type === "number") {
        return <FixedNumber {...other} />
    }
    else {
        return props.value;
    }
}