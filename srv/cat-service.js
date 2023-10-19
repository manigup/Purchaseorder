const cds = require('@sap/cds');
const axios = require('axios');

module.exports = (srv) => {
    srv.on('READ', 'PurchaseOrders', async (req) => {
        try {
            const results = await getPurchaseOrders();
            return results.purchaseOrders;
        } catch (error) {
            console.error('Error fetching PurchaseOrders:', error);
            throw new Error('Unable to fetch PurchaseOrders.');
        }
    });

    srv.on('READ', 'DocumentRowItems', async (req) => {
        try {
            const results = await getPurchaseOrders();
    
            // If _queryOptions exist and has $filter property
            if (req._queryOptions && req._queryOptions.$filter) {
                const filterStr = req._queryOptions.$filter;
                const filterParts = filterStr.split(' eq ');
                if (filterParts.length === 2) {
                    const filterField = filterParts[0];
                    const filterValue = filterParts[1].replace(/'/g, '');
                    const filteredResults = results.documentRows.filter(row => String(row[filterField]) === filterValue);
                    return filteredResults;
                }
            }
    
            return results.documentRows;
        } catch (error) {
            console.error('Error fetching DocumentRowItems:', error);
            throw new Error('Unable to fetch DocumentRowItems.');
        }
    });

    srv.on('getPurchaseMaterialQuantityList', async(req) => {
        const {UnitCode, PoNum, MaterialCode} = req.data;
        // Replace '-' with '/' for PoNum
        const formattedPoNum = PoNum.replace(/-/g, '/');
        return getPurchaseMaterialQuantityList(UnitCode, formattedPoNum, MaterialCode)
    })
};

async function getPurchaseOrders() {
    try {
        const response = await axios({
            method: 'get',
            url: "https://imperialauto.co:84/IAIAPI.asmx/GetPurchaseMaterialList?UnitCode='P01'&RequestBy='Manikandan'",
            headers: {
                'Authorization': 'Bearer IncMpsaotdlKHYyyfGiVDg==',
                'Content-Type': 'application/json'
            },
            data: {}
        });

        if (response.data && response.data.d) {
            const dataArray = JSON.parse(response.data.d);
            
            const purchaseOrders = dataArray.map(data => {
                return {
                    PoNum: data.PoNum,
                    PoDate: data.PoDate,
                    VendorName: data.VendorName,
                };
            });

            // Extracting DocumentRows details
            const documentRows = dataArray.flatMap(data => 
                data.DocumentRows.map(row => {
                    return {
                        LineNum: parseInt(row.LineNum),
                        PoDate: data.PoDate,
                        VendorName: data.VendorName,
                        ItemCode: row.ItemCode,
                        ItemDesc: row.ItemDesc,
                        HSNCode: row.HSNCode,
                        PoQty: parseInt(row.PoQty),
                        DeliveredQty: parseFloat(row.DeliveredQty),
                        BalanceQty: parseFloat(row.BalanceQty),
                        UnitPrice: parseFloat(row.UnitPrice),
                        PNum_PoNum: data.PoNum  // associating with the current PurchaseOrder
                    };
                })
            );

            return {
                purchaseOrders: purchaseOrders,
                documentRows: documentRows
            };
        }
    } catch (error) {
        console.error('Error in API call:', error);
        throw error;
    }
}

async function getPurchaseMaterialQuantityList(UnitCode, PoNum, MaterialCode) {
    try {
        const response = await axios({
            method: 'get',
            url: `https://imperialauto.co:84/IAIAPI.asmx/GetPurchaseMaterialQuantityList?UnitCode='${UnitCode}'&PoNum='${PoNum}'&MaterialCode='${MaterialCode}'&RequestBy='Manikandan'`,
            headers: {
                'Authorization': 'Bearer IncMpsaotdlKHYyyfGiVDg==',
                'Content-Type': 'application/json'
            },
            data: {}
        });

        if (response.data && response.data.d) {
            return JSON.parse(response.data.d);
        } else {
            console.error('Error parsing response:', response.data);
            throw new Error('Error parsing the response from the API.');
        }
    } catch (error) {
        console.error('Error in getPurchaseMaterialQuantityList API call:', error);
        throw new Error('Unable to fetch Purchase Material Quantity List.');
    }
}
