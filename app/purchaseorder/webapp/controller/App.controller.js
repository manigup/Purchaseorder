// sap.ui.define(
//     [
//         "sap/ui/core/mvc/Controller"
//     ],
//     function(BaseController) {
//       "use strict";
  
//       return BaseController.extend("sp.fiori.purchaseorder.controller.App", {
//         onInit() {
//         }
//       });
//     }
//   );
  sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/HashChanger"
  ], function (Controller, HashChanger) {
    "use strict";
  
    return Controller.extend("sp.fiori.purchaseorder.controller.App", {
  
      doRoute: function () {
        this.router = sap.ui.core.UIComponent.getRouterFor(this);
        /// when user redirects from the Asn app
        this.Component = this.getOwnerComponent().getComponentData();
        if (this.Component !== undefined && this.Component.startupParameters.PO_NO) {
          HashChanger.getInstance().replaceHash("");
          this.router.navTo("PoAsnEdit", {
            "Po_No": this.Component.startupParameters.PO_NO[0],
            "Asn_No": this.Component.startupParameters.ASN_NO[0],
            "Amount": this.Component.startupParameters.Amount[0]
          });
          this.router.initialize();
        } else {
          HashChanger.getInstance().replaceHash("");
          this.router.initialize();
        }
      },
      onInit: function () {
        // var site = window.location.href.includes("site");
        // if (site) {
        //   var slash = site ? "/" : "";
        //   var modulePath = jQuery.sap.getModulePath("sp/fiori/purchaseorder");
        //   modulePath = modulePath === "." ? "" : modulePath;
        //   $.ajax({
        //     url: modulePath + slash + "user-api/attributes",
        //     type: "GET",
        //     success: res => {
        //       const attributes = res,
        //         loginId = attributes.login_name[0],
        //         loginType = attributes.type[0].substring(0, 1).toUpperCase();
        //       sap.ui.getCore().getModel("oDataModel").setHeaders({
        //         "companycode": sessionStorage.getItem("compCode"),
        //         "loginId": loginId,
        //         "LoginType": loginType
        //       });
        //       this.doRoute();
        //     }
        //   });
        // } else {
        //   sap.ui.getCore().getModel("oDataModel").setHeaders({
        //     "companycode": "1000",
        //     "loginId": "401122",
        //     "LoginType": "P"
        //   });
        //   this.doRoute();
        // }
      }
  
     
  
    });
  
  });