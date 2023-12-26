namespace my.bookshop;

entity PurchaseOrders {
  key PoNum         : String;
      PoDate        : Date;
      VendorCode    : String;
      VendorName    : String;
      PlantCode     : String;
      PlantName     : String;
      ValidFrom     : String;
      ValidTo       : String;
      DocumentRows  : Composition of many DocumentRowItems
                        on DocumentRows.PNum = $self;
      asnList       : Composition of many ASNList
                        on asnList.PNum = $self;
      asnListHeader : Composition of many ASNList
                        on asnListHeader.PNum = $self;
}

entity DocumentRowItems {
  key UUID          : UUID;
      PoDate        : Date;
      VendorName    : String;
      VendorCode    : String;
      PlantCode     : String;
      PlantName     : String;
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
      ConfirmStatus : String;
      ASSValue      : String;
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
      Attachment         : LargeBinary;
      @Core.ContentDisposition.Filename: AttachmentName
      AttachmentName     : String; // Original filename of the attachment
      HasAttachment      : Boolean default false;
}
