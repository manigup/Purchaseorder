jQuery.sap.declare("sp.fiori.purchaseorder.controller.formatter");

sp.fiori.purchaseorder.controller.formatter = {

	onNavBack: function () {
		var oHistory = sap.ui.core.routing.History.getInstance();
		var sPreviousHash = oHistory.getPreviousHash();

		if (sPreviousHash !== undefined) {
			window.history.go(-1);
		} else {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("PoMaster", {}, true);
		}

	},
	timeFormat: function (value) {
		if (value !== "" && value !== null && value !== undefined) {
			var h = value.substring(0, 2);
			var m = value.substring(2, 4);
			var s = value.substring(4, 6);
			var time = h + ":" + m + ":" + s;
			return time;
		}
		return "";
	},

	formatAmount: function (oAmount) {
		if (oAmount) {
			var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				"groupingEnabled": true,
				"groupingSeparator": ',',
				"groupingSize": 3,
				"decimalSeparator": "."
			});
			return oFormat.format(oAmount);
		}
		return "";
	},

	formatDate: function (oDate) {
		if (oDate) {

			// var date = oDate.substring(4, 6) + "/" + oDate.substring(6, 8) + "/" + oDate.substring(0, 4);

			//var DateInstance = new Date(date);
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MMM dd, yyyy"
			});
			return dateFormat.format(oDate);
		}
		return "";
	},
	formatDate1: function (oDate) {
		// if (oDate.includes("Week")) {
		// 	return oDate;
		// } else {
		if (oDate !== "" && oDate !== null && oDate !== undefined) {
			var date = oDate.substring(4, 6) + "/" + oDate.substring(6, 8) + "/" + oDate.substring(0, 4);

			var DateInstance = new Date(date);
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MMM dd, yyyy"
			});
			return dateFormat.format(DateInstance);
		} else {
			return "";
		}
		// }
		// return "";
	},

	getPercentSign: function (taxValue, taxRate) {
		if (taxValue && taxRate) {

			taxValue = parseFloat(taxValue).toFixed(2).toString();

			return taxValue + " (" + taxRate + "%)";
		}
		return "";
	},

	selectEnabled: function (oConfirm) {
		if (oConfirm === "Not Confirmed") {
			return true;
		}
		return false;
	},
	statusCheckConf: function (oStatus) {
		if (oStatus === "Confirmed") {
			return "Success";
		} else if (oStatus === "Partially Confirmed") {
			return "Warning";
		} else if (oStatus === "Not Confirmed") {
			return "Error";
		}
		else if (oStatus === "Confirmation Required") {
			return "Error";
		}
		else {
			return "None";
		}
	},
	statusCheck: function (oStatus) {
		if (oStatus === "Closed") {
			return "Success";
		} else if (oStatus === "Partially") {
			return "Warning";
		} else if (oStatus === "Open") {
			return "Error";
		}
		else {
			return "None";
		}
	},
	checkSelection: function (indicator) {
		if (indicator === "true") {
			return true;
		} else {
			return false;
		}
	},
	createASNBtn: function (oValue) {
		if (oValue == "X") {
			return true;
		}
		return false;
	},
	addStatColor: function (status) {
		if (status === "Invoice Submitted") {
			this.addStyleClass("statSuccess");
			this.removeStyleClass("statWarning");
		} else {
			this.addStyleClass("statWarning");
			this.removeStyleClass("statSuccess");
		}
		return status;
	},
};