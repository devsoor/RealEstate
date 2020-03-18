import React, {Component} from "react"
import {Card, CardBody, Row, Col, Nav, NavLink, NavItem, TabPane, TabContent, Button, ButtonGroup,
    FormGroup, Label, Input, CustomInput } from "reactstrap"

import { getFolioProperty, getFolioProperties, analyzeFolio } from '../../../api/PropertyApi';
import LoaderButton from "../../common/LoaderButton/LoaderButton";
import Loader from 'react-loader-advanced';
import {MapContainerOffMarket} from '../../map/MapOffMarket';
import FolioPropertyPerformance from './FolioPropertyPerformance';
import FolioResultsAggregate from './FolioResultsAggregate';
import classnames from 'classnames';

class BuyerPortfolioAnalysis extends Component {
    constructor(props) {
        super(props);


    }


 
    render() {
        return <div>

        </div>
    }

}

export default BuyerPortfolioAnalysis;
