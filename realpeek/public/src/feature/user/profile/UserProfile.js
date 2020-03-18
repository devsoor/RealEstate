import React, {Component} from "react"
import {Row, Col} from "reactstrap"
import ViewProfile from './ViewProfile';
import EditProfile from './EditProfile';

class UserProfile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: false
        }
    }
    render() {
        let profile = this.props.profile;

        if (this.state.editing) {
            return <EditProfile profile={profile} onSave={this.props.onSave} />
        }
        else {
            return <ViewProfile profile={profile} />
        }
    }
}


export default UserProfile;
