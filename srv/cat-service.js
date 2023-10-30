const cds = require('@sap/cds');
const axios = require('axios');

module.exports = (srv) => {

    const {PurchaseOrders} = srv.entities;
    
    srv.on('READ', PurchaseOrders, async (req) => {
        const results = await getPurchaseOrders();
        if (!results) throw new Error('Unable to fetch PurchaseOrders.');

        const expandDocumentRows = req.query.SELECT.columns && req.query.SELECT.columns.some(({ expand, ref }) => expand && ref[0] === "DocumentRows");
        if (expandDocumentRows) {
            results.purchaseOrders.forEach(po => {
                po.DocumentRows = results.documentRows.filter(dr => dr.PNum_PoNum === po.PoNum);
            });
        }

        // Checking for search parameter
        const searchVal = req._queryOptions && req._queryOptions.$search;
        if (searchVal) {
            const cleanedSearchVal = searchVal.trim().replace(/"/g, '');
            results.purchaseOrders = results.purchaseOrders.filter(po =>
                po.PoNum.includes(cleanedSearchVal)
            );
        }

        
       return results.purchaseOrders;
    });

    srv.on('getPurchaseMaterialQuantityList', async (req) => {
        const { UnitCode, PoNum, MaterialCode } = req.data;
        // Replace '-' with '/' for PoNum
        const formattedPoNum = PoNum.replace(/-/g, '/');
        return getPurchaseMaterialQuantityList(UnitCode, formattedPoNum, MaterialCode)
    });
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
                    VendorCode: data.VendorCode,
                    PlantCode: data.PlantCode,
                    PlantName: data.PlantName,
                };
            });

            // Extracting DocumentRows details
            const documentRows = dataArray.flatMap(data =>
                data.DocumentRows.map(row => {
                    return {
                        LineNum: parseInt(row.LineNum),
                        PoDate: data.PoDate,
                        VendorName: data.VendorName,
                        VendorCode: data.VendorCode,
                        PlantCode: data.PlantCode,
                        PlantName: data.PlantName,
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
