import { API, Auth } from "aws-amplify";

export const IMGPATH = "https://s3-us-west-2.amazonaws.com/realpeekimages";


const endpoint = {
    search: () => "properties/search?include_cma=1",
    suggest: (term) => `suggest?t=${term}`,
    searchOptions: () => "properties/search/options",
    get: (id) => `properties/${id}`,
    assumptions: () => "assumptions/0",
    defaultassumptions: () => "assumptions/default",
    calculateCma: (id) => `properties/${id}/cma`,
    calculateCmaAnalyze: () => "properties/cmaanalyze",
    searchBulk: () => "properties/searchbulk",
    getTotalActives: () => "properties/actives",
    reports: (id) => id ? `reports/${id}` : "reports",
    getUserProfile: (id) => `users/${id}`,
    platformSettings: () => 'settings',
    savedsearches: (id) => id ? `savedsearches/${id}` : "savedsearches",
    registerTenant: ()=> "tenants",
    getTenantSettings: (id)=>`settings/${id}`,
    siteSettings: (name)=>`sites/${name}`,
    siteAssumptions: (id)=>`assumptions/${id}`,
    siteUsers: (tenantId) => `tenants/${tenantId}/users`,
    siteMembers: (tenantId) => `tenants/${tenantId}/members`,
    updateTenantSettings: (id)=>`tenants/${id}`,
    tenants: (id) => id ? `tenants/${id}` : "tenants",
    registerUser: (tenantId) => `tenants/${tenantId}/users/register`,
    loadTaxes: ()=> "taxes",
    updateRentometer: ()=> "rentometerstats",
    analyze: () => "properties/analyze",
    portfolio: (id) => id ? `portfolio/${id}` : "portfolio",
    analyzeFolio: () => "portfolio/analyze",
    calculateCmaFolio: (id) => `portfolio/${id}/cma`,
}

export const getSearchOptions = () => {
    return API.get("properties", endpoint.searchOptions())
}

export const getTotalActives = () => {
    return API.get("properties", endpoint.getTotalActives())
}


export const calculateCma= (id, options, parameters) => {
    let assumptions = {
        "options": options,
        "parameters": parameters
    }
    return API.post("properties", endpoint.calculateCma(id), {
        body: assumptions
    })
}

// This passes the actual property, not listing ID
export const calculateCmaAnalyze= (property, options, parameters) => {
    let queryassumptions = {
        "options": options,
        "parameters": parameters,
        "property": property
    }

    return API.post("properties", endpoint.calculateCmaAnalyze(), {
        body: queryassumptions
    })
}

export const calculateCmaFolio= (id, options, parameters) => {
    let assumptions = {
        "options": options,
        "parameters": parameters
    }
    return API.post("portfolio", endpoint.calculateCmaFolio(id), {
        body: assumptions
    })
}
export const getAssumptions = () => {
    return API.get("assumptions", endpoint.assumptions())
        .then(result => result);
}

export const updateAssumptions = (assumptions) => {
    return API.put("assumptions", endpoint.assumptions(), {
        body: assumptions
    })
}
export const getSiteAssumptions = (siteId) => {
    return API.get("assumptions", endpoint.siteAssumptions(siteId));
}

export const updateSiteAssumptions = (siteId, assumptions) => {
    return API.put("assumptions", endpoint.siteAssumptions(siteId), {
        body: assumptions
    })
}
export const getDefaultAssumptions = () => {
    return API.get("assumptions", endpoint.defaultassumptions())
        .then(result => result);
}

export const updateDefaultAssumptions = (assumptions) => {
    return API.put("assumptions", endpoint.defaultassumptions(), {
        body: assumptions
    })
}

export const fetchProperty = (id, include_cma) => {
    return API.get("properties", endpoint.get(id))
}

export const suggest = (query) => {
    return API.get("properties", endpoint.suggest(query));
}

export const searchProperties = (query, filterMode, assumptions) => {
    query["cma"] = assumptions;
    query["filter"] = filterMode;

    // const body = JSON.stringify(query, (key, value) => {
    //     if (value !== null) return value;
    // })

    // remove empty values from the query
    Object.keys(query).forEach((key) => (query[key] == null) && delete query[key])
    return API.post("properties", endpoint.search(), {
        body: query
    })
}

export const searchBulkProperties = (query, filterMode, assumptions) => {
    query["cma"] = assumptions;
    query["filter"] = filterMode;

    // const body = JSON.stringify(query, (key, value) => {
    //     if (value !== null) return value;
    // })
    // remove empty values from the query
    Object.keys(query).forEach((key) => (query[key] == null) && delete query[key])
    return API.post("properties", endpoint.searchBulk(), {
        body: query
    })
}

export const analyzeProperties = (query, filterMode, assumptions) => {
    query["cma"] = assumptions;
    query["filter"] = filterMode;

    // remove empty values from the query
    // Object.keys(query).forEach((key) => ((query[key] == null) || (query[key] == "")) && delete query[key])
    return API.post("properties", endpoint.analyze(), {
        body: query
    })
}

