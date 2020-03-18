import React, { PureComponent  } from 'react';
import { Auth } from "aws-amplify";
import { createCanBoundTo } from '@casl/react'
import { Can as CaslCan } from '@casl/react'
import { defineAbilitiesFor } from './Ability'

class Can extends PureComponent  {
    constructor(props) {
        super(props);
        this.state = {
            roles: [],
            allowed: false,
            ability: null
        }
    }

  async componentDidMount() {
    try {
      let session = await Auth.currentSession();
      
      if (session) {
          let roles = session.idToken.payload['cognito:groups'] || [];
          const ability = defineAbilitiesFor(session.idToken);
          this.setState({ability})
          // const isSysAdmin = roles.includes("administrators");
          // const isSiteAdmin = roles.includes("site_admin");
          // const action = this.props.action ? this.props.action.toLowerCase() : null;
          // const subject = this.props.on ? this.props.on.toLowerCase() : null;
          // if (subject === "platformassumptions" || subject === "comps") {
          //     this.setState({allowed: isSysAdmin});
          // }
          // else if (subject === "siteassumptions" && action === "edit") {
          //   this.setState({allowed: isSysAdmin || isSiteAdmin});
          // }
          // else if (subject === "billing" && action === "edit") {
          //   this.setState({allowed: isSysAdmin || isSiteAdmin});
          // }
          // else if (subject === "tenant" && action === "create") {
          //   this.setState({allowed: isSysAdmin});
          // }
          // else if (subject === "tenant" && action === "edit") {
          //   this.setState({allowed: isSysAdmin || isSiteAdmin});
          // }
          // else if (subject === "users" && action === "view") {
          //   this.setState({allowed: isSysAdmin || isSiteAdmin});
          // }
          // else if (subject === "members" && action === "view") {
          //   this.setState({allowed: isSysAdmin || isSiteAdmin});
          // }
          // else {
          //     this.setState({allowed: true});
          // }
      } else {
          this.setState({roles: [], allowed: false});
      }
    }
    catch(e) {
      console.log(e);
    }
  }

  render() {
    if (this.state.ability && this.state.ability.can(this.props.action, this.props.on)) {
      return this.props.children;
    }
    return null;
  }
  // render() {
  //   if (this.state.ability) {
  //     return <CaslCan I={this.props.action} on={this.props.on} ability={this.state.ability}>
  //     {this.props.children}
  //     </CaslCan>
  //   } else {
  //     return null;
  //   }
  // }
  // render() {
  //   if (this.state.allowed) {
  //       return this.props.children;
  //   }
  //   return null;
  // }

}

// Authorization HOC
export const Authorization = (WrappedComponent, action, on) => {
  return class WithAuthorization extends React.Component {
    constructor(props) {
      super(props)
    }
    render() {
        return <Can action={action} on={on}>
            <WrappedComponent {...this.props} />
        </Can>
    }
  }
}

export default Can;
