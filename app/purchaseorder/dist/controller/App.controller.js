sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/core/routing/HashChanger"],function(e,t){"use strict";return e.extend("sp.fiori.purchaseorder.controller.App",{doRoute:function(){this.router=sap.ui.core.UIComponent.getRouterFor(this);this.Component=this.getOwnerComponent().getComponentData();if(this.Component!==undefined&&this.Component.startupParameters.PO_NO){t.getInstance().replaceHash("");this.router.navTo("PoAsnEdit",{Po_No:this.Component.startupParameters.PO_NO[0],Asn_No:this.Component.startupParameters.ASN_NO[0],Amount:this.Component.startupParameters.Amount[0]});this.router.initialize()}else{t.getInstance().replaceHash("");this.router.initialize()}},onInit:function(){var e=window.location.href.includes("site");if(e){var t=e?"/":"";var o=jQuery.sap.getModulePath("sp/fiori/purchaseorder");o=o==="."?"":o;$.ajax({url:o+t+"user-api/attributes",type:"GET",success:e=>{if(e.login_name[0]!==e.email){sessionStorage.setItem("AddressCodePO",e.login_name[0])}else{sessionStorage.setItem("AddressCodePO","JSE-01-01")}this.doRoute()}})}else{}}})});