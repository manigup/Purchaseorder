namespace my.bookshop;

using {
  cuid,
  managed
} from '@sap/cds/common';

entity PurchaseOrders {
  key PoNum         : String;
      PoDate        : Date;
      VendorCode    : String;
      VendorName    : String;
      PlantCode     : String;
      PlantName     : String;
      ValidFrom     : String;
      ValidTo       : String;
      HasAttachments: String;
      DocumentRows  : Composition of many DocumentRowItems
                        on DocumentRows.PNum = $self;
      asnList       : Composition of many ASNList
                        on asnList.PNum = $self;
      asnListHeader : Composition of many ASNList
                        on asnListHeader.PNum = $self;
      Files         : Composition of many Files on Files.PNum = $self;
}

entity DocumentRowItems {
  key UUID          : UUID;
      LineNum       : String;
      ItemCode      : String;
      ItemDesc      : String;
      HSNCode       : String;
      PoQty         : Integer;
      DeliveredQty  : Decimal;
      BalanceQty    : Decimal;
      UnitPrice     : Decimal;
      UOM           : String;
      Currency      : String;
      Status        : String;
      ASSValue      : String;
      Packing       : String;
      Frieght       : String;
      OtherCharges  : String;
      TCS           : String;
      SGST          : String;
      SGA           : String;
      CGST          : String;
      CGA           : String;
      IGST          : String;
      IGA           : String;
      TOTAL         : String;
      TCA           : String;
      LineValue     : String;
      WeightInKG    : String;
      PNum          : Association to PurchaseOrders;
}

entity ASNList {
  key UUID          : UUID;
      PNum          : Association to PurchaseOrders;
      ItemCode      : String;
      ItemDesc      : String;
      LineNum       : String;
      PoDate       : Date;
      UOM           : String;
      HSNCode       : String;
      UnitPrice     : String;
      BalanceQty    : String;
      DeliveredQty  : Decimal;
      ASSValue      : String;
      PFA           : String;
      FFC           : String;
      OT1           : String;
      IGP           : String;
      IGA           : String;
      CGP           : String;
      CGA           : String;
      SGP           : String;
      SGA           : String;
      UGP           : String;
      UGA           : String;
      Packaging     : String;
      WeightPerKG   : String;
      LineValue     : String;
      TCS           : String;
      TCA           : String;
      Currency      : String;
      Status        : String;
      ConfirmStatus : String;
      PlantCode     : String;
      PlantName     : String;
      PoQty         : Integer;
      VendorCode    : String;
      VendorName    : String;
}

entity ASNListHeader {
  key PNum               : Association to PurchaseOrders;
      AsnNum             : String;
      BillNumber         : String;
      BillDate           : String;
      DocketNumber       : String;
      GRDate             : String;
      TransportName      : String;
      TransportMode      : String;
      EwayBillNumber     : String;
      EwayBillDate       : String;
      MillNumber         : String;
      MillName           : String;
      PDIRNumber         : String;
      HeatNumber         : String;
      BatchNumber        : String;
      ManufacturingMonth : String;
      PlantName          : String;
      PlantCode          : String;
      VendorCode         : String;
}

entity Files : managed{
  key PNum : Association to PurchaseOrders;
  @Core.MediaType: mediaType
  content: LargeBinary;
  
  @Core.ContentDisposition.Filename: fileName
  @Core.IsMediaType: true
  mediaType: String;
  fileName: String;
  size: Integer;
  url: String;
}
