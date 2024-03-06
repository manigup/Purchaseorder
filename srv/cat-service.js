const cds = require('@sap/cds');
const axios = require('axios');

module.exports = (srv) => {

    const { PurchaseOrders, ASNListHeader, DocumentRowItems } = srv.entities;

    srv.on("stageDocumentRows", async function (req) {

        const parseData = JSON.parse(req.data.data);
        let sInsertQuery = INSERT.into(DocumentRowItems).entries(parseData);
        await cds.tx(req).run(sInsertQuery).catch((err) => console.log(err.message));
    });

    srv.on('READ', PurchaseOrders, async (req) => {
        const { AddressCode, UnitCode } = req._queryOptions;
        const Po_Num = req._queryOptions.Po_Num || "";
        const results = await getPurchaseOrders(AddressCode, Po_Num, ASNListHeader, DocumentRowItems, UnitCode);
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
        const { UnitCode, PoNum, MaterialCode, PoLineNum } = req.data;
        // Replace '-' with '/' for PoNum
        const formattedPoNum = PoNum.replace(/-/g, '/');
        return getPurchaseMaterialQuantityList(UnitCode, formattedPoNum, MaterialCode, PoLineNum)
    });
    /*
        srv.before('CREATE', 'Files', async(req) => {
            req.data.url = `/v2/odata/v4/catalog/Files(PNum_PoNum='${req.data.PNum_PoNum}')/content`
        })
    */
    srv.on('GetScheduleNumber', async (req) => {
        const { UnitCode, AddressCode } = req.data;

        try {
            const scheduleNumber = await fetchScheduleNumber(UnitCode, AddressCode);
            return scheduleNumber;
        } catch (error) {
            console.error('Error in GetScheduleNumber:', error);
            throw new Error('Failed to retrieve schedule number.');
        }
    });

    srv.on('GetScheduleLineNumber', async (req) => {
        const { UnitCode, AddressCode, ScheduleNumber } = req.data;

        try {
            const scheduleLineNumber = await fetchScheduleLineNumber(UnitCode, AddressCode, ScheduleNumber);
            return scheduleLineNumber;
        } catch (error) {
            console.error('Error in GetScheduleLineNumber:', error);
            throw new Error('Failed to retrieve schedule line number.');
        }
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

async function getPurchaseOrders(AddressCode, Po_Num, ASNListHeader, DocumentRowItems, UnitCode) {
    try {
        const response = await axios({
            method: 'get',
            url: `https://imperialauto.co:84/IAIAPI.asmx/GetPurchaseMaterialList?AddressCode='${AddressCode}'&UnitCode='${UnitCode}'&RequestBy='Manikandan'`,
            headers: {
                'Authorization': 'Bearer IncMpsaotdlKHYyyfGiVDg==',
                'Content-Type': 'application/json'
            },
            data: {}
        });

        const responseASN = await SELECT.from(ASNListHeader).columns('PNum_PoNum');

        if (response.data && response.data.d) {
            const dataArray = JSON.parse(response.data.d);
            const asnSet = new Set(responseASN.map(asn => asn.PNum_PoNum));

            const purchaseOrders = dataArray.map(data => {
                const hasMatchingASN = asnSet.has(data.PoNum.replace(/\//g, '-'));
                return {
                    PoNum: data.PoNum,
                    PoDate: data.PoDate,
                    VendorCode: data.VendorCode,
                    VendorName: data.VendorName,
                    PlantCode: data.PlantCode,
                    PlantName: data.PlantName,
                    ValidFrom: data.ValidFrom,
                    ValidTo: data.ValidTo,
                    HasAttachments: hasMatchingASN ? "Invoice Submitted" : "Invoice Submission Pending",
                };
            });

            let itemRecord = [], filter, supplierRate, rateAggreed;
            if (Po_Num) {
                itemRecord = await SELECT.from(DocumentRowItems).where({ PNum_PoNum: Po_Num });
            }

            // Extracting DocumentRows details
            const documentRows = dataArray.flatMap(data =>
                data.DocumentRows.map(row => {

                    filter = itemRecord.filter(item => item.ItemCode === row.ItemCode);
                    if (filter.length > 0) {
                        rateAggreed = filter[0].RateAggreed;
                        supplierRate = filter[0].SupplierRate;
                    } else {
                        rateAggreed = true;
                        supplierRate = "";
                    }

                    return {
                        LineNum: row.LineNum,
                        ItemCode: row.ItemCode,
                        ItemDesc: row.ItemDesc,
                        HSNCode: row.HSNCode,
                        PoQty: parseInt(row.PoQty),
                        DeliveredQty: parseFloat(row.DeliveredQty),
                        BalanceQty: parseFloat(row.BalanceQty),
                        UnitPrice: parseFloat(row.UnitPrice),
                        UOM: row.UOM,
                        Currency: row.Currency,
                        Status: row.Status,
                        VendorName: data.VendorName,
                        VendorCode: data.VendorCode,
                        PlantCode: data.PlantCode,
                        PlantName: data.PlantName,
                        ConfirmStatus: "",
                        ASSValue: row.ASSValue,
                        Packing: row.Packing,
                        Frieght: row.Frieght,
                        OtherCharges: row.OtherCharges,
                        TCS: row.TCS,
                        SGST: row.SGST,
                        SGA: row.SGA,
                        CGST: row.CGST,
                        CGA: row.CGA,
                        IGST: row.IGST,
                        IGA: row.IGA,
                        TOTAL: row.TOTAL,
                        TCA: row.TCA,
                        LineValue: row.LineValue,
                        WeightInKG: row.WeightInKG,
                        RateAggreed: rateAggreed,
                        SupplierRate: supplierRate,
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

async function getPurchaseMaterialQuantityList(UnitCode, PoNum, MaterialCode, PoLineNum) {
    try {
        const response = await axios({
            method: 'get',
            url: `https://imperialauto.co:84/IAIAPI.asmx/GetPurchaseMaterialQuantityList?UnitCode='${UnitCode}'&PoNum='${PoNum}'&MaterialCode='${MaterialCode}'&PoLineNum='${PoLineNum}'&RequestBy='Manikandan'`,
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

async function fetchScheduleNumber(UnitCode, AddressCode) {
    const formattedScheduleNumber = ScheduleNumber.replace(/-/g, '/');
    try {
        const response = await axios.get(`https://imperialauto.co:84/IAIAPI.asmx/GetScheduleNumber?UnitCode='${UnitCode}'&AddressCode='${formattedScheduleNumber}'&RequestBy='Manikandan'`, {
            headers: {
                'Authorization': 'Bearer IncMpsaotdlKHYyyfGiVDg==',
                'Content-Type': 'application/json'
            }
        });
        const scheduleNumbers = JSON.parse(response.data.d).map(item => ({
            Schedulenumber: item.Schedulenumber
        }));
        return scheduleNumbers;
    } catch (error) {
        console.error('Error in fetchScheduleNumber:', error);
        throw error;
    }
}

async function fetchScheduleLineNumber(UnitCode, AddressCode, ScheduleNumber) {
    // Replace hyphens with slashes in ScheduleNumber
    const formattedScheduleNumber = ScheduleNumber.replace(/-/g, '/');
    try {
        const response = await axios.get(`https://imperialauto.co:84/IAIAPI.asmx/GetScheduleLineNumber?UnitCode='${UnitCode}'&AddressCode='${AddressCode}'&ScheduleNumber='${formattedScheduleNumber}'&RequestBy='Manikandan'`, {
            headers: {
                'Authorization': 'Bearer IncMpsaotdlKHYyyfGiVDg==',
                'Content-Type': 'application/json'
            }
        });
        const scheduleLineNumbers = JSON.parse(response.data.d).map(item => ({
            Schedulelinenumber: item.Schedulelinenumber
        }));
        return scheduleLineNumbers;
    } catch (error) {
        console.error('Error in fetchScheduleLineNumber:', error);
        throw error;
    }
}


