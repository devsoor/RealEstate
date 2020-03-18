import React, {Component} from "react"
import { Row, Col, Card, CardBody, CardTitle, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
;import UserCreateProfile from "./UserCreateProfile"
class ViewProfile extends Component {
    constructor(props) {
        super(props);

        this.state = {
            creatingProfile: false
        }
        this.toggle = this.toggle.bind(this);
        this.createProfile = this.createProfile.bind(this);
    }

    toggle() {
        this.setState(prevState => ({
          modal: !prevState.modal
        }));
      }
    createProfile() {
    this.setState({ creatingProfile: true });
    }

    closeProfile() {
        this.setState({ creatingProfile: false });
    }
    render() {
        let profile = this.props.profile;

        return <div>
            <CardBody>
                <Row>
                    <Col md="3" xs="6" className="border-right">
                    <strong>Full Name</strong>
                    <br />
                    <p className="text-muted">{profile.given_name} {profile.family_name}</p>
                    </Col>
                    {/* <Col md="3" xs="6" className="border-right">
                    <strong>Mobile</strong>
                    <br />
                    <p className="text-muted">(123) 456 7890</p>
                    </Col> */}
                    <Col md="3" xs="6" className="border-right">
                    <strong>Email</strong>
                    <br />
                    <p className="text-muted">{profile.email}</p>
                    </Col>
                    {/* <Col md="3" xs="6" className="border-right">
                    <strong>Location</strong>
                    <br />
                    <p className="text-muted">Bothell</p>
                    </Col> */}
                </Row>
                </CardBody>

                {/* <CardBody>
                    <Button  className="bg-info" onClick={this.createProfile}>Create Profile ...</Button>
                </CardBody> */}
                
{/*                 <Modal isOpen={this.state.editingProfile} toggle={this.toggle}>
                    <ModalHeader toggle={this.toggle}>Create Profile</ModalHeader>
                    <ModalBody>
                        <UserCreateProfile firstName={this.state.firstName.value} lastName={this.state.lastName.value} email={this.state.email.value}/>
                    </ModalBody>
                </Modal> */}
                {
                    this.state.creatingProfile && <UserCreateProfile/>
                }


              {/*   <h4 className="font-medium mt-4">Investment Criteria Favorites</h4>
                <hr />
                <h5 className="mt-4">
                    Cash Flow <span className="float-right">80%</span>
                </h5>
                <Progress value={80} />
                <h5 className="mt-4">
                    Cap Rate <span className="float-right">90%</span>
                </h5>
                <Progress color="success" value="25" />
                <h5 className="mt-4">
                    Cash on Cash Return <span className="float-right">50%</span>
                </h5>
                <Progress color="info" value={50} />
                <h5 className="mt-4">
                    Schools <span className="float-right">70%</span>
                </h5>
                <Progress color="warning" value={75} /> */}
        </div>
    }
}

export default ViewProfile;
