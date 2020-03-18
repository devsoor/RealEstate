import React, {Component} from "react";
import {Link, withRouter} from 'react-router-dom';
import "./footer.css";

class Footer extends Component {
    render() {
    return <div className="copyright hidden-print">
            <div>
            <Link to="/dmca">DMCA Notice</Link>
            &nbsp; | &nbsp;
            <Link to="/privacy">Privacy Policy</Link>
            &nbsp; | &nbsp;
            <Link to="/tos">Terms and Conditions</Link>
             &nbsp; | &nbsp; 
            <a>© {new Date().getFullYear()} RealPeek &trade; &#8480;, Inc.</a>
            </div>
            {this.props.isAuthenticated &&
            
            <div>
                <Link to="/disclaimer">Disclaimer</Link>
            </div>
            }
        </div>
    }
}
export default withRouter(Footer);