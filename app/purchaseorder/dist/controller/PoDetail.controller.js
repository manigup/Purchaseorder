sap.ui.define(["sap/ui/core/mvc/Controller","sap/m/MessageBox","sap/ui/model/json/JSONModel","sap/ui/model/Filter","sap/ui/model/FilterOperator"],function(e,t,o,i,s){"use strict";return e.extend("sp.fiori.purchaseorder.controller.PoDetail",{onInit:function(){this.fragModel=new sap.ui.model.json.JSONModel;this.getView().setModel(this.fragModel,"fragModel");this.oDataModel=sap.ui.getCore().getModel("oDataModel");this.flagModel=sap.ui.getCore().getModel("flagModel");this.getView().setModel(this.oDataModel);this.router=sap.ui.core.UIComponent.getRouterFor(this);this.router.attachRouteMatched(this.handleRouteMatched,this);this.detailHeaderModel=new sap.ui.model.json.JSONModel;this.detailHeaderModel.setSizeLimit(1e3);this.getView().setModel(this.detailHeaderModel,"detailHeaderModel");this.detailModel=new sap.ui.model.json.JSONModel;this.detailModel.setSizeLimit(1e3);this.getView().setModel(this.detailModel,"detailModel");this.materialDescModel=new sap.ui.model.json.JSONModel;this.materialDescModel.setSizeLimit(1e3);this.getView().setModel(this.materialDescModel,"materialDescModel");this.popOverModel=new sap.ui.model.json.JSONModel;this.detailAmountPopoverModel=new sap.ui.model.json.JSONModel;this.ConfirmFragModel=new sap.ui.model.json.JSONModel;this.getView().addStyleClass("sapUiSizeCompact");this.tblTemp=this.byId("invListTmp").clone()},handleRouteMatched:function(e){if(e.getParameter("name")==="PoDetail"){var o=this;var i=this.getOwnerComponent().getModel();var s=e.getParameter("arguments").Po_No;this.Po_Num=s.replace(/-/g,"/");this.unitCode=e.getParameter("arguments").UnitCode||"P01";this.AddressCodePO=sessionStorage.getItem("AddressCodePO")||"JSE-01-01";var a="/PurchaseOrders";i.read(a,{urlParameters:{$expand:"DocumentRows",AddressCode:this.AddressCodePO,UnitCode:this.unitCode},success:function(e){var i=e.results.find(e=>e.PoNum===o.Po_Num);if(i){o.detailHeaderModel.setData(i);o.detailHeaderModel.refresh(true);o.detailModel.setData(i.DocumentRows.results);o.detailModel.refresh(true);var s=o.getView().getModel("detailModel").getData();for(var a=0;a<s.length;a++){if(s[a].DeliveredQty==="0"){s[a].ConfirmStatus="Open"}else if(s[a].DeliveredQty===s[a].PoQty){s[a].ConfirmStatus="Closed"}else if(s[a].DeliveredQty>"0"&&s[a].DeliveredQty<s[a].PoQty){s[a].ConfirmStatus="Partially"}}o.detailModel.refresh(true)}else{t.error("Purchase order not found")}},error:function(e){var o=JSON.parse(e.response.body);t.error(o.error.message.value)}});this.getInvoiceList()}},getInvoiceList:function(){this.byId("invList").bindAggregation("items",{path:"/InvHeaderList",template:this.tblTemp})},onMaterialPress:function(e){var t=this;var i=e.getSource().getParent().getBindingContext("detailModel").getObject();var s=[];s.push(i);if(!this._oPopoverFragment){this._oPopoverFragment=sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.DetailPopoverFragment",this);this.TableTempId=sap.ui.getCore().byId("TableTempId").clone();this.getView().addDependent(this._oPopoverFragment)}this._oPopoverFragment.setModel(new o(s),"materialDescModel");this._oPopoverFragment.openBy(e.getSource())},onCreateAsn:function(){sap.ui.core.BusyIndicator.show(0);var e=this;var t=e.Po_Num.replace(/\//g,"-");this.router.navTo("PoAsnCreate",{Po_No:t,UnitCode:this.unitCode,Amount:e.detailModel.getData().Amount})},onChkBoxSelect:function(e){if(!e.getParameter("selected")){this.checkCount--}else{this.checkCount++}this.getView().byId("chkBoxSelectAll").setSelected(false);if(this.checkCount==this.enabledCount){this.getView().byId("chkBoxSelectAll").setSelected(true)}},selectAllCheck:function(e){var t=this;var o=e.getParameter("selected");var i=this.detailModel.getData();var s=i.headertoitemNav.results;this.checkCount=0;for(var a=0;a<s.length;a++){if(o){this.isSelected=s[a].Confirm_Status;if(this.isSelected=="Not Confirmed"){s[a].Item_indicator=true;this.checkCount++}}else{s[a].Item_indicator=false}}i.headertoitemNav.results=s;this.detailModel.setData(i);this.detailModel.refresh(true)},onCofirmAsn:function(e){sap.ui.core.BusyIndicator.show(0);this.router.navTo("PoConfirmation",{Po_No:this.Po_Num})},onFragClose:function(e){e.getSource().getParent().close()},onItempress:function(e){var t=e.getParameter("listItem").getBindingContext("detailModel").getObject();var o=t.PNum_PoNum;var i=o.replace(/\//g,"-");this.router.navTo("POItemDetails",{Po_No:i,Item_No:t.ItemCode,Line_Num:t.LineNum})}})});