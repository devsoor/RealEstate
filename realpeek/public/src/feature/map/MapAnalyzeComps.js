import React, { Component } from 'react';
import { compose, withProps } from "recompose"
import { withScriptjs, withGoogleMap, GoogleMap, Marker, InfoWindow, Circle } from "react-google-maps"
import PropertyMarkerComps from './PropertyMarkerComps';

//const googleApiKey = 'AIzaSyAwtYJhBWHqxiV27OgdXUyr2KklYVTsulQ'; // prod key
// const googleApiKey = 'AIzaSyBT6koyESZ1xjk7XJKcUdEa7AKgTwfAa3g'; // dev key
const googleApiKey = process.env.REACT_APP_GOOGLE_API;



class MapComps extends Component {
    constructor(props) {
        super(props);
        this.state = {
            center: { lat: 122.3321, lng: 47.6062 }
        }
        this.handleSelect = this.handleSelect.bind(this);
    }
    componentDidMount() {
        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const coords = pos.coords;
                this.setState({
                    center: {
                        lat: coords.latitude,
                        lng: coords.longitude
                    }
                })
            })
        }
        this.zoomMapToFit();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.results != this.props.results) {
            this.zoomMapToFit();
        }
    }

    zoomMapToFit = async () => {
        if (this.props.results && this.props.results.length > 0) {
            let subjectProperty = this.props.subjectProperty;
            await this.setState({center:{ lat: subjectProperty.lat, lng: subjectProperty.lon} });
            const subjectBounds = new window.google.maps.LatLngBounds();
            subjectBounds.extend(new window.google.maps.LatLng (subjectProperty.lat,subjectProperty.lon));
            this.refs.map.fitBounds(subjectBounds);

            const bounds = new window.google.maps.LatLngBounds();
            
            this.props.results.forEach((r) => {
                bounds.extend(new window.google.maps.LatLng (r.lat,r.lon))
            })
            this.refs.map.fitBounds(bounds, {top:100, right:20, left:20, bottom:0});
        }
    }

    handleSelect = (selected) => {
        this.props.onMarkerSelected(selected)
    }

    render() {
        let results = this.props.results;
        let selectedId = this.props.selected;

        let radiusInMeters = 3000; 
        if (this.props.radius) {
            // convert miles to meters
            radiusInMeters = Number(this.props.radius) * 1609.344;
        }
        return <GoogleMap
            ref='map'
            defaultZoom={8}
            defaultCenter={this.state.center}
            resetBoundsOnResize={true}
            center={this.state.center}
            onClick={this.handleSelect}
            >
              {
                results && 
                results.map(result=> {
                    return <PropertyMarkerComps key={result.ln} subjectProperty={this.props.subjectProperty} result={result} isSelected={selectedId==result} onSelect={this.handleSelect}/>
                })
                
            }
            {/* {
                showRadius &&
                <Circle center={this.state.center} radius={radiusInMeters} />
            } */}
        
        </GoogleMap>
    }
}
export const MapContainerComps = compose(
    withProps({
      googleMapURL: `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&v=3.exp&libraries=geometry,drawing,places`,
      //googleMapURL: `https://maps.googleapis.com/maps/api/js?&v=3.exp&libraries=geometry,drawing,places`,
      loadingElement: <div style={{ height: `100%` }} />,
      containerElement: <div style={{ height: '85vh', position: "relative", top:0, bottom:0 }} />,
      mapElement: <div style={{ height: `60%`}} />,
    }),
    withScriptjs,
    withGoogleMap
  )(MapComps)