sap.ui.define(["sap/ui/core/mvc/Controller","sap/m/MessageBox","sp/fiori/purchaseorder/controller/formatter","sap/ui/export/Spreadsheet"],function(e,t,a,r){"use strict";return e.extend("sp.fiori.purchaseorder.controller.PoConfirmation",{formatter:a,onInit:function(){this.fragModel=new sap.ui.model.json.JSONModel;this.getView().setModel(this.fragModel,"fragModel");this.oDataModel=sap.ui.getCore().getModel("oDataModel");this.flagModel=sap.ui.getCore().getModel("flagModel");this.getView().setModel(this.oDataModel);this.oTableColumnModel=new sap.ui.model.json.JSONModel("model/TableColumn.json");this.getView().setModel(this.oTableColumnModel,"TableColumn");this.router=sap.ui.core.UIComponent.getRouterFor(this);this.router.attachRouteMatched(this.handleRouteMatched,this);this.detailModel=new sap.ui.model.json.JSONModel;this.getView().setModel(this.detailModel,"detailModel");this.headerModel=new sap.ui.model.json.JSONModel;this.getView().setModel(this.headerModel,"headerModel");this.popOverModel=new sap.ui.model.json.JSONModel;this.detailAmountPopoverModel=new sap.ui.model.json.JSONModel;this.ConfirmFragModel=new sap.ui.model.json.JSONModel;this.getView().addStyleClass("sapUiSizeCompact")},onNavBack:function(){this.router.navTo("PoMaster")},handleRouteMatched:function(e){if(e.getParameter("name")==="PoConfirmation"){var a=this;this.getView().byId("DeliveryTableId").removeSelections(true);this.Po_Num=e.getParameter("arguments").Po_No;var r="/PO_HEADERSet(Po_No='"+this.Po_Num+"',Vendor_No='')";this.oDataModel.read(r,null,null,false,function(e){sap.ui.core.BusyIndicator.hide();a.odata=e;a.headerModel.setData(e);a.headerModel.refresh(true)},function(e){sap.ui.core.BusyIndicator.hide();var a=JSON.parse(e.response.body);t.error(a.error.message.value)});sap.ui.core.BusyIndicator.show(0);this.oDataModel.read("/PoConfirmSet?$filter= Po_No eq '"+this.Po_Num+"'",null,null,false,function(e){sap.ui.core.BusyIndicator.hide();a.odata=e;a.detailModel.setData(e);a.detailModel.refresh(true)},function(e){sap.ui.core.BusyIndicator.hide();var r=JSON.parse(e.response.body);t.error(r.error.message.value);a.router.navTo("PoDetail",{Po_No:a.Po_Num})})}},checkDisableItem:function(e){var t=e.results.length,a=false;for(var r=0;r<t;r++){if(e.results[r].DisableInd_1!=="X"||e.results[r].DisableInd_2!=="X"||e.results[r].DisableInd_3!=="X"||e.results[r].DisableInd_4!=="X"||e.results[r].DisableInd_5!=="X"||e.results[r].DisableInd_6!=="X"||e.results[r].DisableInd_7!=="X"){a=true}}if(a){this.getView().byId("submitBtnId").setEnabled(true)}else{this.getView().byId("submitBtnId").setEnabled(false)}},radioButtonSelect:function(e){sap.ui.core.BusyIndicator.show(0);var a=this;var r=e.getParameter("selectedIndex")+1;var o="/PO_SCH_CONFSet?$filter= Po_No eq '"+this.Po_Num+"' and Item_No eq '' and Vendor_No eq '' and Material_No eq '' and Material_Desc eq '' and WeekIndicator eq '"+r+"' ";this.oDataModel.read(o,null,null,false,function(e){sap.ui.core.BusyIndicator.hide();a.odata=e;a.detailModel.setData(e);a.detailModel.refresh(true)},function(e){sap.ui.core.BusyIndicator.hide();var a=JSON.parse(e.response.body);t.error(a.error.message.value)});this.checkDisableItem(a.odata);var i=a.getView().getModel("TableColumn"),s=i.getData();var n={};try{n=a.detailModel.getData().results[0]}catch(e){}s.Col_1=this.dateFormat(n.Del_Date1);s.Col_2=this.dateFormat(n.Del_Date2);s.Col_3=this.dateFormat(n.Del_Date3);s.Col_4=this.dateFormat(n.Del_Date4);s.Col_5=this.dateFormat(n.Del_Date5);s.Col_6=this.dateFormat(n.Del_Date6);s.Col_7=this.dateFormat(n.Del_Date7);i.setData(s);i.refresh(true)},dateFormat:function(e){if(e!==""&&e!==null&&e!==undefined){var t=e.substring(4,6)+"/"+e.substring(6,8)+"/"+e.substring(0,4);var a=new Date(t);var r=sap.ui.core.format.DateFormat.getDateInstance({pattern:"dd MMM"});return r.format(a)}return""},onCreateAsn:function(){sap.ui.core.BusyIndicator.show(0);var e=this;this.router.navTo("PoAsnCreate",{Po_No:e.Po_Num,Amount:e.detailModel.getData().Amount})},sumOfDaysValue:function(e){var t=e.getSource().getParent().getBindingContext("detailModel").getPath().split("/")[2];var a=this.detailModel.getData().results[t];if(a.Col_1===""){a.Col_1="0"}if(a.Col_2===""){a.Col_2="0"}if(a.Col_3===""){a.Col_3="0"}if(a.Col_4===""){a.Col_4="0"}if(a.Col_5===""){a.Col_5="0"}if(a.Col_6===""){a.Col_6="0"}if(a.Col_7===""){a.Col_7="0"}this.detailModel.getData().results[t].WeekTotal=(parseFloat(a.Col_1)+parseFloat(a.Col_2)+parseFloat(a.Col_3)+parseFloat(a.Col_4)+parseFloat(a.Col_5)+parseFloat(a.Col_6)+parseFloat(a.Col_7)).toString();this.detailModel.refresh(true)},onChkBoxSelect:function(e){if(!e.getParameter("selected")){this.checkCount--;var t=parseInt(e.getSource().getParent().getBindingContext("detailModel").getPath().split("/")[2])+1;this.detailModel.getData().results[t].Item_indicator=false;this.detailModel.refresh(true)}else{this.checkCount++;var t=parseInt(e.getSource().getParent().getBindingContext("detailModel").getPath().split("/")[2])+1;this.detailModel.getData().results[t].Item_indicator=true;this.detailModel.refresh(true)}this.getView().byId("chkBoxSelectAll").setSelected(false);var a=0;try{a=this.detailModel.getData().results.length/2}catch(e){}if(this.checkCount>=a){this.getView().byId("chkBoxSelectAll").setSelected(true)}},selectAllCheck:function(e){var t=this;var a=e.getParameter("selected");var r=this.detailModel.getData();var o=r.results;this.checkCount=0;for(var i=0;i<o.length;i++){if(a){o[i].Item_indicator=true;this.checkCount++}else{o[i].Item_indicator=false}}r.results=o;this.detailModel.setData(r);this.detailModel.refresh(true)},onCofirmAsn:function(e){sap.ui.core.BusyIndicator.show(0);var a=this;this.detailModel.refresh(true);this.data=this.headerModel.getData();this.tableData=this.detailModel.getData().results;var r=this.getView().byId("DeliveryTableId");var o=r.getSelectedContexts();var i={Amount:this.data.Amount,Buyer_Name:this.data.Buyer_Name,Currency:this.data.Currency,Item_Count:this.data.Item_Count,Order_Type:this.data.Order_Type,Order_Type_Desc:this.data.Order_Type_Desc,Po_Date:this.data.Po_Date,Po_No:this.data.Po_No,Purchase_Group:this.data.Purchase_Group,Purchase_Group_Desc:this.data.Purchase_Group_Desc,Purchase_Org:this.data.Purchase_Org,Purchase_Org_Desc:this.data.Purchase_Org_Desc,Status:this.data.Status,Upcoming_Del_Date:this.data.Upcoming_Del_Date,Vendor_Name:this.data.Vendor_Name,Vendor_No:this.data.Vendor_No,headertoitemNav:[],headertoschconfNav:[],headertopoconfirmnav:[]};if(o){var s=o.map(function(e){return e.getObject()});if(s.length){for(var n=0;n<s.length;n++){var l=parseFloat(s[n].Del_Quantity);if(l===0){sap.m.MessageBox.error("Quantity can't be Zero");sap.ui.core.BusyIndicator.hide();return}if(l<0||s[n].Del_Quantity.includes("-")){sap.m.MessageBox.error("Quantity can't be in negative.");sap.ui.core.BusyIndicator.hide();return}var d=new Date(s[n].ShipDate.substring(0,4)+"-"+s[n].ShipDate.substring(4,6)+"-"+s[n].ShipDate.substring(6,8));d=d.setHours(0,0,0,0);var u=(new Date).setHours(0,0,0,0);if(d<u){t.error("Please enter current date or future date");sap.ui.core.BusyIndicator.hide();return}if(s[n].Del_Quantity&&s[n].Conf_Date){if(parseInt(s[n].Del_Quantity)<=parseInt(s[n].PO_Quantity)-parseInt(s[n].Conf_Quantity)){i.headertopoconfirmnav.push(s[n])}else{t.error("Quantity to be confirmed is greater than the balance quantity for "+s[n].Material_Desc);sap.ui.core.BusyIndicator.hide();return}}else{t.error("Quantity and Confirmation date is required for selected items");sap.ui.core.BusyIndicator.hide();return}}}}if(i.headertopoconfirmnav.length<=0){t.error("No PO Items Selected");sap.ui.core.BusyIndicator.hide()}else{t.confirm("Do You Want to Confirm ? ",{actions:[sap.m.MessageBox.Action.OK,sap.m.MessageBox.Action.CLOSE],onClose:function(e){if(e==="OK"){sap.ui.core.BusyIndicator.show(5e3);a.oDataModel.create("/PO_HEADERSet",i,null,function(e){t.confirm("Successfully Confirmed!",{icon:sap.m.MessageBox.Icon.SUCCESS,title:"SUCCESS",actions:[sap.m.MessageBox.Action.OK,sap.m.MessageBox.Action.CLOSE],onClose:function(e){if(e==="OK"){sap.ui.core.BusyIndicator.hide();r.removeSelections();var t=a.flagModel.getData();t.confirmPressFlag=true;a.flagModel.refresh(true);sp.fiori.purchaseorder.controller.formatter.onNavBack()}else if(e==="CLOSE"){sap.ui.core.BusyIndicator.hide();sp.fiori.purchaseorder.controller.formatter.onNavBack()}}})},function(e){sap.ui.core.BusyIndicator.hide();try{var t=jQuery.parseJSON(e.response.body);if(t.error.innererror.errordetails.length>0){a.FragConfirmResponse=sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoConfirmResponse",this);a.getView().addDependent(a.FragConfirmResponse);var r=t.error.innererror.errordetails.length;t.error.innererror.errordetails.splice(r-1,1);a.ConfirmFragModel.setData(t.error.innererror);a.ConfirmFragModel.refresh(true);a.FragConfirmResponse.setModel(a.ConfirmFragModel,"errorModel");var o=new sap.m.Dialog({title:"Error",content:a.FragConfirmResponse,Draggable:true,buttons:[new sap.m.Button({text:"Close",press:function(){o.close()}})],afterClose:function(){o.destroy()}});o.open()}}catch(e){sap.ui.core.BusyIndicator.hide()}})}else{sap.ui.core.BusyIndicator.hide()}}})}},onFragClose:function(e){e.getSource().getParent().close()},onQuantityPress:function(e){var a=this;var r=e.getSource().getBindingContext("detailModel").getProperty("Item_No");var o="R";var i="/PoScheduleSet?$filter= Ebeln eq '"+this.Po_Num+"' and Ebelp eq '"+r+"' and Type eq '"+o+"'";this.oDataModel.read(i,null,null,false,function(e){a.fragModel.setData(e);a.fragModel.refresh(true)},function(e){var a=JSON.parse(e.response.body);t.error(a.error.message.value);return});var s=sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoFragRequiredQuan",this);this.getView().addDependent(s);s.setModel(this.oDataModel);s.setModel(this.fragModel,"fragModel");var n=new sap.m.Dialog({title:"Schedule",content:s,Draggable:true,buttons:[new sap.m.Button({text:"Cancel",press:function(){n.close()}})],afterClose:function(){n.destroy()}});n.open()},onAmountPress:function(e){if(!this.QuantAmount){this.QuantAmount=sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoAmountFrag",this);this.getView().addDependent(this.QuantAmount)}var t=e.getSource().getBindingContext("detailModel").sPath;var a=this.detailModel.getProperty(t);this.detailAmountPopoverModel.setData(a);this.QuantAmount.setModel(this.detailAmountPopoverModel);this.QuantAmount.openBy(e.getSource())},onQtyLiveChange:function(e){if(e.getParameter("newValue").includes(".")){t.error("Fractional Values are not allowed");e.getSource().setValue(parseInt(e.getParameter("newValue"),10).toString());return}},onTableFinished:function(e){var t=this.getView().byId("DeliveryTableId").getItems();for(var a=0;a<t.length;a++){var r=t[a]}},onDateChanged:function(e){var t=e.getSource();t.$().find("INPUT").attr("disabled",true).css("color","#000000")},onDateFilter:function(e){var a=this.byId("FromDateId").getValue();var r=this.byId("ToDateId").getValue();var o=this.getView().byId("DeliveryTableId").getBinding("items");if(a||r){var i=new sap.ui.model.Filter({filters:[new sap.ui.model.Filter({path:"ShipDate",operator:sap.ui.model.FilterOperator.LE,value1:r}),new sap.ui.model.Filter({path:"ShipDate",operator:sap.ui.model.FilterOperator.GE,value1:a})],and:true});o.filter(i)}else{t.error("No Dates are Selected")}},onDateFilterClear:function(e){this.byId("FromDateId").setValue("");this.byId("ToDateId").setValue("");this.getView().byId("DeliveryTableId").getBinding("items").filter([])},onMaterialLiveChange:function(e){var t=e.getParameter("newValue")||e.getParameter("query")||"";var a=[];if(t){a.push(new sap.ui.model.Filter("Material_No",sap.ui.model.FilterOperator.Contains,t));a.push(new sap.ui.model.Filter("Material_Desc",sap.ui.model.FilterOperator.Contains,t))}else{a.push(new sap.ui.model.Filter("Material_No",sap.ui.model.FilterOperator.EQ,""));a.push(new sap.ui.model.Filter("Material_Desc",sap.ui.model.FilterOperator.Contains,""))}this.byId("DeliveryTableId").getBinding("items").filter(new sap.ui.model.Filter({filters:a}))},onExportPress:function(){var e=this.getView().getModel("detailModel").getData().results;this.filename="PO.xlsx";if(e.length>0){let t=[],a,o,i="{0}";const s=this.byId("DeliveryTableId").getItems()[0];this.byId("DeliveryTableId").getColumns().forEach((e,r)=>{if(e.getAggregation("header")){a=s.getAggregation("cells")[r];switch(a.getMetadata().getName()){case"sap.m.ObjectIdentifier":o=[a.getBindingInfo("title").parts[0].path];i="{0}";break;case"sap.m.ObjectNumber":o=a.getBindingInfo("number").parts[0].path;break;case"sap.m.Input":o=a.getBindingInfo("value").parts[0].path;break;case"sap.m.DatePicker":o=a.getBindingInfo("value").parts[0].path;break;case"sap.m.Button":break;default:o=a.getBindingInfo("text").parts[0].path;break}t.push({label:e.getAggregation("header").getText(),property:o,template:i})}});const n=new r({workbook:{columns:t},dataSource:e,fileName:this.filename});n.build().finally(()=>n.destroy())}else MessageToast.show("No data to export")}})});