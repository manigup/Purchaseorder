sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox"
], function (Controller, MessageBox) {
	"use strict";

	return Controller.extend("sp.fiori.purchaseorder.controller.PoDetail", {

		onInit: function () {

			// this.loginModel = sap.ui.getCore().getModel("loginModel");
			// this.loginData = this.loginModel.getData();
			this.fragModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.fragModel, "fragModel");

			this.oDataModel = sap.ui.getCore().getModel("oDataModel");
			// this.oDataModel = this.getView().getModel();

			this.flagModel = sap.ui.getCore().getModel("flagModel");
			this.getView().setModel(this.oDataModel);

			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRouteMatched(this.handleRouteMatched, this);

			this.detailModel = new sap.ui.model.json.JSONModel();
			this.detailModel.setSizeLimit(1000);
			this.getView().setModel(this.detailModel, "detailModel");
			this.popOverModel = new sap.ui.model.json.JSONModel();
			this.detailAmountPopoverModel = new sap.ui.model.json.JSONModel();
			this.ConfirmFragModel = new sap.ui.model.json.JSONModel();

			this.getView().addStyleClass("sapUiSizeCompact");

			this.getView().byId("ObjectId").onAfterRendering = function () {
				sap.m.ObjectHeader.prototype.onAfterRendering.apply(this, arguments);
				this.$().find('.sapMOHTitleDiv').find('.sapMText').css('color', "#af2323");
			};

		},

		handleRouteMatched: function (event) {

			if (event.getParameter("name") === "PoDetail") {

				this.odata = {};
				var that = this;

				// this.oDataModel.setHeaders({
				// 	"loginId": that.loginData.loginName,
				// 	"LoginType": that.loginData.userType
				// });

				this.Po_Num = event.getParameter("arguments").Po_No;
				// this.Vendor_No = event.getParameter("arguments").Vendor_No;

				// var request = "/PO_HEADERSet(Po_No='" + this.Po_Num + "',Vendor_No='" + this.Vendor_No + "')?$expand=headertoitemNav";

				var request = "/PO_HEADERSet(Po_No='" + this.Po_Num + "',Vendor_No='')?$expand=headertoitemNav";
				this.oDataModel.read(request, null, null, false, function (oData) {
						that.odata = oData;
						that.detailModel.setData(oData);
						that.detailModel.refresh(true);
					},
					function (oError) {

						var value = JSON.parse(oError.response.body);
						MessageBox.error(value.error.message.value);

					}
				);

				/*	var data = this.detailModel.getData().headertoitemNav.results;*/
				/*	this.checkCount = 0;
					this.enabledCount = 0;
					this.getView().byId("chkBoxSelectAll").setSelected(false);
					this.getView().byId("chkBoxSelectAll").setEnabled(true);

					for (var i = 0; i < data.length; i++) {
						if (data[i].Confirm_Status == "Not Confirmed") {
							this.enabledCount++;
						}
					}
					if (this.enabledCount == 0) {
						this.getView().byId("chkBoxSelectAll").setEnabled(false);
					}*/

				// this.getView().bindElement({
				// 	path: request,
				// 	events: {
				// 		dataReceived: function(oError) {}
				// 	}
				// });

			}
		},

		onMaterialPress: function (oEvent) {
			var that = this;
			var LineItemData = oEvent.getSource().getParent().getBindingContext("detailModel").getObject();

			if (!this._oPopoverFragment) {
				this._oPopoverFragment = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.DetailPopoverFragment", this);

				this.TableTempId = sap.ui.getCore().byId("TableTempId").clone();
				this.getView().addDependent(this._oPopoverFragment);
			}

			sap.ui.getCore().byId("DeliveryTableId").bindAggregation("items", {
				path: "/SubcontractMaterialSet?$filter=Ebeln eq '" + LineItemData.Po_No + "'and Ebelp  eq '" + LineItemData.Item_No + "'",
				template: that.TableTempId
			});

			this._oPopoverFragment.openBy(oEvent.getSource());
			// this._oPopover.openBy(oEvent.getSource());

		},

		onCreateAsn: function () {
			sap.ui.core.BusyIndicator.show(0);
			var that = this;
			this.router.navTo("PoAsnCreate", {
				"Po_No": that.Po_Num,
				"Amount": that.detailModel.getData().Amount
					// "Vendor_No": that.detailModel.getData().Vendor_No

			});
		},
		onChkBoxSelect: function (oEvent) {

			if (!oEvent.getParameter("selected")) {
				this.checkCount--;
			} else {
				this.checkCount++;
			}

			this.getView().byId("chkBoxSelectAll").setSelected(false);

			if (this.checkCount == this.enabledCount) {
				this.getView().byId("chkBoxSelectAll").setSelected(true);
			}

		},
		selectAllCheck: function (oEvent) {
			var that = this;
			var isAllSelected = oEvent.getParameter("selected");
			var data = this.detailModel.getData();
			var tableData = data.headertoitemNav.results;
			this.checkCount = 0;
			for (var i = 0; i < tableData.length; i++) {

				if (isAllSelected) {

					this.isSelected = tableData[i].Confirm_Status;

					if (this.isSelected == "Not Confirmed") {
						tableData[i].Item_indicator = true;
						this.checkCount++;
					}
				} else {
					tableData[i].Item_indicator = false;
				}
			}

			data.headertoitemNav.results = tableData;
			this.detailModel.setData(data);
			this.detailModel.refresh(true);

		},
		onCofirmAsn: function (oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			this.router.navTo("PoConfirmation", {
				"Po_No": this.Po_Num
			});
		},
		onFragClose: function (oEvent) {
			oEvent.getSource().getParent().close();
		},

		onItempress: function (oEvent) {

			var Data = oEvent.getParameter("listItem").getBindingContext("detailModel").getObject();
			this.router.navTo("POItemDetails", {
				"Po_No": Data.PoNum,
				"Item_No": Data.LineNum,
				"Uom": Data.Uom
			});

		},
		/*	onQuantityPress: function(oQuantity) {
			var that = this;

			if (!this.QuantFrag) {
				this.QuantFrag = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoFragRequiredQuan", this);
				this.getView().addDependent(this.QuantFrag);
			}

			// var sPath = oQuantity.getSource().getBindingContext("detailModel").sPath;
			var Ebelp = oQuantity.getSource().getBindingContext("detailModel").getProperty("Item_No");

			// var Ebelp = sPath.split("/")[3];
			var type = "R";
			var request = "/PoScheduleSet?$filter= Ebeln eq '" + this.Po_Num + "' and Ebelp eq '" + Ebelp + "' and Type eq '" +
				type + "'";
			this.oDataModel.read(request, null, null, false, function(oData) {
					// that.odata = oData;
					that.fragModel.setData(oData);
					that.fragModel.refresh(true);
				},
				function(oError) {

					var value = JSON.parse(oError.response.body);
					MessageBox.error(value.error.message.value);
					return;
				}
			);
			// var data = this.detailModel.getProperty(sPath); 
			// this.popOverModel.setData(data); this.QuantFrag.setModel(this.popOverModel);
			// that.QuantFrag.openBy(oQuantity.getSource());
			that.QuantFrag.open();
			// 
			// this.QuantFrag.openBy(that.fragModel.getData());

		},
*/
		onQuantityPress: function (oEvent) {
			// var sPath = oQuantity.getSource().getBindingContext("detailModel").sPath;
			var that = this;
			var Ebelp = oEvent.getSource().getBindingContext("detailModel").getProperty("Item_No");

			// var Ebelp = sPath.split("/")[3];
			var type = "R";
			var request = "/PoScheduleSet?$filter= Ebeln eq '" + this.Po_Num + "' and Ebelp eq '" + Ebelp + "' and Type eq '" +
				type + "'";
			this.oDataModel.read(request, null, null, false, function (oData) {
					// that.odata = oData;
					that.fragModel.setData(oData);
					that.fragModel.refresh(true);
				},
				function (oError) {

					var value = JSON.parse(oError.response.body);
					MessageBox.error(value.error.message.value);
					return;
				}
			);
			var PID = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoFragRequiredQuan", this);
			this.getView().addDependent(PID);
			PID.setModel(this.oDataModel);
			PID.setModel(this.fragModel, "fragModel");
			var Dialog = new sap.m.Dialog({
				title: "Schedule",
				content: PID,
				Draggable: true,
				buttons: [
					new sap.m.Button({
						text: "Close",
						press: function () {
							Dialog.close();
						}
					})
				],
				afterClose: function () {
					Dialog.destroy();
				}
			});
			Dialog.open();
		},

		onConfQuantityPress: function (oEvent) {
			// if (!this.QuantFragC) {
			// 	this.QuantFragC = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoFragConfQuan", this);
			// 	this.getView().addDependent(this.QuantFragC);
			// }

			// var sPath = oQuantity.getSource().getBindingContext("detailModel").sPath;
			// var data = this.detailModel.getProperty(sPath);
			// this.popOverModel.setData(data);
			// this.QuantFragC.setModel(this.popOverModel);

			// this.QuantFragC.openBy(oQuantity.getSource());
			var that = this;
			var Ebelp = oEvent.getSource().getBindingContext("detailModel").getProperty("Item_No");

			// var Ebelp = sPath.split("/")[3];
			var type = "C";
			var request = "/PoScheduleSet?$filter= Ebeln eq '" + this.Po_Num + "' and Ebelp eq '" + Ebelp + "' and Type eq '" +
				type + "'";
			this.oDataModel.read(request, null, null, false, function (oData) {
					// that.odata = oData;
					that.fragModel.setData(oData);
					that.fragModel.refresh(true);
				},
				function (oError) {

					var value = JSON.parse(oError.response.body);
					MessageBox.error(value.error.message.value);
					return;
				}
			);
			var PID = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoFragRequiredQuan", this);
			this.getView().addDependent(PID);
			PID.setModel(this.oDataModel);
			PID.setModel(this.fragModel, "fragModel");
			var Dialog = new sap.m.Dialog({
				title: "Schedule",
				content: PID,
				Draggable: true,
				buttons: [
					new sap.m.Button({
						text: "Close",
						press: function () {
							Dialog.close();
						}
					})
				],
				afterClose: function () {
					Dialog.destroy();
				}
			});
			Dialog.open();
		},

		onAmountPress: function (oAmount) {
			if (!this.QuantAmount) {
				this.QuantAmount = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoAmountFrag", this);
				this.getView().addDependent(this.QuantAmount);
			}

			var sPath = oAmount.getSource().getBindingContext("detailModel").sPath;
			var data = this.detailModel.getProperty(sPath);
			this.detailAmountPopoverModel.setData(data);
			this.QuantAmount.setModel(this.detailAmountPopoverModel);

			this.QuantAmount.openBy(oAmount.getSource());
		}
	});

});