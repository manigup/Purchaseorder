const cds = require('@sap/cds');
// const axios = require('axios');

module.exports = (srv) => {

    const { PurchaseOrders, ASNListHeader, DocumentRowItems, InvHeaderList } = srv.entities;

    srv.on("stageDocumentRows", async function (req) {

        const parseData = JSON.parse(req.data.data);
        let sInsertQuery = UPSERT.into(DocumentRowItems).entries(parseData);
        await cds.tx(req).run(sInsertQuery).catch((err) => {
            req.reject(500, err.message);
        });
    });

    srv.on("stageInvHeaderList", async function (req) {

        const parseData = JSON.parse(req.data.data);
        let sInsertQuery = UPSERT.into(InvHeaderList).entries(parseData);
        await cds.tx(req).run(sInsertQuery).catch((err) => {
            req.reject(500, err.message);
        });
    });

    srv.before('CREATE', 'ASNListHeader', async (req) => {

        const records = await cds.run(cds.parse.cql("Select BillNumber from my.purchaseorder.ASNListHeader")),
            duplicate = records.filter(item => item.BillNumber === req.data.BillNumber);

        if (duplicate.length > 0) {
            req.reject(400, 'Duplicate invoice number');
        }
    });

    srv.on('READ', PurchaseOrders, async (req) => {
        const { AddressCode, UnitCode } = req._queryOptions;
        const Po_Num = req._queryOptions.Po_Num || "";
        const results = await getPurchaseOrders(AddressCode, Po_Num, ASNListHeader, DocumentRowItems, UnitCode, req.headers.loginid);
        if (results.error) req.reject(500, results.error);

        const expandDocumentRows = req.query.SELECT.columns && req.query.SELECT.columns.some(({ expand, ref }) => expand && ref[0] === "DocumentRows");
        if (expandDocumentRows) {
            results.purchaseOrders.forEach(po => {
                po.DocumentRows = results.documentRows.filter(dr => dr.PNum_PoNum === po.PoNum);
            });
        }

        // Checking for search parameter
        const searchVal = req._queryOptions && req._queryOptions.$search;
        if (searchVal) {
            let cleanedSearchVal = searchVal.trim().replace(/"/g, '');
            if (cleanedSearchVal === 'Invoice Submitted' || cleanedSearchVal === 'Invoice Submission Pending') {
                results.purchaseOrders = results.purchaseOrders.filter(po =>
                    (po.HasAttachments === cleanedSearchVal)
                );
            } else {
                results.purchaseOrders = results.purchaseOrders.filter(po =>
                    po.PoNum.includes(cleanedSearchVal)
                );
            }
        }

        return results.purchaseOrders;
    });

    srv.on('getPurchaseMaterialQuantityList', async (req) => {
        const { UnitCode, PoNum, MaterialCode, PoLineNum } = req.data;
        // Replace '-' with '/' for PoNum
        const formattedPoNum = PoNum.replace(/-/g, '/');
        return getPurchaseMaterialQuantityList(UnitCode, formattedPoNum, MaterialCode, PoLineNum, req.headers.loginid)
    });
    /*
        srv.before('CREATE', 'Files', async(req) => {
            req.data.url = `/v2/odata/v4/catalog/Files(PNum_PoNum='${req.data.PNum_PoNum}')/content`
        })
    */
    // srv.on('GetScheduleNumber', async (req) => {
    //     const { UnitCode, AddressCode } = req.data;

    //     try {
    //         const scheduleNumber = await fetchScheduleNumber(UnitCode, AddressCode);
    //         return scheduleNumber;
    //     } catch (error) {
    //         console.error('Error in GetScheduleNumber:', error);
    //         throw new Error('Failed to retrieve schedule number.');
    //     }
    // });

    // srv.on('GetScheduleLineNumber', async (req) => {
    //     const { UnitCode, AddressCode, ScheduleNumber } = req.data;

    //     try {
    //         const scheduleLineNumber = await fetchScheduleLineNumber(UnitCode, AddressCode, ScheduleNumber);
    //         return scheduleLineNumber;
    //     } catch (error) {
    //         console.error('Error in GetScheduleLineNumber:', error);
    //         throw new Error('Failed to retrieve schedule line number.');
    //     }
    // });

    //GetTransportModeListAPI
    srv.on('GetTransportModeList', async (req) => {
        return GetTransportModeList(req.user.id)
    });

    // srv.on('PostASN', async (req) => {
    //     const asnDataString = req.data.asnData;
    //     const asnDataParsed = JSON.parse(asnDataString);
    //     const asnDataFormatted = JSON.stringify(asnDataParsed, null, 2);
    //     try {
    //         const response = await postASN(asnDataFormatted);
    //         return response;
    //     } catch (error) {
    //         console.error('Error in PostASN API call:', error);
    //         throw new Error(`Error posting ASN: ${error.message}`);
    //     }
    // });
};

async function getPurchaseOrders(AddressCode, Po_Num, ASNListHeader, DocumentRowItems, UnitCode, user) {
    try {
        const token = await generateToken(user),
            legApi = await cds.connect.to('Legacy'),
            response = await legApi.send({
                query: `GET GetPurchaseMaterialList?AddressCode='${AddressCode}'&UnitCode='${UnitCode}'&RequestBy='${user}'`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

        // const responseASN = await SELECT.from(ASNListHeader).columns('PNum_PoNum');
        const items = await SELECT.from(DocumentRowItems).columns('PNum_PoNum', 'InvBalQty', 'ItemCode');

        if (response.d) {
            const dataArray = JSON.parse(response.d);
            // const asnSet = new Set(responseASN.map(asn => asn.PNum_PoNum));
            let dbItems, findErpItemInDb, check, status = "Invoice Submission Pending";
            const purchaseOrders = dataArray.map(data => {
                // const hasMatchingASN = asnSet.has(data.PoNum.replace(/\//g, '-'));
                dbItems = items.filter(item => item.PNum_PoNum === data.PoNum);
                if (dbItems.length > 0) {
                    // erp items
                    check = [];
                    data.DocumentRows.forEach(erpItem => {
                        findErpItemInDb = dbItems.find(dbItem => dbItem.ItemCode === erpItem.ItemCode)
                        if (findErpItemInDb && findErpItemInDb.InvBalQty === 0) {
                            check.push(true);
                        } else {
                            check.push(false);
                        }
                    });
                    if (check.length > 0 && check.every(item => item === true)) status = "Invoice Submitted";
                }
                return {
                    PoNum: data.PoNum,
                    PoDate: data.PoDate,
                    VendorCode: data.VendorCode,
                    VendorName: data.VendorName,
                    PlantCode: data.PlantCode,
                    PlantName: data.PlantName,
                    ValidFrom: data.ValidFrom,
                    ValidTo: data.ValidTo,
                    HasAttachments: status,
                };
            });

            let itemRecord = [], filter, supplierRate, rateAgreed;
            if (Po_Num) {
                itemRecord = await SELECT.from(DocumentRowItems).where({ PNum_PoNum: Po_Num });
            }

            let poQty = 0, invBalQty = 0, invQty = 0;

            // Extracting DocumentRows details
            const documentRows = dataArray.flatMap(data =>
                data.DocumentRows.map(row => {

                    filter = itemRecord.filter(item => item.ItemCode === row.ItemCode);
                    if (filter.length > 0) {
                        rateAgreed = filter[0].RateAgreed;
                        supplierRate = filter[0].SupplierRate;
                    } else {
                        rateAgreed = true;
                        supplierRate = "";
                    }

                    if (Po_Num) {
                        poQty = parseInt(row.PoQty);
                        invQty = parseInt(filter[0]?.InvQty) || 0;
                        invBalQty = poQty - invQty;
                    }
                    return {
                        LineNum: row.LineNum,
                        ItemCode: row.ItemCode,
                        ItemDesc: row.ItemDesc,
                        HSNCode: row.HSNCode,
                        PoQty: poQty,
                        InvQty: invQty,
                        InvBalQty: invBalQty,
                        BalanceQty: parseFloat(row.BalanceQty),
                        DeliveredQty: parseFloat(row.DeliveredQty),
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
                        RateAgreed: rateAgreed,
                        SupplierRate: supplierRate,
                        PNum_PoNum: data.PoNum  // associating with the current PurchaseOrder
                    };
                })
            );

            return {
                purchaseOrders: purchaseOrders,
                documentRows: documentRows
            };
        } else {
            return {
                error: response.Result
            }
        }
    } catch (error) {
        console.error('Error in API call:', error);
        throw error;
    }
}

async function GetTransportModeList(user) {
    try {
        const token = await generateToken(user),
            legApi = await cds.connect.to('Legacy'),
            response = await legApi.send({
                query: `GET GetTransportModeList?RequestBy='${user}'`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

        const transportData = JSON.parse(response.d);
        return transportData.map(item => ({
            TransCode: item.TransportMode
        }));

    } catch (error) {
        console.error("Error fetching transport mode data:", error);
        throw new Error("Failed to fetch account data");
    }
}

async function getPurchaseMaterialQuantityList(UnitCode, PoNum, MaterialCode, PoLineNum, user) {
    try {
        const token = await generateToken(user),
            legApi = await cds.connect.to('Legacy'),
            response = await legApi.send({
                query: `GET GetPurchaseMaterialQuantityList?UnitCode='${UnitCode}'&PoNum='${PoNum}'&MaterialCode='${MaterialCode}'&PoLineNum='${PoLineNum}'&RequestBy='${user}'`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

        if (response.d) {
            return JSON.parse(response.d);
        } else {
            console.error('Error parsing response:', response.data);
            throw new Error('Error parsing the response from the API.');
        }
    } catch (error) {
        console.error('Error in getPurchaseMaterialQuantityList API call:', error);
        throw new Error('Unable to fetch Purchase Material Quantity List.');
    }
}

// async function postASN(asnData) {
//     try {
//         const token = await generateToken(user),
//             legApi = await cds.connect.to('Legacy'),
//             response = await legApi.send({
//                 query: `POST PostASN`,
//                 data: asnData,
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 },
//             });

//         if (response.d && response.d.SuccessCode) {
//             return "ASN Posted Successfully: " + response.d.Result;
//         } else {
//             throw new Error(response.d.ErrorDescription || 'Unknown error occurred');
//         }
//     } catch (error) {
//         console.error('Error in postASN:', error);
//         throw error;
//     }
// }

// async function fetchScheduleNumber(UnitCode, AddressCode) {
//     const formattedScheduleNumber = ScheduleNumber.replace(/-/g, '/');
//     try {
//         const response = await axios.get(`https://imperialauto.co:84/IAIAPI.asmx/GetScheduleNumber?UnitCode='${UnitCode}'&AddressCode='${formattedScheduleNumber}'&RequestBy='Manikandan'`, {
//             headers: {
//                 'Authorization': 'Bearer IncMpsaotdlKHYyyfGiVDg==',
//                 'Content-Type': 'application/json'
//             }
//         });

//         const scheduleNumbers = JSON.parse(response.data.d).map(item => ({
//             Schedulenumber: item.Schedulenumber
//         }));
//         return scheduleNumbers;
//     } catch (error) {
//         console.error('Error in fetchScheduleNumber:', error);
//         throw error;
//     }
// }

// async function fetchScheduleLineNumber(UnitCode, AddressCode, ScheduleNumber) {
//     // Replace hyphens with slashes in ScheduleNumber
//     const formattedScheduleNumber = ScheduleNumber.replace(/-/g, '/');
//     try {
//         const response = await axios.get(`https://imperialauto.co:84/IAIAPI.asmx/GetScheduleLineNumber?UnitCode='${UnitCode}'&AddressCode='${AddressCode}'&ScheduleNumber='${formattedScheduleNumber}'&RequestBy='Manikandan'`, {
//             headers: {
//                 'Authorization': 'Bearer IncMpsaotdlKHYyyfGiVDg==',
//                 'Content-Type': 'application/json'
//             }
//         });
//         const scheduleLineNumbers = JSON.parse(response.data.d).map(item => ({
//             Schedulelinenumber: item.Schedulelinenumber
//         }));
//         return scheduleLineNumbers;
//     } catch (error) {
//         console.error('Error in fetchScheduleLineNumber:', error);
//         throw error;
//     }
// }

async function generateToken(username) {
    try {
        const legApi = await cds.connect.to('Legacy'),
            response = await legApi.send({
                query: `POST GenerateToken`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "InputKey": username
                }
            });

        if (response.d) {
            return response.d;
        } else {
            console.error('Error parsing token response:', response.data);
            throw new Error('Error parsing the token response from the API.');
        }
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Unable to generate token.');
    }
}


