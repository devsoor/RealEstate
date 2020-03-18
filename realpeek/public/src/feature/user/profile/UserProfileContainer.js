import React, { Component } from 'react';
import Auth from 'aws-amplify';
import { getCurrentUser } from '../../../api/PropertyApi';
import UserProfile from './UserProfile';

class UserProfileContainer extends Component {
    //state = {loading: false}
    constructor(props) {
      super(props);
      this.state = {
        loading: false,
        profile: null
      }
    }

    async componentWillMount() {
        let profile = await getCurrentUser();
        this.setState({loading: false, profile})
    }

    render() {
      const {loading, profile } = this.state;
      if (!profile) {
        return null;
      }
      return <UserProfile profile={profile.attributes} />
    }
  }
  
  export default UserProfileContainer;