export const createReport = (report) => {
    return API.post("reports", endpoint.reports(), {
        body: report
    })
    .then(result => result);
}

export const getReport = (id) => {
    return API.get("reports", endpoint.reports(id))
        .then(result => result); 
}
export const getReports = () => {
    return API.get("reports", endpoint.reports())
        .then(result => result);
}

export const deleteReport = (id) => {
    return API.del("reports", endpoint.reports(id))
        .then(result => result);
}

export const updateReport = (id, field, newValue) => {
    const updates = {};
    updates[field] = newValue;
    return API.patch("reports", endpoint.reports(id), {
        body: updates
    }).then(result => result);
}

export const saveSearchCriteria = (criteria) => {
    return API.post("reports", endpoint.savedsearches(), {
        body: criteria
    });
}
export const updateSavedSearch = (id, searchSettings) => {
    return API.put("reports", endpoint.savedsearches(id), {
        body: searchSettings
    })
}
export const getSavedSearch = (id) => {
    return API.get("reports", endpoint.savedsearches(id));
}

export const getSavedSearches = () => {
    return API.get("reports", endpoint.savedsearches());
}

export const deleteSavedSearch = (id) => {
    return API.del("reports", endpoint.savedsearches(id));
}

export const getCurrentUser = async (id) => {
    let user = await Auth.currentAuthenticatedUser();
    return user;
}


export const getSiteSettings = (siteName) => {
    return API.get("settings", endpoint.siteSettings(siteName))
}

export const getTenantSettings = (id) => {
    return API.get("settings", endpoint.getTenantSettings(id))
}

export const getPlatformSettings = (id) => {
    return API.get("settings", endpoint.platformSettings())
}

export const registerTenant = (tenant) => {
    return API.post("tenants", endpoint.registerTenant(), {
        body: tenant
    });
}

export const updateTenantSettings = (tenant) => {
    const id = tenant.tenant_id;
    if (!id) {
        throw new Error('Id not provided');
    }
    return API.put("tenants", endpoint.updateTenantSettings(id), {
        body: tenant
    });
}

export const getTenants = () => {
    return API.get("tenants", endpoint.tenants())
}

export const deleteTenant = (tenant_id) => {
    return API.del("tenants", endpoint.tenants(tenant_id))
}

export const createUser = (site_id, user) => {
    return API.post("tenants", endpoint.siteUsers(site_id), {
        body: user
    })
}
export const deleteUser = (site_id, user_email) => {
    return API.del("tenants", endpoint.siteUsers(site_id) + "/" + user_email)
}

export const getUsers = (site_id) => {
    return API.get("tenants", endpoint.siteUsers(site_id))
}

export const signUp = async (email, password, firstName, lastName, tenantId) => {
    const newUser = await Auth.signUp({
        username: email,
        password: password,
        attributes: {
            given_name: firstName,
            family_name: lastName,
            'custom:tenantid': tenantId
        }
    });
    return API.post("tenants", endpoint.registerUser(tenantId), {
        body: {
            username: newUser.userSub
        }
    }).then(() => {
        return newUser;
    })
}


export const createMember = (site_id, member) => {
    return API.post("tenants", endpoint.siteMembers(site_id), {
        body: member
    })
}
export const deleteMember = (site_id, member_email) => {
    return API.del("tenants", endpoint.siteMembers(site_id) + "/" + member_email)
}
export const getMembers = (site_id) => {
    return API.get("tenants", endpoint.siteMembers(site_id))
}

export const importPropertyTaxes = () => {
    return API.post("taxes", endpoint.loadTaxes())
}

export const updateRentometer = () => {
    return API.post("rentometerstats", endpoint.updateRentometer())
}

export const getFolioProperty = (id) => {
    return API.get("portfolio", endpoint.portfolio(id));
}
export const getFolioProperties = (id) => {
    return API.get("portfolio", endpoint.portfolio(id));
}

export const createFolioProperty = (property, folioName) => {
    const folio = {};
    folio["folio_property"] = property;
    folio["folio_name"] = folioName;
    console.log("PropertyApi: createFolioProperty: folio = ", folio)
    return API.post("portfolio", endpoint.portfolio(), {
        body: folio
    })
}
export const deleteFolioProperty = (id) => {
    return API.del("portfolio", endpoint.portfolio(id));
}

export const updateFolioProperty = (id, newSettings) => {
    console.log("updateFolioProperty: id = ", id)
    console.log("updateFolioProperty: newSettings = ", newSettings)
    return API.put("portfolio", endpoint.portfolio(id), {
        body: newSettings
    })
}

export const analyzeFolio = (folioParams) => {
    console.log("PropertyAPi: analyzeFolio: folioParams = ", folioParams)
    return API.post("portfolio", endpoint.analyzeFolio(), {
        body: folioParams
    })
}