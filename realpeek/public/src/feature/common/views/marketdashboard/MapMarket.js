import React, { Component } from 'react';
import { Row, Col, Card, CardBody, ButtonGroup, Button} from 'reactstrap';
import { compose, withProps } from "recompose"
import { withScriptjs, withGoogleMap, GoogleMap, Marker, InfoWindow, Circle } from "react-google-maps"
import PropertyMarketMarker from './PropertyMarketMarker';
import HeatmapLayer from 'react-google-maps/lib/components/visualization/HeatmapLayer';
/*global google*/

//const googleApiKey = 'AIzaSyAwtYJhBWHqxiV27OgdXUyr2KklYVTsulQ'; // prod key
// const googleApiKey = 'AIzaSyBT6koyESZ1xjk7XJKcUdEa7AKgTwfAa3g'; // dev key
const googleApiKey = process.env.REACT_APP_GOOGLE_API;

class Map extends Component {
    constructor(props) {
        super(props);
        this.state = {
            center: { lat: 122.3321, lng: 47.6062 }
        }
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
            let result = this.props.results[0]._source;
            await this.setState({center:{ lat: result.lat, lng: result.long} });

            const bounds = new window.google.maps.LatLngBounds();
            
            this.props.results.forEach((r) => {
                bounds.extend(new window.google.maps.LatLng (r._source.lat,r._source.long))
            })
            this.refs.map.fitBounds(bounds, {top:100, right:20, left:20, bottom:0});
        }
    }

    handleSelect = (selected) => {
        this.props.onMarkerSelected(selected)
    }

    getMapData = (results) => {
        const data = []

        Object.values(results).map((p) => {            
                data.push(new window.google.maps.LatLng({lat:p._source.lat, lng:p._source.long, weight: 0.5}))
        })
        return data;
    }
    
    render() {
        let results = this.props.results;
        let selectedId = this.props.selected ? this.props.selected._id : null;

        let radiusInMeters = 3000; 
        if (this.props.radius) {
            // convert miles to meters
            radiusInMeters = Number(this.props.radius) * 1609.344;
        }

        const minValue = results && Math.min(...results.map(o => o.cma && o.cma.cma.cma_results.criteria_value))
        const maxValue = results && Math.max(...results.map(o => o.cma && o.cma.cma.cma_results.criteria_value))
        const limitValue = Math.max(Math.abs(minValue), Math.abs(maxValue))
        return <div>
                <GoogleMap
                    ref='map'
                    defaultZoom={8}
                    defaultCenter={this.state.center}
                    center={this.state.center}
                    onClick={this.handleSelect}
                >
                {
                    results.map(result=> {
                                return <PropertyMarketMarker key={result._id} result={result} isSelected={selectedId==result._id} onSelect={this.handleSelect}
                                    limitValue={limitValue} minValue={minValue} maxValue={maxValue} />
                    })
                }
                </GoogleMap>
        </div>
    }
}
export const MapMarketContainer = compose(
    withProps({
      googleMapURL: `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&v=3.exp&libraries=visualization,geometry,drawing,places`,
      loadingElement: <div style={{ height: `100%` }} />,
      containerElement: <div style={{ height: '85vh', position: "relative", top:0, bottom:0 }} />,
      mapElement: <div style={{ height: `100%` }} />,
    }),
    withScriptjs,
    withGoogleMap
  )(Map)