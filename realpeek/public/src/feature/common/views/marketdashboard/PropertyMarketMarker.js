import React, {PureComponent, Component} from 'react'
import { Marker, InfoWindow } from "react-google-maps"
import {Link } from "react-router-dom"

import {IMGPATH } from "../../../../api/PropertyApi"
import '../../../map/propertymarker.css'
import { Currency, FixedNumber, Percent } from '../../Format';

var icon = {
    path: "M16 0c-5.523 0-10 4.477-10 10 0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zM16 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z",
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
                                        {property.property_type != "MULT" &&
                                            <div>
                                                <span className="h-beds">Beds: <FixedNumber value={property.bedrooms} decimals={2} /></span>
                                                <span className="h-baths">Baths: <FixedNumber value={property.bathrooms} decimals={2} /></span>
                                            </div>
                                        }
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
class PropertyMarketMarker extends PureComponent {
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
            markerIcon.fillColor = `hsl(${a},100%,30%,1)`;
        }
        // if (result.cma.cma.cma_results.criteria_value >= 0) {
        //     markerIcon.fillColor = "green";
        // }
        // else if (result.cma.cma.cma_results.criteria_value < 0) {
        //     markerIcon.fillColor = "#E32831";
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

export default PropertyMarketMarker