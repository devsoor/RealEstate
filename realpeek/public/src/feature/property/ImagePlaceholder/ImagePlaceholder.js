import React from "react";
import {Image} from "react-bootstrap";

import img from './NoImagesAvailable.png';

export const ImagePlaceholder = (props) => {
    return <img src={img} alt="No image available" {...props} />
}
