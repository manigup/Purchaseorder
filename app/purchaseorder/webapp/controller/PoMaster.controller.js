sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter"
], function (Controller, JSONModel, Filter) {
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
			this.AddressCodePO = sessionStorage.getItem("AddressCodePO");
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
					var unitCode = sessionStorage.getItem("unitCode") || "P01";
					var PoNo = selectedItem.getBindingContext().getProperty("PoNum");
					var Po_No = PoNo.replace(/\//g, '-');
					// var path = selectedItem.getBindingContext().getPath();
					// var VendorNum = that.getView().getModel().getProperty(path).Vendor_No;
					that.router.navTo("PoDetail", {
						"Po_No": Po_No,
						"UnitCode": unitCode
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
			var unitCode = sessionStorage.getItem("unitCode") || "P01";
			if (this.getView().byId("masterListId").getMode() == "MultiSelect") {
				return;
			}
			var PoNo = oEvent.getParameter("listItem").getProperty("title");
			var PoNum = PoNo.replace(/\//g, '-');
			this.router.navTo("PoDetail", {
				"Po_No": PoNum,
				"UnitCode": unitCode
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
								AddressCode: this.AddressCodePO,
								UnitCode: unitCode
							}
						},
						template: this._listTemp
					});
				} else {
					this.getView().byId("masterListId").bindItems({
						path: "/PurchaseOrders",
						parameters: {
							custom: {
								AddressCode: this.AddressCodePO,
								UnitCode: unitCode
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
		},
		onFilter: function () {
			if (!this.filterFragment) {
				this.filterFragment = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.filterFragment", this);
				this.filterFragment.setModel(this.filterModel, "filterModel");

			}
			this.filterVisibleModel = new sap.ui.model.json.JSONModel({
				Werks: true,
				Status: true,
			});

			this.filterFragment.setModel(this.filterVisibleModel, "FilterVisibleModel");
			this.filterFragment.open();
		},
		onPlantValueHelp: function () {
			if (!this.PlantF4Frag) {
				this.PlantF4Frag = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PlantFrag", this);
				this.PlantF4Temp = sap.ui.getCore().byId("plantTempId").clone();
			}
			this.PlantF4Frag.setModel(new JSONModel(JSON.parse(sessionStorage.getItem("CodeDetails"))), "plantModel");
			this.getView().addDependent(this.PlantF4Frag);
			// sap.ui.getCore().byId("plantF4Id").bindAggregation("items", {
			// 	path: this.plantModel,
			// 	template: this.PlantF4Temp
			// });
			sap.ui.getCore().byId("plantF4Id")._searchField.setVisible(false);
			this.PlantF4Frag.open();
		},

		handlePlantClose: function (oEvent) {
			var data = oEvent.getParameter("selectedItem").getProperty("title");
			this.desc = oEvent.getParameter("selectedItem").getProperty("description");
			this.filterModel.getData().Werks = data;
			this.filterModel.refresh("true");
			//sessionStorage.setItem("unitCode", data);
			this.PlantF4Frag.destroy();
			this.PlantF4Frag = "";
			//this.getData();
		},

		handlePlantCancel: function () {
			this.PlantF4Frag.destroy();
			this.PlantF4Frag = "";
		},
		// onStatusValueHelp: function () {
		// 	if (!this.StatusF4Frag) {
		// 		this.StatusF4Frag = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.StatusFrag", this);
		// 		this.StatusF4Temp = sap.ui.getCore().byId("statusTempId").clone();
		// 	}
		// 	var statusData = [
		// 		{
		// 			status: "Invoice Submitted"
		// 		},{
		// 			status: "Invoice Submission Pending"
		// 		}
		// 	];
		// 	this.StatusF4Frag.setModel(new JSONModel(statusData), "statusModel");
		// 	this.getView().addDependent(this.StatusF4Frag);
		// 	// sap.ui.getCore().byId("plantF4Id").bindAggregation("items", {
		// 	// 	path: this.plantModel,
		// 	// 	template: this.PlantF4Temp
		// 	// });
		// 	sap.ui.getCore().byId("statusF4Id")._searchField.setVisible(false);
		// 	this.StatusF4Frag.open();
		// },

		// handleStatusClose: function (oEvent) {
		// 	var data = oEvent.getParameter("selectedItem").getProperty("title");
		// 	this.StatusF4Frag.destroy();
		// 	this.StatusF4Frag = "";
		// 	var unitCode = sessionStorage.getItem("unitCode");
		// 	this.getView().byId("masterListId").bindItems({
		// 		path: "/PurchaseOrders?search=" + data,
		// 		parameters: {
		// 			custom: {
		// 				AddressCode: this.AddressCodePO,
		// 				UnitCode: unitCode
		// 			}
		// 		},
		// 		template: this._listTemp
		// 	});
		// 	this._getFirstItem();
		// },

		// handleStatusCancel: function () {
		// 	this.StatusF4Frag.destroy();
		// 	this.StatusF4Frag = "";
		// },
		onFilterSubmit: function () {
			var data = this.filterModel.getData();
			
			this.AddressCodePO = sessionStorage.getItem("AddressCodePO") || 'JSE-01-01';
			var Status = data.Status;
			var unitCode = data.Werks;
			
			if (!unitCode) {
				unitCode = sessionStorage.getItem("unitCode") || "P01";
			}
			
			if (!Status) {
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
			} else {
				this.getView().byId("masterListId").bindItems({
					path: "/PurchaseOrders?search=" + Status,
					parameters: {
						custom: {
							AddressCode: this.AddressCodePO,
							UnitCode: unitCode
						}
					},
					template: this._listTemp
				});
			}
			if(data.Werks){
			this.PlantFilter = unitCode + "(" + this.desc + ")";
			this.getView().byId("plantFilterId").setText(this.PlantFilter);
			}
			this.getView().byId("clearFilterId").setVisible(true);
			// this.filterModel.setData({});
			this.filterFragment.close();
			this.filterFragment.destroy();
			this.filterFragment = "";
			this._getFirstItem();
		},
		onFilterCancel: function () {
			this.filterFragment.close();
			this.filterFragment.destroy();
			this.filterFragment = "";
		},
		onFilterClear: function () {
			this.getView().byId("clearFilterId").setVisible(false);
			this.getView().byId("plantFilterId").setText("");
			var unitCode = sessionStorage.getItem("unitCode") || "P01";
			this.AddressCodePO = sessionStorage.getItem("AddressCodePO") || 'JSE-01-01';
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

	});

});