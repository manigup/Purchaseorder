const cds = require('@sap/cds');
const axios = require('axios');

module.exports = (srv) => {

    const {PurchaseOrders, ASNItems } = srv.entities;
    
    srv.on('READ', PurchaseOrders, async (req) => {
        const {unitCode} = req._queryOptions
        const results = await getPurchaseOrders(unitCode);
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

    srv.on('READ', ASNItems, async (req) => {
        const {unitCode, docNum} = req._queryOptions
        const asnList = await fetchASNList(unitCode, docNum);
        if (!asnList) throw new Error('Unable to fetch ASN List.');

        return asnList;
    });

    srv.on('getPurchaseMaterialQuantityList', async (req) => {
        const { UnitCode, PoNum, MaterialCode } = req.data;
        // Replace '-' with '/' for PoNum
        const formattedPoNum = PoNum.replace(/-/g, '/');
        return getPurchaseMaterialQuantityList(UnitCode, formattedPoNum, MaterialCode)
    });

    srv.on('PostASN', async (req) => {
        const asnDataString = req.data.asnData;
        const asnDataParsed = JSON.parse(asnDataString);
        const asnDataFormatted = JSON.stringify(asnDataParsed, null, 2);
        try {
            const response = await postASN(asnDataFormatted);
            return response;
        } catch (error) {
            console.error('Error in PostASN API call:', error);
            throw new Error(`Error posting ASN: ${error.message}`);
        }
    });
};

async function getPurchaseOrders(unitCode) {
    try {
        const response = await axios({
            method: 'get',
            url: `https://imperialauto.co:84/IAIAPI.asmx/GetPurchaseMaterialList?UnitCode='${unitCode}'&RequestBy='Manikandan'`,
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

async function fetchASNList(unitCode, docNum) {
    try {
        const response = await axios({
            method: 'get',
            url: `https://imperialauto.co:84/IAIAPI.asmx/GetASNList?UnitCode='${unitCode}'&DocNum='${docNum}'&RequestBy='Manikandan'`,
            headers: {
                'Authorization': 'Bearer IncMpsaotdlKHYyyfGiVDg==',
                'Content-Type': 'application/json'
            },
            data: {}
        });

        if (response.data && response.data.d) {
            const asnData = JSON.parse(response.data.d);
            
            return asnData.map(item => ({
                CustomerReferenceNumber_PoNum: item.CustomerReferenceNumber,
                ItemCode: item.ItemCode,
                TemRevNo: item.TemRevNo,
                ItemUOM: item.ItemUOM,
                HsnCode: item.HsnCode,
                AddressCode: item.AddressCode,
                ItemRate: item.ItemRate,
                BalanceQty: item.BalanceQty,
                ASSValue: item.ASSValue,
                PFA: item.PFA,
                FFC: item.FFC,
                OT1: item.OT1,
                IGP: item.IGP,
                IGA: item.IGA,
                CGP: item.CGP,
                CGA: item.CGA,
                SGP: item.SGP,
                SGA: item.SGA,
                UGP: item.UGP,
                UGA: item.UGA,
                LineValue: item.LineValue,
                TCS: item.TCS,
                TCA: item.TCA
            }));
        } else {
            throw new Error('No data returned from the API.');
        }
    } catch (error) {
        console.error('Error fetching ASN List:', error);
        throw error;
    }
}

async function postASN(asnData) {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://imperialauto.co:84/IAIAPI.asmx/PostASN',
            headers: {
                'Authorization': 'Bearer IncMpsaotdlKHYyyfGiVDg==',
                'Content-Type': 'application/json'
            },
            data: asnData
        });

        if (response.data && response.data.SuccessCode) {
            return "ASN Posted Successfully: " + response.data.Result;
        } else {
            throw new Error(response.data.ErrorDescription || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Error in postASN:', error);
        throw error;
    }
}