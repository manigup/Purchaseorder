using my.bookshop as my from '../db/data-model';

service CatalogService {
    entity PurchaseOrders as projection on my.PurchaseOrders;
    entity DocumentRowItems as projection on my.DocumentRowItems;
}
