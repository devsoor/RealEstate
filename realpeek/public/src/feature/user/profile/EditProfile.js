import React, {Component} from "react"
import {Row, Col} from "reactstrap"
class EditProfile extends Component {
    render() {
        let profile = this.props.profile;

        return <div>
            <Row>
                <Col md={4}>
                    <h2>Registration Date</h2>
                    <p>{profile.registrationDate}</p>
                </Col>
                <Col md={4}>
                    <h2>Membership Level</h2>
                    <p>{profile.role}</p>
                </Col>
                <Col md={4}>
                    <h2>Last Login</h2>
                    <p>Last login: {profile.lastLoginDate} at {profile.lastLoginTime}</p>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <h2>First Name</h2>
                    <p>{profile.firstName}</p>
                </Col>
                <Col md={6}>
                    <h2>Last Name</h2>
                    <p>{profile.lastName}</p>
                </Col>
                <Col md={6}>
                    <h2>Email Address</h2>
                    <p>{profile.email}</p>
                </Col>
            </Row>
        </div>
    }
}

export default EditProfile;
