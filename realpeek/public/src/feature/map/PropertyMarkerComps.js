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

class PropertyInfoWindow extends Component {
    render() {
        let property = this.props.result;
        // let cma = this.props.result.cma ? this.props.result.cma.cma.cma_results : null;
        let thumbnail = "";
        return <div>
            <div  className="info-window">
                <div>    
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
                                        {/* <Link to={'/property/' + property.unique_id} target="_blank"> */}
                                            {property.address}
                                        {/* </Link> */}
                                    </span>
                                    {/* <span className="item-address-city">{property.city}, {property.state}</span> */}
                                </div>
                            </div>
                            <div  className="table-list full-width info-row">
                                <div  className="cell">
                                    <div  className="info-row amenities">
                                        <div>
                                            <span className="h-beds">Beds: <FixedNumber value={property.bed} decimals={2} /></span>
                                            <span className="h-baths">Baths: <FixedNumber value={property.bath} decimals={2} /></span>
                                        </div>
                                        <div>
                                            <span  className="h-area">Sq Ft: <FixedNumber value={property.sqft}/> </span>
                                        </div>
                                    </div>
                                    <div className="info-row amenities">
                                        <div  className="label-wrap">
                                            <span  className="label-status label-status-COND label label-default">{property.mp_style_name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                      {/*       {
                                cma &&
                                <div className="info-row">
                                    <p>Cash flow: <Currency value={cma.Result_CashFlow} /></p>
                                    <p>Cap Rate: <Percent value={cma.Result_CapRate} decimals={2} /></p>
                                    <p>Rent to Value: <Percent value={cma.Result_RentValueRatio} decimals={2} /></p>
                                </div>
                            } */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }

}
class PropertyMarkerComps extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isMouseOnInfoWindow: false
        };
        this.handleToggleOpen = this.handleToggleOpen.bind(this);
        this.handleToggleClose = this.handleToggleClose.bind(this);
        this.handleMouseOverInfo = this.handleMouseOverInfo.bind(this);
        this.handleMouseOutInfo = this.handleMouseOutInfo.bind(this);
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
        let property = this.props.result;
        let subjectProperty = this.props.subjectProperty;

        const markerIcon = {...icon};
        const markerIconSubject = {...icon};

        markerIconSubject.fillColor = "#E32831";
        markerIcon.fillColor = "green";

        let isOpen = this.props.isSelected;

        return <div>
            <Marker icon={markerIconSubject} position={{ lat: subjectProperty.lat, lng: subjectProperty.lon }}/>
            <Marker icon={markerIcon} position={{ lat: property.lat, lng: property.lon }} onClick={this.handleToggleOpen}
                onMouseOver={this.handleToggleOpen} onMouseOut={this.handleToggleClose}
                >
                    {
                        isOpen &&
                        <InfoWindow onCloseClick={this.handleToggleClose } defaultOptions={{ disableAutoPan: true,  }}>
                        <div onMouseOver={this.handleMouseOverInfo} onMouseOut={this.handleMouseOutInfo}>
                            
                            <PropertyInfoWindow result={property}></PropertyInfoWindow>
                            </div>
                        </InfoWindow>
                    }
            </Marker>
        </div>
    }
}

export default PropertyMarkerComps