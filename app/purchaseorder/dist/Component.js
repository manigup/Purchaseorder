sap.ui.define(["sap/ui/core/UIComponent","sp/fiori/purchaseorder/model/models","sap/m/MessageBox","sap/ui/core/routing/HashChanger","sap/ui/model/odata/ODataModel","sp/fiori/purchaseorder/controller/formatter"],function(e,a,t,r,s){"use strict";return e.extend("sp.fiori.purchaseorder.Component",{metadata:{manifest:"json"},init:function(){e.prototype.init.apply(this,arguments);var o=window.location.href.includes("site")?"/":"";var i=jQuery.sap.getModulePath("sp/fiori/purchaseorder");i=i==="."?"":i;var d=i+o+this.getMetadata().getManifestEntry("sap.app").dataSources.mainService.uri;var n=new s(d,true);var l=new sap.ui.model.json.JSONModel({confirmPressFlag:false});this.setModel(l,"flagModel");sap.ui.getCore().setModel(l,"flagModel");n.attachMetadataFailed(e=>{var a=e.getParameter("response").body;if(a.indexOf("<?xml")!==-1){t.error($($.parseXML(a)).find("message").text())}else{t.error(a)}});n.attachMetadataLoaded(()=>{this.setModel(n);sap.ui.getCore().setModel(n,"oDataModel");n.setDefaultCountMode("None")});n.attachRequestFailed(e=>{var a=e.getParameter("responseText");if(a.indexOf("<?xml")!==-1){t.error($($.parseXML(a)).find("message").text())}else{t.error(JSON.parse(a).error.message.value)}});r.getInstance().replaceHash("");this.getRouter().initialize();this.setModel(a.createDeviceModel(),"device")}})});