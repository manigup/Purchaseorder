using my.bookshop as my from '../db/data-model';

type PurchaseMaterialQuantityInfo {
    RowNum       : Integer;
    PONum        : String;
    ItemCode     : String;
    ItemDesc     : String;
    PoQty        : Integer;
    DeliveryQty  : Integer;
    DeliveryDate : String;
    Status       : String;
};

type ScheduleNumberType {
    Schedulenumber : String;
};

type ScheduleLineNumberType {
    Schedulelinenumber : String;
};


service CatalogService {
    entity PurchaseOrders   as projection on my.PurchaseOrders;
    entity DocumentRowItems as projection on my.DocumentRowItems;
    entity ASNList          as projection on my.ASNList;
    entity ASNListHeader    as projection on my.ASNListHeader;
    entity Files            as projection on my.Files;
    function getPurchaseMaterialQuantityList(UnitCode : String, PoNum : String, MaterialCode : String, PoLineNum : String) returns array of PurchaseMaterialQuantityInfo;
    function GetScheduleNumber(UnitCode : String, AddressCode : String)                                                    returns array of ScheduleNumberType;
    function GetScheduleLineNumber(UnitCode : String, AddressCode : String, ScheduleNumber : String)                       returns array of ScheduleLineNumberType;
    action   PostASN(asnData : String)                                                                                     returns String;
    action   stageDocumentRows(data : String)                                                                           returns String;
}
