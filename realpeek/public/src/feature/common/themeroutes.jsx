import MainDashboard from './views/maindashboard/maindashboard.jsx.js';
import RentDashboard from './views/rentdashboard/rentdashboard.jsx.js';
import FlipDashboard from './views/flipdashboard/flipdashboard.jsx.js';
import OffmarketDashboard from './views/offmarketdashboard/offmarketdashboard.jsx.js';
import MarketDashboard from './views/marketdashboard/marketdashboard.jsx.js';
import FavoritesDashboard from './views/account/favorites.jsx.js';
import SavedSearchDashboard from './views/account/savedsearch.jsx.js';
import ReportsDashboard from './views/account/reports.jsx.js';
import AssumptionsDashboard from './views/account/assumptions.jsx.js';
import PortfolioManager from '../OffMarket/Portfolio/PortfolioManager.js.js';
import SellerPortfolioAnalysis from '../OffMarket/Portfolio/SellerPortfolioAnalysis.js.js';
import BuyerPortfolioAnalysis from '../OffMarket/Portfolio/BuyerPortfolioAnalysis.js.js';
import Search from '../search/Search';


var ThemeRoutes = [
  {
    navlabel: true,
    name: "Apps",
    icon: "mdi mdi-apps",
  },
  // {
  //   path: '/',
  //   name: 'Dashboard',
  //   icon: 'mdi mdi-gauge',
  //   component: MainDashboard
  // },
  {
    path: '/',
    name: 'On-market Search',
    icon: 'mdi mdi-home-map-marker',
    component: Search
  },
  {
    path: '/offmarket',
    name: 'Off-market Properties',
    icon: 'mdi mdi-grid-off',
    component: OffmarketDashboard
  },
  {
    path: '/sellerportfolioanalysis',
    name: 'Seller Portfolio Analysis',
    icon: 'mdi mdi-chart-areaspline',
    component: SellerPortfolioAnalysis
  },
  {
    path: '/buyerportfolioanalysis',
    name: 'Buyer Portfolio Analysis',
    icon: 'mdi mdi-chart-pie',
    component: BuyerPortfolioAnalysis
  },
  {
    path: '/market',
    name: 'Market Analysis',
    icon: 'mdi mdi-chart-bar',
    component: MarketDashboard
  },
  {
    navlabel: true,
    name: "Settings",
    icon: "mdi mdi-settings",
  },
  {
    path: '/user/saved-searches',
    name: 'Saved Searches',
    icon: 'mdi mdi-content-save',
    component: SavedSearchDashboard
  },
  {
    path: '/user/assumptions',
    name: 'Default Assumptions',
    icon: 'mdi mdi-brightness-auto',
    component: AssumptionsDashboard
  },
  {
    path: '/portfoliomanager',
    name: 'Portfolio Manager',
    icon: 'mdi mdi-map-marker-multiple',
    component: PortfolioManager
  },
  {
    path: '/user/reports',
    name: 'Reports',
    icon: 'mdi mdi-book-open',
    component: ReportsDashboard
  },
/*   {
    path: '/user/favorites',
    name: 'Favorites',
    icon: 'mdi mdi-heart',
    component: FavoritesDashboard
  }, */
];
export default ThemeRoutes;
