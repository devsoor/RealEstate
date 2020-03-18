import React from "react";
import { Route, Switch } from "react-router-dom";

import AuthenticatedRoute from "../routes/AuthenticatedRoute";
import PublicRoute from "../routes/PublicRoute";
import { MasterPage, withMaster, withDashboard } from '../common/MasterPage';
import Can from '../auth/Authorization/Can';
import Search from '../search/Search';
import UserAccount from '../user/account/UserAccount';
import NotFound from '../common/errors/NotFound';
import Login from '../auth/Login/LoginPage';
import Signup from "../auth/Signup/Signup";
import { PrivacyPolicy, TermsOfService, DmcaNotice, BetaLicenseAgreement } from "../disclaimers/RealPeekDisclaimers";
import {PropertyContainer, SinglePropertyReportContainer} from '../property/PropertyDetail';
import {PropertyAnalyzeContainer} from '../OffMarket/Property';

import { RealPeekSiteDisclaimer } from "../disclaimers/MLSDisclaimer";
import ManageSite from "../admin/ManageSite";
import ForgotPassword from "../auth/Login/ForgotPassword";
import Redirect from "react-router-dom/Redirect";
import LandingPage from "./LandingPage";
import MainDashboard from "../common/views/maindashboard/maindashboard.jsx.js";
import OffMarket from "../OffMarket/OffMarket.js.js";
import MarketDashboard from "../common/views/marketdashboard/marketdashboard.jsx.js";
import PortfolioManager from '../OffMarket/Portfolio/PortfolioManager.js.js';
import SellerPortfolioAnalysis from '../OffMarket/Portfolio/SellerPortfolioAnalysis.js.js';
import BuyerPortfolioAnalysis from '../OffMarket/Portfolio/BuyerPortfolioAnalysis.js.js';

export default (props) => {
    let match=props.match;
    let childProps = props.childProps;
    const site_configured = props.status === 'ACTIVE';
    const show_landing_page = props.settings.show_landing_page;
    return <div>
        <Switch>
        <PublicRoute exact path={`/login`} component={withMaster(Login, childProps, "dark")} props={childProps} />
        {
            show_landing_page &&
            <PublicRoute exact path="/signup" component={LandingPage} props={childProps} />
            
        }
        {
            !show_landing_page &&
            <PublicRoute exact path="/signup" component={withMaster(Signup, childProps, "dark", false)} props={childProps} /> 
        }
        {/* <PublicRoute exact path="/signup" component={withMaster(LandingPage, childProps, "", false)} props={childProps} />
    <PublicRoute exact path="/signup" component={LandingPage} props={childProps} />
    */}
        
        <PublicRoute exact path="/forgot-password" component={withMaster(ForgotPassword, childProps, "dark")} props={childProps} />

        <PublicRoute path="/privacy" exact component={withMaster(PrivacyPolicy, childProps)} props={childProps} />
        <PublicRoute path="/tos" exact component={withMaster(TermsOfService, childProps)} props={childProps} />
        <PublicRoute path="/dmca" exact component={withMaster(DmcaNotice, childProps)} props={childProps} />
        <PublicRoute path="/betalicense" exact component={withMaster(BetaLicenseAgreement, childProps)} props={childProps} />
        <PublicRoute path="/disclaimer" exact component={withMaster(RealPeekSiteDisclaimer, childProps)} props={childProps} />

        <AuthenticatedRoute path="/admin/sites" component={withDashboard(ManageSite, childProps)} props={childProps} />

        {
            !site_configured &&
            <Redirect from="*" to="/admin/sites/profile" />
        }

        <AuthenticatedRoute exact path={`/`} component={withDashboard(Search, childProps, '', true)} props={childProps} />
        {/* <AuthenticatedRoute path={`/rent`} component={withDashboard(Search, childProps, '', true)} props={childProps} /> */}
        <AuthenticatedRoute path={`/market`} component={withDashboard(MarketDashboard, childProps, '', true)} props={childProps} /> 
        <AuthenticatedRoute path="/search/:id?" component={withDashboard(Search, childProps, '', true)} props={childProps} />
        <AuthenticatedRoute path="/property/:id" component={withDashboard(PropertyContainer, childProps)} props={childProps}/>
        {/* <AuthenticatedRoute path="/property/:id/report" component={withMaster(SinglePropertyReportContainer, childProps)} props={childProps}/> */}
        <AuthenticatedRoute path="/propertyAnalyze" component={withDashboard(PropertyAnalyzeContainer, childProps)} props={childProps}/>
        <AuthenticatedRoute path="/user" component={withDashboard(UserAccount, childProps)} props={childProps}/>
        <AuthenticatedRoute path="/offmarket" component={withDashboard(OffMarket, childProps)} props={childProps}/>
        <AuthenticatedRoute path="/portfoliomanager" component={withDashboard(PortfolioManager, childProps)} props={childProps}/>
        <AuthenticatedRoute path="/sellerportfolioanalysis" component={withDashboard(SellerPortfolioAnalysis, childProps)} props={childProps}/>
        <AuthenticatedRoute path="/buyerportfolioanalysis" component={withDashboard(BuyerPortfolioAnalysis, childProps)} props={childProps}/>

    </Switch>
    </div>
}