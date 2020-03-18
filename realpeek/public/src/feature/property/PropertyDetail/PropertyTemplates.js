export default {
    resi: {
        sections: [
            {
                name: "Overview",
                fields: [
                        { name: 'Type', field: 'details.STY'},	
                        { name: 'Year Built', field: 'year_built'},
                        { name: 'Annual Association Dues', field: 'property.hoa_dues'},
                        { name: 'County', field: 'county'},
                        { name: 'MLS ID', field: 'listing_id'},
                    ]
                },
                {
                    name: "Interior Features",
                    fields: [
                        { name: 'Interior Features', field: 'details.FEA'},
                        { name: 'Flooring', field: 'details.FLS'},
                        { name: 'Appliances', field: 'details.APS'},
                        { name: 'Energy', field: 'details.ENS'},
                        { name: 'Heating/Cooling Type', field: 'details.HTC'},
                        { name: 'Environmental certification', field: 'details.ECRT'},
                    ]
                },
                {
                    name: "Exterior Features",
                    fields: [
                        { name: 'Exterior Features', field: 'details.EXT'},
                        { name: 'Foundation', field: 'details.FND'},
                        { name: 'Lot Size', field: 'details.LSF'},
                        { name: 'Lot Topography', field: 'details.LTV'},
                        { name: 'Sewer', field: 'details.SWR'},
                        { name: 'Water', field: 'details.WAS'},
                        { name: 'Parking', field: 'details.GR'},
                        { name: 'Architecture', field: 'details.ARC'},
                        { name: 'Site Features', field: 'details.SIT'},
                    ]
                },
                {
                    name: "Community Features",
                    fields: [
                        { name: 'Lot', field: 'details.LDE'},
                        { name: 'View', field: 'details.VEW'},
                        { name: 'Pool', field: 'details.POL'},
                        { name: 'Roof', field: 'details.RF'}
                    ]
                },
                {
                    name: "Financials",
                    fields: [
                        { name: 'Terms', field: 'details.TRM'},
                        { name: 'Annual Taxes', field: 'details.TX'},
                        { name: 'Tax Year', field: 'details.TXY'}
                    ]
                },
                {
                    name: "Zoning",
                    fields: [
                        { name: 'Zoning Jurisdiction', field: 'details.ZJD'},
                        { name: 'Zoning Code', field: 'details.ZNC'}
                    ]
                },
                {
                    name: "Amenities",
                    fields: [
                        { name: 'School District', field: 'details.SD'},
                        { name: 'Elementary School', field: 'details.EL'},
                        { name: 'Junior High School', field: 'details.JH'},
                        { name: 'Senior High School', field: 'details.SH'},
                        { name: 'Sewer Company', field: 'details.SWR'},
                        { name: 'Power Company', field: 'details.POC'},
                        { name: 'Water Company', field: 'details.WAC'},
                    ]
                }
            ]
    },
    cond: {
        sections: 
        [{
            name: "Overview",
            fields: [	
                    { name: 'Year Built', field: 'year_built'},
                    { name: 'Annual Association Dues', field: 'hoa_dues'},
                    { name: 'County', field: 'county'},
                    { name: 'MLS ID', field: 'listing_id'},
                ]
            },
            {
                name: "Interior Features",
                fields: [
                    { name: 'Flooring', field: 'details.FLS'},
                    { name: 'Appliances', field: 'details.APS'},
                    { name: 'Energy', field: 'details.ENS'},
                    { name: 'Heating/Cooling Type', field: 'details.HTC'},
                    { name: 'Fireplace', field: 'details.TOF'},
                ]
            },
            {
                name: "Exterior Features",
                fields: [
                    { name: 'Exterior Features', field: 'details.EXT'},
                    { name: 'Parking', field: 'details.PKG'},
                    { name: 'Architecture', field: 'details.ARC'},
                    { name: 'Number of Units in Complex', field: 'details.NOC'},
                    { name: 'Owner Occupancy Percentage', field: 'details.OOC'},
                    { name: 'Home Owner Dues Include', field: 'details.HOI'},
                ]
            },
            {
                name: "Community Features",
                fields: [
                    { name: 'Lot', field: 'details.LDE'},
                    { name: 'View', field: 'details.VEW'},
                    { name: 'Roof', field: 'details.RF'},
                    { name: 'Community Features', field: 'details.CMN'}

                ]
            },
            {
                name: "Financials",
                fields: [
                    { name: 'Terms', field: 'details.TRM'},
                    { name: 'Annual Taxes', field: 'details.TX'},
                    { name: 'Tax Year', field: 'details.TXY'}
                ]
            },
            {
                name: "Amenities",
                fields: [
                    { name: 'School District', field: 'details.SD'},
                    { name: 'Elementary School', field: 'details.EL'},
                    { name: 'Junior High School', field: 'details.JH'},
                    { name: 'Senior High School', field: 'details.SH'},
                    { name: 'Sewer Company', field: 'details.SWR'},
                    { name: 'Power Company', field: 'details.POC'},
                    { name: 'Water Company', field: 'details.WAC'},
                ]
            }
        ]
    },
    manu: {
        sections: 
        [{
            name: "Overview",
            fields: [	
                    { name: 'Type', field: 'details.STY'},
                    { name: 'Year Built', field: 'year_built'},
                    { name: 'County', field: 'county'},
                    { name: 'MLS ID', field: 'listing_id'},
                ]
            },
            {
                name: "Interior Features",
                fields: [
                    { name: 'Interior Features', field: 'details.MHF'},
                    { name: 'Other Rooms', field: 'details.OTR'},
                    { name: 'Flooring', field: 'details.FLS'},
                    { name: 'Appliances', field: 'details.APS'},
                    { name: 'Energy', field: 'details.ENS'},
                    { name: 'Heating/Cooling Type', field: 'details.HTC'}
                ]
            },
            {
                name: "Exterior Features",
                fields: [
                    { name: 'Exterior Features', field: 'details.EXT'},
                    { name: 'Foundation', field: 'details.ANC'},
                    { name: 'Leased Equipment', field: 'details.LEQ'},
                    { name: 'Water', field: 'details.WAS'},
                    { name: 'Parking', field: 'details.PKG'}
                ]
            },
            {
                name: "Community Features",
                fields: [
                    { name: 'Lot', field: 'details.LDE'},
                    { name: 'View', field: 'details.VEW'},
                    { name: 'Roof', field: 'details.RF'},
                    { name: 'Community Features', field: 'details.PKA'}

                ]
            },
            {
                name: "Amenities",
                fields: [
                    { name: 'School District', field: 'details.SD'},
                    { name: 'Elementary School', field: 'details.EL'},
                    { name: 'Junior High School', field: 'details.JH'},
                    { name: 'Senior High School', field: 'details.SH'},
                    { name: 'Sewer Company', field: 'details.SWR'},
                    { name: 'Power Company', field: 'details.POC'},
                    { name: 'Water Company', field: 'details.WAC'},
                ]
            }
        ]
    },
    mult: {
        sections: 
        [{
            name: "Overview",
            fields: [	
                    { name: 'Type', field: 'details.STY'},
                    { name: 'Year Built', field: 'year_built'},
                    { name: 'County', field: 'county'},
                    { name: 'MLS ID', field: 'listing_id'},
                ]
            },
            {
                name: "Interior Features",
                fields: [
                    { name: 'Flooring', field: 'details.FLS'},
                    { name: 'Energy', field: 'details.ENS'},
                    { name: 'Heating/Cooling Type', field: 'details.HTC'}
                ]
            },
            {
                name: "Exterior Features",
                fields: [
                    { name: 'Exterior Features', field: 'details.EXT'},
                    { name: 'Foundation', field: 'details.FND'},
                    { name: 'Sewer', field: 'details.SWR'},
                    { name: 'Water', field: 'details.WAS'},
                    { name: 'Site Features', field: 'details.SIT'}
                ]
            },
            {
                name: "Zoning",
                fields: [
                    { name: 'General Zoning Classification', field: 'details.GZC'}

                ]
            },
            {
                name: "Community Features",
                fields: [
                    { name: 'Lot', field: 'details.LDE'},
                    { name: 'View', field: 'details.VEW'},
                    { name: 'Pool', field: 'details.POL'},
                    { name: 'Roof', field: 'details.RF'},
                    { name: 'Community Features', field: 'details.AMN'}

                ]
            },
            {
                name: "Amenities",
                fields: [
                    { name: 'School District', field: 'details.SD'},
                    { name: 'Elementary School', field: 'details.EL'},
                    { name: 'Junior High School', field: 'details.JH'},
                    { name: 'Senior High School', field: 'details.SH'},
                    { name: 'Sewer Company', field: 'details.SWR'},
                    { name: 'Power Company', field: 'details.POC'},
                    { name: 'Water Company', field: 'details.WAC'},
                ]
            }
        ]
    },
    vacl: {
        sections: 
        [{
            name: "Overview",
            fields: [	
                    { name: 'County', field: 'county'},
                    { name: 'MLS ID', field: 'listing_id'},
                ]
            },
            {
                name: "Site Features",
                fields: [
                    { name: 'Property Features', field: 'details.FTR'},
                    { name: 'Electricity Status', field: 'details.ELE'},
                    { name: 'Sewer', field: 'details.SWR'},
                    { name: 'Water', field: 'details.WTR'},
                    { name: 'Septic System Installed', field: 'details.SEP'}
                ]
            },
            {
                name: "Zoning",
                fields: [
                    { name: 'General Zoning Classification', field: 'details.GZC'}

                ]
            },
            {
                name: "Amenities",
                fields: [
                    { name: 'School District', field: 'details.SD'},
                    { name: 'Elementary School', field: 'details.EL'},
                    { name: 'Junior High School', field: 'details.JH'},
                    { name: 'Senior High School', field: 'details.SH'}
                ]
            }
        ]
    }
}