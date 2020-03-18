import React, { Component } from 'react';
import PlacesAutocomplete, {geocodeByAddress, getLatLng} from 'react-places-autocomplete'

import './places.css';

const isObject = val => {
    return typeof val === 'object' && val !== null;
  };
  
const classnames = (...args) => {
    const classes = [];
    args.forEach(arg => {
        if (typeof arg === 'string') {
        classes.push(arg);
        } else if (isObject(arg)) {
        Object.keys(arg).forEach(key => {
            if (arg[key]) {
            classes.push(key);
            }
        });
        } else {
        throw new Error(
            '`classnames` only accepts string or object as arguments'
        );
        }
    });

    return classes.join(' ');
};

const service = new window.google.maps.places.PlacesService(document.createElement('div'));
class PlacesSuggest extends Component {
    constructor(props) {
        super(props);
        this.state = {
            address: ""
        }

        this.handleSelect = this.handleSelect.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleCloseClick = this.handleCloseClick.bind(this);
    }

    handleSelect = (address, placeId) => {
        var self = this;
        this.handleChange(address);

        var request = {
          placeId: placeId,
          fields: ['name', 'geometry', 'formatted_address', 'address_components']
        };
        
        service.getDetails(request, (place) => {
          let event = {
              target: {
                  id: self.props.id || 'address', 
                  value: {
                    address: place.formatted_address,
                    address_components: place.address_components,
                    location: place.geometry.location,
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                  }
              }
          }
          self.props.onChange(event);
        });
        // geocodeByAddress(address)
        //   .then(results => {
        //         getLatLng(results[0]).then(latLng => {
        //             let event = {
        //                 target: {
        //                     id: self.props.id || 'poi', 
        //                     value: latLng
        //                 }
        //             }
        //             self.props.onChange(event);
        //         })
        //   })
        //   .then(latLng => console.log('Success', latLng))
        //   .catch(error => console.error('Error', error))
    }

    handleChange = (address) => {
        this.setState({
          address,
          errorMessage: '',
        });
      };

    handleCloseClick = () => {
        this.setState({
            address: '',
        });
    };

    render() {
      const searchOptions = {
        types: ['address']        
      }

        return <PlacesAutocomplete
            value={this.state.address}
            onChange={this.handleChange}
            onSelect={this.handleSelect}
            searchOptions={searchOptions}
            >
            {({ getInputProps, suggestions, getSuggestionItemProps }) => (
                <div className="search-bar-container">
                <div className="search-input-container">
                  <input
                    {...getInputProps({
                      placeholder: 'Enter Address...',
                      className: 'places__search-input',
                    })}
                  />
                  {this.state.address.length > 0 && (
                    <button
                      className="places__clear-button"
                      onClick={this.handleCloseClick}
                    >
                      x
                    </button>
                  )}
                </div>
                {suggestions.length > 0 && (
                  <div className="places__autocomplete-container">
                    {suggestions.map(suggestion => {
                      const className = classnames('places__suggestion-item', {
                        'places__suggestion-item--active': suggestion.active,
                      });

                      return (
                        /* eslint-disable react/jsx-key */
                        <div
                          {...getSuggestionItemProps(suggestion, { className })}
                        >
                          <strong>
                            {suggestion.formattedSuggestion.mainText}
                          </strong>{' '}
                          <small>
                            {suggestion.formattedSuggestion.secondaryText}
                          </small>
                        </div>
                      );
                      /* eslint-enable react/jsx-key */
                    })}
                    <div className="places__dropdown-footer">
                      <div>
                        <img alt="Powered by Google"
                          src={require('./powered_by_google_default.png')}
                          className="places__dropdown-footer-image"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
        )}
        </PlacesAutocomplete>
    }
  }
  
export default PlacesSuggest;


