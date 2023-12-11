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
						unitCode: unitCode
						//unitCode: 'P01'
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

		onFilter: function () {
			if (!this.filterFragment) {
				this.filterFragment = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.filterFragment", this);
				this.filterFragment.setModel(this.filterModel, "filterModel");

			}
			this.filterFragment.open();
		},

		onMaterialValueHelp: function (oEvent) {
			var that = this;
			if (!this.MaterialF4Frag) {
				this.MaterialF4Frag = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.MaterialFrag", this);
				this.MaterialF4Temp = sap.ui.getCore().byId("materialTempId").clone();

			}
			this.getView().addDependent(this.MaterialF4Frag);
			sap.ui.getCore().byId("materialF4Id").bindAggregation("items", {
				path: "/MaterialHelpSet",
				template: that.MaterialF4Temp
			});
			this.MaterialF4Frag.open();
		},
		handleMaterialSearch: function (evt) {
			var that = this;
			var sValue = evt.getParameter("value");
			if (sValue) {
				sap.ui.getCore().byId("materialF4Id").bindAggregation("items", {
					path: "/MaterialHelpSet?search=" + sValue,
					template: that.MaterialF4Temp
				});
			} else {
				sap.ui.getCore().byId("materialF4Id").bindAggregation("items", {
					path: "/MaterialHelpSet",
					template: that.MaterialF4Temp
				});
			}
		},
		handleMaterialClose: function (oEvent) {
			var data = oEvent.getParameter("selectedItem").getBindingContext().getObject();
			this.filterModel.getData().Matnr = data.Matnr;
			this.filterModel.refresh("true");
			this.MaterialF4Frag.destroy();
			this.MaterialF4Frag = "";
		},
		handleMaterialCancel: function (oEvent) {
			this.MaterialF4Frag.destroy();
			this.MaterialF4Frag = "";
		},
		onPlantValueHelp: function (oEvent) {
			var that = this;
			if (!this.PlantF4Frag) {
				this.PlantF4Frag = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PlantFrag", this);
				this.PlantF4Temp = sap.ui.getCore().byId("plantTempId").clone();

			}
			this.getView().addDependent(this.PlantF4Frag);
			sap.ui.getCore().byId("plantF4Id").bindAggregation("items", {
				path: "/PlantHelpSet",
				template: that.PlantF4Temp
			});
			this.PlantF4Frag.open();
		},
		handlePlantSearch: function (evt) {
			var that = this;
			var sValue = evt.getParameter("value");
			if (sValue) {
				sap.ui.getCore().byId("plantF4Id").bindAggregation("items", {
					path: "/PlantHelpSet?search=" + sValue,
					template: that.PlantF4Temp
				});
			} else {
				sap.ui.getCore().byId("plantF4Id").bindAggregation("items", {
					path: "/PlantHelpSet",
					template: that.PlantF4Temp
				});
			}
		},
		handlePlantClose: function (oEvent) {
			var data = oEvent.getParameter("selectedItem").getBindingContext().getObject();
			this.filterModel.getData().Werks = data.Werks;
			this.filterModel.refresh("true");
			this.PlantF4Frag.destroy();
			this.PlantF4Frag = "";
		},
		handlePlantCancel: function (oEvent) {
			this.PlantF4Frag.destroy();
			this.PlantF4Frag = "";
		},

		onFilterSubmit: function () {
			var data = this.filterModel.getData();
			var filters = [];
			if (data.Werks) {
				filters.push(new Filter("Plant", "EQ", data.Werks));
			}
			if (data.Matnr) {
				filters.push(new Filter("Matnr", "EQ", data.Matnr));
			}
			this.byId("masterListId").bindItems({
				path: "/PO_HEADERSet",
				filters: filters,
				template: this._listTemp
			});

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
			var path = "/PO_HEADERSet";
			this.getView().byId("masterListId").bindItems({
				path: path,
				template: this._listTemp
			});
			this.getView().byId("clearFilterId").setVisible(false);
			this.filterModel.setData({});
			this._getFirstItem();
		},

		onPrint: function () {
			var that = this;
			var selectedItems = this.getView().byId("masterListId").getSelectedItems();
			var Ebeln = [];
			for (var i = 0; i < selectedItems.length; i++) {
				var Po_No = selectedItems[0].getBindingContext().getObject().PoNum;
				Ebeln.push("Ebeln eq '" + Po_No + "'");
			}

			this.Filter = Ebeln.join(" and ");

			this.oDataModel.read("/POPrintSet?$filter=" + that.Filter, null, null, false, function (Odata) {
				sap.m.MessageBox.success("Print Success");
			}, function (oError) {
				var msg = (JSON.parse(oError.response.body)).error.message.value;
				sap.m.MessageBox.error(msg);

				// sap.m.MessageBox.error("Some Error Occured");
			});

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