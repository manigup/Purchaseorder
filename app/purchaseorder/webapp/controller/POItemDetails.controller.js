sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("sp.fiori.purchaseorder.controller.POItemDetails", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf 
		 * .POItemDetails
		 */
		onInit: function () {

			this.oDataModel = sap.ui.getCore().getModel("oDataModel");
			// this.oDataModel = this.getView().getModel();

			this.getView().setModel(this.oDataModel);

			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRouteMatched(this._handleRouteMatched, this);

			this.itemModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.itemModel, "itemModel");
		},

		_handleRouteMatched: function (evt) {

			var that = this;
			if (evt.getParameter("name") !== "POItemDetails") {
				return;
			}

			var unitCode = sessionStorage.getItem("unitCode");
			this.Po_Num = evt.getParameter("arguments").Po_No;
			this.Schedule_No = this.Po_Num .replace(/-/g,'/');
			this.Item_No = evt.getParameter("arguments").Item_No;
			// this.Uom = evt.getParameter("arguments").Uom;
			var oModel = this.getOwnerComponent().getModel();
                return new Promise(function(resolve, reject) {
                    oModel.callFunction("/getPurchaseMaterialQuantityList", {
                        method: "GET",
                        urlParameters: {
                            UnitCode: unitCode,
							PoNum: this.Schedule_No,
							MaterialCode: this.Item_No
                        },
                        success: function (oData, response) {
							that.itemModel.setData(oData.results);
					        that.itemModel.refresh(true.results);
                            resolve();
                        }.bind(this),
                        error: function (oError) {
                            reject(new Error("Failed to fetch material data."));
                        }
                    });
                }.bind(this));
		},
		onNavBack: function () {
			jQuery.sap.require("sap.ui.core.routing.History");
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry    
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history  
				var bReplace = true;
				this.router.navTo("SASplit", {}, bReplace);
			}
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf sp.fiori.purchaseorder.view.POItemDetails
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf sp.fiori.purchaseorder.view.POItemDetails
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf sp.fiori.purchaseorder.view.POItemDetails
		 */
		//	onExit: function() {
		//
		//	}

	});

});