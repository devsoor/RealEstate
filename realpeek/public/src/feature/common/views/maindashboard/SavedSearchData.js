import React, {Component} from "react"
import {Row, Col, Card, CardBody, CardTitle} from 'reactstrap';
import { Link } from "react-router-dom"


const SavedSearchData = (props) => {
    if (!props.savedsearches) {
        return null;
    }
    const savedsearches = props.savedsearches;
    return <div>
        <CardTitle className="bg-gradient-success border-bottom p-3 mb-1 text-white">
                Last 10 Saved Seaches</CardTitle>
        <CardBody>
            <Row>
                {savedsearches.map((s,i)=> {
                        return <Col key={i} md={12} className="mb-0 op-6">
                            <Row >
                                <CardBody>
                                    <Link to={'/search/' + s.id}>{s.name} </Link>
                                </CardBody>
                            </Row>
                        </Col>
                })}
        </Row>
        </CardBody>

    </div>
}

export default SavedSearchData