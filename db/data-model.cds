namespace my.bookshop;

entity PurchaseOrders {
  key PoNum        : String;
      PoDate       : Date;
      VendorName   : String;
      VendorCode   : String;
      PlantCode    : String;
      PlantName    : String;
      DocumentRows : Composition of many DocumentRowItems
                       on DocumentRows.PNum = $self;
//asnItems: Composition of many ASNItems on asnItems.PO_Reference = $self;
}

entity DocumentRowItems {
  key UUID         : UUID;
      PoDate       : Date;
      VendorName   : String;
      VendorCode   : String;
      PlantCode    : String;
      PlantName    : String;
      LineNum      : Integer;
      ItemCode     : String;
      ItemDesc     : String;
      HSNCode      : String;
      PoQty        : Integer;
      DeliveredQty : Decimal;
      BalanceQty   : Decimal;
      UnitPrice    : Decimal;
      PNum         : Association to PurchaseOrders;
}

/*
entity ASNItems {
  key ASN_ID : String;
  PO_Reference : Association to PurchaseOrders;
  ItemNo : Integer;
  Schedulingline: Integer;
  Material: String;
  ShipmentDate: DateTime;
  MaterialExpiryDate: DateTime;
  POQty: Integer;
  ConfQty: Integer;
  DeliveredQty: Integer;
  ASNCreated: Integer;
  AvlASNQty: Integer;
  NetPrice: Decimal;
  SupplierNetPrice: Decimal;
  TaxMismatch: Boolean;
  PackingMaterialType: String;
  PackingMaterialQty: Integer;
  SPQ: Decimal;
}
*/
