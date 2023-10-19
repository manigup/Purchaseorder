using my.bookshop as my from '../db/data-model';

type PurchaseMaterialQuantityInfo {
    RowNum: Integer;
    DeliveryDate: DateTime;
    DeliveryQuantity: Integer;
};

service CatalogService {
    entity PurchaseOrders as projection on my.PurchaseOrders;
    entity DocumentRowItems as projection on my.DocumentRowItems;

    function getPurchaseMaterialQuantityList(UnitCode:String, PoNum: String, MaterialCode: String) returns array of PurchaseMaterialQuantityInfo;
}