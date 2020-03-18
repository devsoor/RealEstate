import React, {PureComponent, Component} from 'react'
import { Marker, InfoWindow } from "react-google-maps"
import {Link } from "react-router-dom"

import {IMGPATH } from "../../api/PropertyApi"
import './propertymarker.css'
import { Currency, FixedNumber, Percent } from '../common/Format';

var icon = {
    path: "M27.648-41.399q0-3.816-2.7-6.516t-6.516-2.7-6.516 2.7-2.7 6.516 2.7 6.516 6.516 2.7 6.516-2.7 2.7-6.516zm9.216 0q0 3.924-1.188 6.444l-13.104 27.864q-.576 1.188-1.71 1.872t-2.43.684-2.43-.684-1.674-1.872l-13.14-27.864q-1.188-2.52-1.188-6.444 0-7.632 5.4-13.032t13.032-5.4 13.032 5.4 5.4 13.032z",
    fillColor: '#285F8F',
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 0.65
}

const normalizeBetweenTwoRanges = (val, minVal, maxVal, newMin, newMax) => {
    return newMin + (val - minVal) * (newMax - newMin) / (maxVal - minVal);
  };

class PropertyInfoWindow extends Component {
    render() {
        let property = this.props.result._source;
        let cma = this.props.result.cma ? this.props.result.cma.cma.cma_results : null;
        let thumbnail = "";
        if (property.image_count > 0) {
            thumbnail =  IMGPATH + property.images[0];
        }

        return <div>
            <div  className="info-window">
                <div>    
                    <div  className="figure-block item-map">
                        <figure  className="item-thumb item-image col-image">
                            <Link to={'/property/' + property.unique_id} target="_blank" className="hover-effect" tabIndex="0">
                                <div id="rp_prop_image"  className="single-property-img">
                                {<img  height="100" width="100" className="single-property-img" prop_type={property.property_type} mls_vendor="NWMLS" listing_number={property.listing_id} prefer_thumbnail="true" src={thumbnail}></img>}
                                </div>
                            </Link>
                        </figure>
                    </div>
                    <div  className="item-body">
                        <div  className="body-left">
                            <div className="info-row">
                                <div  className="price">
                                        <span className="item-price">
                                        <Currency value={property.price} />
                                        </span>
                                    </div>
                            </div>
                            <div  className="info-row">
                                <div className="item-address">
                                    <span className="item-address-street">
                                        <Link to={'/property/' + property.unique_id} target="_blank">
                                            {property.street_address}
                                        </Link>
                                    </span>
                                    <span className="item-address-city">{property.city}, {property.state}</span>
                                </div>
                            </div>
                            <div  className="table-list full-width info-row">
                                <div  className="cell">
                                    <div  className="info-row amenities">
                                        <div>
                                            <span className="h-beds">Beds: <FixedNumber value={property.bedrooms} decimals={2} /></span>
                                            <span className="h-baths">Baths: <FixedNumber value={property.bathrooms} decimals={2} /></span>
                                        </div>
                                        <div>
                                            <span  className="h-area">Sq Ft: <FixedNumber value={property.sqft}/> </span>
                                        </div>
                                    </div>
                                    <div className="info-row amenities">
                                        <div  className="label-wrap">
                                            <span  className="label-status label-status-COND label label-default">{property.property_type}</span>
                                            {property.listing_id}</div>
                                    </div>
                                </div>
                            </div>
                            {
                                cma &&
                                <div className="info-row">
                                    <p>Cash flow: <Currency value={cma.Result_CashFlow} /></p>
                                    <p>Cap Rate: <Percent value={cma.Result_CapRate} decimals={2} /></p>
                                    <p>Rent to Value: <Percent value={cma.Result_RentValueRatio} decimals={2} /></p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }

}
class PropertyMarker extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isMouseOnInfoWindow: false
        };
    }

    handleToggleOpen = () => {
        this.props.onSelect(this.props.result);
    }

    handleToggleClose = () => {
        setTimeout(() => {
            if (!this.state.isMouseOnInfoWindow) {
                this.props.onSelect(null);
            }
        }, 100);
        //this.props.onSelect(null);
    }

    handleMouseOverInfo = () => {
        this.setState({isMouseOnInfoWindow: true});
        this.handleToggleOpen();
    }
    handleMouseOutInfo = () =>{ 
        this.setState({isMouseOnInfoWindow: false});
        //this.props.onSelect(null);
    }
    render() {
        let result = this.props.result;

        let property = this.props.result._source;
        
        const markerIcon = {...icon};

        let cma = result.cma ? result.cma.cma.cma_results : null;
        if (cma) {
            const val = cma.criteria_value;
            // const a = normalizeBetweenTwoRanges(val, -Math.abs(this.props.limitValue), this.props.limitValue, 0, 120);
            const a = val > 0 ? normalizeBetweenTwoRanges(val, 0, this.props.maxValue, 60, 120) : val == 0 ? 0 : normalizeBetweenTwoRanges(val, this.props.minValue, 0, 0, 60);
            markerIcon.scale = normalizeBetweenTwoRanges(val, -Math.abs(this.props.limitValue), this.props.limitValue, 0.2, 1);
            markerIcon.fillColor = `hsl(${a},100%,30%,1)`
            // if (result.success === true) {
            //     markerIcon.fillColor = "green";
            // }
            // else if (result.success === false) {
            //     markerIcon.fillColor = "#E32831";
            // }
        }

        // if (result.success === true) {
        //     markerIcon.fillColor = "hsl(120,100%,30%,1)";
        // }
        // else if (result.success === false) {
        //     markerIcon.fillColor = "hsl(0,100%,30%,1)";
        // }
        let isOpen = this.props.isSelected;
        return <Marker icon={markerIcon} position={{ lat: property.lat, lng: property.long }} onClick={this.handleToggleOpen}
        onMouseOver={this.handleToggleOpen} onMouseOut={this.handleToggleClose}
        >
            {
                isOpen &&
                <InfoWindow onCloseClick={this.handleToggleClose } defaultOptions={{ disableAutoPan: true,  }}>
                <div onMouseOver={this.handleMouseOverInfo} onMouseOut={this.handleMouseOutInfo}>
                    
                    <PropertyInfoWindow result={result}></PropertyInfoWindow>
                    </div>
                </InfoWindow>
            }
        </Marker>
    }
}

export default PropertyMarker