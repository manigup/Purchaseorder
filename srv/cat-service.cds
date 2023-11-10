using my.bookshop as my from '../db/data-model';

type PurchaseMaterialQuantityInfo {
    RowNum: Integer;
    DeliveryDate: DateTime;
    DeliveryQuantity: Integer;
};

service CatalogService {
    entity PurchaseOrders as projection on my.PurchaseOrders;
    entity DocumentRowItems as projection on my.DocumentRowItems;
    entity ASNItems as projection on my.ASNItems;
    entity ASNList as projection on my.ASNList;
    entity ASNListHeader as projection on my.ASNListHeader;

    function getPurchaseMaterialQuantityList(UnitCode:String, PoNum: String, MaterialCode: String) returns array of PurchaseMaterialQuantityInfo;
}