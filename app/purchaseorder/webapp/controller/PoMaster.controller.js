sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter"
], function (Controller, Filter) {
	"use strict";

	return Controller.extend("sp.fiori.purchaseorder.controller.PoMaster", {

		onInit: function () {
			this.getView().addStyleClass("sapUiSizeCompact");
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this._listTemp = this.getView().byId("listItemTemp").clone();

			// this.loginModel = sap.ui.getCore().getModel("loginModel");
			// this.loginData = this.loginModel.getData();
			this.flagModel = sap.ui.getCore().getModel("flagModel");
			this.oDataModel = sap.ui.getCore().getModel("oDataModel");
			this.filterModel = new sap.ui.model.json.JSONModel();
			this.router.attachRoutePatternMatched(this.handleRouteMatched, this);

		},

		handleRouteMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "PoMaster") {
				return;
			}
			var that = this;
			var unitCode = sessionStorage.getItem("unitCode") || "P01";
			this.AddressCodePO = sessionStorage.getItem("AddressCodePO") || 'SAT-01-01';
			if (that.flagModel.getData().confirmPressFlag) {
				var selectedList = this.getView().byId("masterListId").getSelectedItem();
				this.getView().byId("searchFieldId").setValue("");
				this.getView().byId("masterListId").getBinding("items").filter([]);
				this.getView().byId("masterListId").setSelectedItem(selectedList, true);
				var list = that.getView().byId("masterListId");
				var PoNo = selectedList.getBindingContext().getProperty("PoNum");
				var Po_No = PoNo.replace(/\//g, '-');
				that.router.navTo("PoDetail", {
					"Po_No": Po_No
				});
				return;
			}
			this.getView().byId("searchFieldId").setValue("");

			this.getView().byId("masterListId").bindItems({
				path: "/PurchaseOrders",
				parameters: {
					custom: {
						AddressCode: this.AddressCodePO,
						UnitCode: unitCode
					},
					countMode: 'None'
				},
				template: this._listTemp
			});
			this._getFirstItem();
		},

		_getFirstItem: function () {
			var that = this;
			sap.ui.core.BusyIndicator.show(0);
			this.getView().byId("masterListId").getBinding("items").attachDataReceived(function () {
				var list = that.getView().byId("masterListId");
				var selectedItem = list.getItems()[0];

				if (selectedItem) {
					list.setSelectedItem(selectedItem, true);
					var PoNo = selectedItem.getBindingContext().getProperty("PoNum");
					var Po_No = PoNo.replace(/\//g, '-');
					// var path = selectedItem.getBindingContext().getPath();
					// var VendorNum = that.getView().getModel().getProperty(path).Vendor_No;
					that.router.navTo("PoDetail", {
						"Po_No": Po_No
					});
					sap.ui.core.BusyIndicator.hide();
				} else {
					that.router.navTo('NoData');

				}
				sap.ui.core.BusyIndicator.hide();
			});
			sap.ui.core.BusyIndicator.hide();
		},

		onListItemPress: function (oEvent) {

			if (this.getView().byId("masterListId").getMode() == "MultiSelect") {
				return;
			}
			var PoNo = oEvent.getParameter("listItem").getProperty("title");
			var PoNum = PoNo.replace(/\//g, '-');
			this.router.navTo("PoDetail", {
				"Po_No": PoNum
			});
		},

		onSearch: function (e) {
			var unitCode = sessionStorage.getItem("unitCode");
			if (e.getParameter("refreshButtonPressed") === true) {
				this.getView().byId("masterListId").getBinding("items").refresh(true);
				this._getFirstItem();
			} else {
				var sValue = e.getParameter("query");
				if (sValue) {
					this.getView().byId("masterListId").bindItems({
						path: "/PurchaseOrders?search=" + sValue,
						parameters: {
							custom: {
								unitCode: unitCode
							}
						},
						template: this._listTemp
					});
				} else {
					this.getView().byId("masterListId").bindItems({
						path: "/PurchaseOrders",
						parameters: {
							custom: {
								unitCode: unitCode
							},
						},
						template: this._listTemp
					});
				}
				this._getFirstItem();
			}
		},

		onListModeChange: function () {
			var CurrentMode = this.getView().byId("masterListId").getMode();
			if (CurrentMode == "SingleSelectMaster") {
				this.getView().byId("masterListId").setMode("MultiSelect");
			} else {
				this.getView().byId("masterListId").setMode("SingleSelectMaster");
			}
		}

	});

});