import React, {Component} from "react"
import {AsyncTypeahead, Menu, MenuItem, Highlighter} from 'react-bootstrap-typeahead'; // ES2015
import 'react-bootstrap-typeahead/css/Typeahead.css';

import theme from './theme.css';
import {suggest} from '../../../api/PropertyApi';

function groupBy(objectArray, property) {
    return objectArray.reduce(function (acc, obj) {
      var key = obj[property];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
  }

class LocationSuggest extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            suggestions: []
        }
    }

    onSearch = (value) => {
        if (value && value.length >= 2) {
            this.setState({isLoading: true});
            suggest(value).then((fieldTypes) => {
                let list = [];
                fieldTypes.forEach((type)=>{
                    const slist = type.suggestions.map((s)=>{
                        s.typeTitle = type.title;
                        return s;
                    })
                    list = list.concat(slist);
                })

                this.setState({suggestions: list, isLoading: false});
            })
        }
    }

    onChange = (selected) => {
        this.props.onChange(this.props.id, selected);
    }

    _renderMenu(results, menuProps) {
        let idx = 0;
        const grouped = groupBy(results, "typeTitle");
        const items = Object.keys(grouped).sort().map((typeTitle) => {
          return [
            !!idx && <Menu.Divider key={typeTitle + '-divider'} />,
            <Menu.Header key={typeTitle + '-header'}>
              {typeTitle}
            </Menu.Header>,
                grouped[typeTitle].map((suggestion) => {
                const item =
                <MenuItem key={idx} option={suggestion} position={idx}>
                  <Highlighter search={menuProps.text}>
                    {suggestion.display || suggestion.value}
                  </Highlighter>
                </MenuItem>;
    
              idx++;
              return item;
            })
          ];
        });

        return <Menu {...menuProps}>{items}</Menu>;
    }

    render() {
        const isEmpty = !this.props.value || this.props.value.length == 0;
        return (
            <div className={isEmpty ? 'empty' : null}>
                <AsyncTypeahead
                    id='location-id'
                    multiple
                    placeholder={this.props.placeholder}
                    minLength={2}
                    autoFocus={true}
                    isLoading= {this.state.isLoading }
                    onSearch={this.onSearch }
                    onChange={this.onChange}
                    options={this.state.suggestions}
                    promptText={this.props.placeholder}
                    selected={this.props.value}
                    labelKey={(option)=>option.display || option.value}
                    renderMenu={this._renderMenu}
                />
            </div>
        )
    }

}

export default LocationSuggest;