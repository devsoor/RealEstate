import React, {Component} from "react"
import Header from "./header/Header";
import Footer from "./Footer/Footer";
import Fulllayout from './fulllayout.jsx.js';
import Blanklayout from './blanklayout.jsx.js';

export const MasterPage = (props) => {
    return <div>
        <Blanklayout {...props}/>
    </div>
}

export const DashboardPage = (props) => {
    return <div>
        <Fulllayout {...props}/>
    </div>
}


export const withMaster = function(ChildComponent, childProps, theme, isFullScreen) {
    class PageWithMaster extends Component {
        render() {
            return <MasterPage isFullScreen={isFullScreen} theme={theme} {...childProps} {...this.props}><ChildComponent {...this.props} {...childProps} /></MasterPage>
        }
    }

    return PageWithMaster;
}

export const withDashboard = function(ChildComponent, childProps, theme, isFullScreen) {
    class PageWithDashboard extends Component {
        render() {
            return <DashboardPage isFullScreen={isFullScreen} theme={theme} {...childProps} {...this.props}><ChildComponent {...this.props} {...childProps} /></DashboardPage>
        }
    }

    return PageWithDashboard;
}