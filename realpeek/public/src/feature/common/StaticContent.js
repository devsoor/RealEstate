import React, {Component} from 'react';

function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)
  
    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

class StaticContent extends Component{
    constructor(props) {
        super(props);
        this.state = {
            htmlContent: null
        }
    }
    componentDidMount() {
        fetch(this.props.url)
        .then(response => response.arrayBuffer())
        .then((buf) => {
            const html = readArrayBufferAsText(buf);
            this.setState({htmlContent: html})
        })
    }

    render() {
        let html = this.state.htmlContent;
        if (html) {
            for(var prop in this.props) {
                const value = this.props[prop];
                var re = new RegExp('{{' + prop + '}}', 'g');
                html = html.replace(re, value);
            }
        }
        console.log(html);
        return <div dangerouslySetInnerHTML={ {__html: html} } />
    }
}

export default StaticContent;