import React, { Component } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, ButtonGroup, UncontrolledTooltip} from 'reactstrap';
import { withSettings} from "../../../../api/SettingsProvider";
import PlotGraph from "./PlotGraph";
import '../../../property/property.css';
import '../../../reports/Report.css';
import { FormattedValue } from "../../Format";
import SaveToPdf from "../../saveToPdf/SaveToPdf";
import { ReportHeader } from "../../../reports/ReportHeader";
import ListAssumptionsReport from "../../../cmaAssumptions/ListAssumptionsReport";
import { RealPeekReportDisclaimer } from "../../../disclaimers/MLSDisclaimer";
import ReportSection from "../../../property/PropertyDetail/ReportSection";
import AggregateResults from "./AggregateResults";

const MainResultRow =(props) => {
    if (props.value != 'undefined') {
        return <Col>
            <Row className="text-muted"><h6>{props.name}</h6></Row>
            <Row className=" text-dark op-6"><h5><FormattedValue {...props} /></h5></Row>
        </Col>
    }
}
class AnalysisReport extends Component {
    constructor(props) {
		super(props);
    }
    
    render() {
        const settings = this.props.settings;
        if (!settings) {
            return null;
        }
        const results = this.props.results;
        const resultsAll = this.props.resultsAll;
        const query = this.props.query;
        const styleName = this.typeStyleMatches[query.style]

        return <div className="property report">
            <Row>
                <Col xs={12} md={12}>
                    <div className="pull-right">
                            <ButtonGroup className="pull-right" >
                                {/* <Button size="lg" className="ti-sharethis" outline style={{border:0}} onClick={this.handleEmail}></Button> */}
                                <SaveToPdf id="analysisReportID" filename={`Market Analysis ${new Date().toLocaleDateString()}.pdf`} />
                            </ButtonGroup>
                    </div>
                </Col>
            </Row>
            <div id="analysisReportID" className="property property-details">
                <div className="page">
                    <ReportHeader />
                        <Card className="p-2">
                        <ReportSection title="Market Analysis">
                            <CardBody className="p-3">
                            <Row>
                                <MainResultRow name='Total Properties' value={this.props.totalActive} type="number" />
                                <MainResultRow name='Successful' value={this.props.totalSuccess} type="number" />
                                <MainResultRow name='Property Type' value={styleName || ''} />
                                {
                                    query.style != "7" &&
                                    <MainResultRow name='Bedrooms' value={query.min_beds} type="number" />
                                }

                                <MainResultRow name='Budget' value={query.max_price} type="currency" />
                                <MainResultRow name='County' value={query.county || ''}/>
                            </Row>
                            </CardBody>
                            </ReportSection>
                        </Card>
                        <AggregateResults results={results} cityzip={this.props.cityzip} showPaginateOption={false}/>
                        <PlotGraph results={results} resultsAll={resultsAll} labels={this.props.cityzip} statname="rentStats" chartType="bar" title="Rents" formatType="currency" graphType="mixed" reportMode={true}/>
                    <RealPeekReportDisclaimer />
                </div>
                <div className="page">
                        <PlotGraph results={results} resultsAll={resultsAll} labels={this.props.cityzip} statname="cashFlowStats" chartType="bar" title="Cash Flow" formatType="currency" graphType="mixed" reportMode={true}/>
                        <PlotGraph results={results} resultsAll={resultsAll} labels={this.props.cityzip} statname="capRateStats" chartType="treemap" title="Cap Rate" formatType="percent" graphType="max" reportMode={true}/>
                        <PlotGraph results={results} resultsAll={resultsAll} labels={this.props.cityzip} statname="cashOnCashStats" chartType="bubble" title="Cash on Cash" formatType="percent" graphType="max" reportMode={true}/>
                        <RealPeekReportDisclaimer />
                    <ReportSection title="Assumptions">
                        <ListAssumptionsReport assumptions={this.props.assumptions} />
                    </ReportSection>
                    <RealPeekReportDisclaimer />
                </div>
            </div>
        </div>
    }
    typeStyleMatches = {
        1:'Single Family Residence',
		2:'Town House',
		3:'Condo',
		7:'Multi-Family',
		4:'Manufactured Home',
		10:'Co-Op'
    }
}

export default withSettings(AnalysisReport);
