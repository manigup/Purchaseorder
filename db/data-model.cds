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
      asnItems: Composition of many ASNItems on asnItems.CustomerReferenceNumber = $self;
      asnList: Composition of many ASNItems on asnList.CustomerReferenceNumber = $self;
      asnListHeader: Composition of many ASNItems on asnListHeader.CustomerReferenceNumber = $self;
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

entity ASNItems {
  CustomerReferenceNumber: Association to PurchaseOrders;
  ItemCode: String;
  TemRevNo: String;
  ItemUOM: String;
  HsnCode: String;
  AddressCode: String;
  ItemRate: String;
  BalanceQty: String;
  ASSValue: String;
  PFA: String;
  FFC: String;
  OT1: String;
  IGP: String;
  IGA: String;
  CGP: String;
  CGA: String;
  SGP: String;
  SGA: String;
  UGP: String;
  UGA: String;
  LineValue: String;
  TCS: String;
  TCA: String;
}

entity ASNList {
  key UUID: UUID;
  CustomerReferenceNumber: Association to PurchaseOrders;
  ItemCode: String;
  TemRevNo: String;
  ItemUOM: String;
  HsnCode: String;
  AddressCode: String;
  ItemRate: String;
  BalanceQty: String;
  ASSValue: String;
  PFA: String;
  FFC: String;
  OT1: String;
  IGP: String;
  IGA: String;
  CGP: String;
  CGA: String;
  SGP: String;
  SGA: String;
  UGP: String;
  UGA: String;
  LineValue: String;
  TCS: String;
  TCA: String;
}

entity ASNListHeader{
  key CustomerReferenceNumber: Association to PurchaseOrders;
  AsnNum: String;
  InvoiceAmt: String;
  InvoiceVal: String;
  InvoiceDate: String;
  InvoiceNum: String;
}