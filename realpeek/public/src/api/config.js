import {Auth} from "aws-amplify";
export default {
    content: {
        privacy: "https://s3-us-west-2.amazonaws.com/realpeekimages/assets/privacypolicy_realpeek.html",
        tos: "https://s3-us-west-2.amazonaws.com/realpeekimages/assets/tos_realpeek.html",
        dmca: "https://s3-us-west-2.amazonaws.com/realpeekimages/assets/dmca_notice.html",
        beta_agreement: "https://s3-us-west-2.amazonaws.com/realpeekimages/assets/beta_license_agreement.html",
        agent_agreement: "https://s3-us-west-2.amazonaws.com/realpeekimages/assets/RealPeek_Agent_License_Agreement.html"
    },
    storage: {
        BUCKET: 'realpeek-sites',
        REGION: 'us-west-2'
    },
    apiGateway: {
      endpoints: [
        {
            name: "properties",
            endpoint: process.env.REACT_APP_API,
            region: "us-west-2",
            custom_header: async() => {
                const user = await Auth.currentSession();
                return { Authorization : user.idToken.jwtToken }
            }
        },
        {
            name: "reports",
            region: "us-west-2",
            endpoint: process.env.REACT_APP_API,
            custom_header: async() => {
                const user = await Auth.currentSession();
                return { Authorization : user.idToken.jwtToken }
            }
        },
        {
            name: "assumptions",
            endpoint: process.env.REACT_APP_API,
            region: "us-west-2",
            custom_header: async() => {
                const user = await Auth.currentSession();
                return { Authorization : user.idToken.jwtToken }
            }
        },
        {
            name: "settings",
            endpoint: process.env.REACT_APP_API,
            region: "us-west-2",
            custom_header: async() => {
                try {
                    const user = await Auth.currentSession();
                    return { Authorization : user.idToken.jwtToken }
                }
                catch(err) {
                    return {}
                }
            }
        },
        {
            name: "tenants",
            endpoint: process.env.REACT_APP_API,
            region: "us-west-2",
            custom_header: async() => {
                try {
                    const user = await Auth.currentSession();
                    return { Authorization : user.idToken.jwtToken }
                }
                catch(err) {
                    return {}
                }
            }
        },
        {
            name: "taxes",
            endpoint: process.env.REACT_APP_API,
            region: "us-west-2",
            custom_header: async() => {
                try {
                    const user = await Auth.currentSession();
                    return { Authorization : user.idToken.jwtToken }
                }
                catch(err) {
                    return {}
                }
            }
        },
        {
            name: "rentometerstats",
            endpoint: process.env.REACT_APP_API,
            region: "us-west-2",
            custom_header: async() => {
                try {
                    const user = await Auth.currentSession();
                    return { Authorization : user.idToken.jwtToken }
                }
                catch(err) {
                    return {}
                }
            }
        },
        {
            name: "portfolio",
            endpoint: process.env.REACT_APP_API,
            region: "us-west-2",
            custom_header: async() => {
                const user = await Auth.currentSession();
                return { Authorization : user.idToken.jwtToken }
            }
        },
      ]
    },
    cognito: {
      REGION: "us-west-2",
      USER_POOL_ID: null, //"us-west-2_lPSGbjTAX",
      APP_CLIENT_ID: null, //"ga6ni73qsfq2pr7aj5kbraveq",
      IDENTITY_POOL_ID: "us-west-2:49b61753-4fc3-4693-adba-9b927add24aa"
    }
  };