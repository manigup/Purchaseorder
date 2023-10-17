sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox"

], function (Controller, MessageBox) {
	"use strict";

	return Controller.extend("sp.fiori.purchaseorder.controller.PoAsnEdit", {
		onInit: function () {

			// this.loginModel = sap.ui.getCore().getModel("loginModel");
			// this.loginData = this.loginModel.getData();

			this.oDataModel = sap.ui.getCore().getModel("oDataModel");
			this.getView().setModel(this.oDataModel);
			this.getView().addStyleClass("sapUiSizeCompact");

			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRouteMatched(this.handleRouteMatched, this);

			this.asnModel = new sap.ui.model.json.JSONModel();
			this.asnModel.setSizeLimit(1000);
			this.getView().setModel(this.asnModel, "asnModel");

			this.flagModel = sap.ui.getCore().getModel("flagModel");
			var data = this.flagModel.getData();
			data.confirmPressFlag = false;
			this.flagModel.refresh(true);
			this.DeleteArray = [];
			this.DeleteFlag = false;
			this.uploadCollectionTemp = this.getView().byId("UploadCollItemId").clone();
			// this.asnCreateModel = new sap.ui.model.json.JSONModel();
			// this.getView().setModel(this.asnCreateModel, "asnCreateModel");
			this.dateConfirmationModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.dateConfirmationModel, "DateConfirmationModel");

			this.popOverModel = new sap.ui.model.json.JSONModel();
		},
		handleRouteMatched: function (event) {

			if (event.getParameter("name") === "PoAsnEdit") {
				//Get Storage object to use to get the DRaft quantity

				var that = this;
				var datePicker = this.getView().byId("DP1");

				datePicker.addDelegate({
					onAfterRendering: function () {
						datePicker.$().find('INPUT').attr('disabled', true).css('color', '#000000');
					}
				}, datePicker);

				// code for date Restriction
				// var fdate = new Date();
				var Today = new Date();
				var Tomorrow = new Date();
				var Yesterday = new Date();

				Yesterday.setDate(Today.getDate() - 4);
				Tomorrow.setDate(Today.getDate() + 1);
				// this.getView().byId("DP1").setDateValue(new Date());
				this.getView().byId("DP1").setMinDate(Yesterday);
				this.getView().byId("DP1").setMaxDate(Today);

				this.Po_Num = event.getParameter("arguments").Po_No;
				this.Amount = event.getParameter("arguments").Amount;
				this.Amount.trim();
				this.Vendor_No = event.getParameter("arguments").Vendor_No;
				this.Asn_No = event.getParameter("arguments").Asn_No;
				this.FisYear = this.getOwnerComponent().getComponentData().startupParameters.FisYear[0];
				this.getView().byId("AsnObjectId").setTitle("ASN Number:" + this.Asn_No + "/" + this.FisYear + "");
				this.getView().byId("AsnCreateTable").removeSelections(true);

				// this.getView().byId("AsnCreateTable").bPreventMassSelection = true

				// ,App='ASN'
				this.oDataModel.read("/PO_ASN_HEADERSet(Po_No='" + this.Po_Num + "')?$expand=asnheadertoasnitemnav",
					null,
					null,
					false,
					function (oData, oResponse) {
						var DraftQty = jQuery.sap.storage(jQuery.sap.storage.Type.session).get("AsnItems");
						var POItems = oData.asnheadertoasnitemnav.results;
						POItems.forEach(function (item) {

							DraftQty.forEach(function (qty) {
								if (item.Ebelp === qty.ItemNo.trim() && parseInt(item.Etenr) === parseInt(qty.schd_line)) {
									item.Draft_AsnQty = qty.Quantity;
									item.Draft_AsnQty1 = qty.Quantity; /// need to do some calculation on update
								}

							});

							if (item.Draft_AsnQty !== "0") {
								item.Selected = true;
								item.CheckFlag = "X";
								// that.byId("AsnCreateTable").getItems()[index].setSelected(true);
								// ModelData.InvoiceAmt = parseFloat(ModelData.InvoiceAmt) + (parseFloat(item.Menge) * (parseFloat(item.Netpr) + parseFloat(item.Tax)));
								// ModelData.InvoiceAmt = parseFloat(ModelData.InvoiceAmt).toFixed(2);
							}
						});
						let pkgMatQty;
						oData.asnheadertoasnitemnav.results = POItems.filter(function (item) {
							pkgMatQty = parseFloat(item.Draft_AsnQty) / parseFloat(item.SOQ);
							item.PkgMatQty = isNaN(pkgMatQty) ? "0" : isFinite(pkgMatQty) === false ? "0" : (Math.ceil(pkgMatQty)).toString();
							return item.Menge !== "0.00" || item.Draft_AsnQty !== "0";
						});
						that.asnModel.setData(oData);
						that.asnModel.getData().InvoiceAmt = that.Amount;
						that.asnModel.getData().InvoiceNum = that.getOwnerComponent().getComponentData().startupParameters.Invoice_Num[0];
						that.asnModel.getData().InvoiceDate = that.getOwnerComponent().getComponentData().startupParameters.Invoice_Date[0];
						if (jQuery.sap.storage(jQuery.sap.storage.Type.session).get("UnplannedCost")) {
							that.asnModel.getData().UnplannedCost = jQuery.sap.storage(jQuery.sap.storage.Type.session).get("UnplannedCost").trim();
							var InvoiceVal = +that.asnModel.getData().InvoiceAmt + +that.asnModel.getData().UnplannedCost;
							that.asnModel.getData().InvoiceVal = InvoiceVal.toFixed(2);
							that.getView().byId("AsnObjectId").setNumber(that.asnModel.getData().InvoiceVal);
						}
						that.asnModel.refresh(true);
						// that.getView().byId("DP1").setDateValue(
						// 	new Date());
					},
					function (oError) {
						var value = JSON.parse(oError.response.body);
						MessageBox.error(value.error.message.value);
					});
				sap.ui.core.BusyIndicator.hide();

				// Get CSRF token

				if (!this.header_xcsrf_token) {
					var model = this.getView().getModel();
					var oServiceUrl = model.sServiceUrl + "/";
					var that = this;

					sap.ui.core.BusyIndicator.show(0);
					model._request({
						requestUri: oServiceUrl,
						method: "GET",
						headers: {
							"X-Requested-With": "XMLHttpRequest",
							"Content-Type": "application/atom+xml",
							"DataServiceVersion": "2.0",
							"X-CSRF-Token": "Fetch"
						}
					}, function (data, response) {
						sap.ui.core.BusyIndicator.hide();
						that.header_xcsrf_token = response.headers["x-csrf-token"];
					});
					sap.ui.core.BusyIndicator.hide();
				}
				sap.ui.core.BusyIndicator.hide();
				this.getView().byId("UploadCollection").bindItems({
					path: "/AsnAttachementSet?$filter=AsnNum eq '" + this.Asn_No + "' and FisYear eq '" + this.FisYear + "'",
					template: that.uploadCollectionTemp
				});
			}
			// this.asnModel.refresh(true); 
		},

		onPrint: function () {
			var a = document.createElement("a");
			a.href = "/sap/fiori/sppurchaseorder/model/Print.pdf";
			var filename = decodeURIComponent("Print.pdf");
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
		},

		onUnplannedCostChange: function (oEvent) {
			if (oEvent.getParameter("newValue").includes("-")) {
				MessageBox.error("Unplanned cost less than 0 is not allowed!");
				var newVal = Math.abs(parseFloat(oEvent.getParameter("newValue")));
				oEvent.getSource().setValue(newVal);
			}
			if (oEvent.getParameter("newValue").includes(".")) {
				var splitValue = oEvent.getParameter("newValue").split(".");
				if (splitValue[1].length > 2) {
					MessageBox.error("Value upto 2 decimals is allowed.");
					oEvent.getSource().setValue(parseFloat(oEvent.getParameter("newValue")).toFixed(2));
				}
			}
		},

		onQuanChange: function (e) {
			this.calculateInvoiceAmt();
			// var data = this.asnModel.getData();
			// data.InvoiceAmt = 0;
			// var oTable = this.getView().byId("AsnCreateTable");
			// var contexts = oTable.getSelectedContexts();

			// if (contexts.length) {
			// 	var value = parseInt(e.getParameter("value"));
			// 	var index = e.getSource().getBinding("value").getContext().getPath().substring(e.getSource().getBinding("value").getContext().getPath()
			// 		.lastIndexOf("/") + 1, e.getSource().getBinding("value").getContext().getPath().length);
			// 	if (value > 0) { //Check whether table has any selected contexts
			// 		var items = contexts.map(function (c) {
			// 			return c.getObject();
			// 		});

			// 		if (items.length) {
			// 			for (var i = 0; i < items.length; i++) {
			// 				if (parseInt(index) === i) {
			// 					items[i].Menge = e.getParameter("value");
			// 				}
			// 				data.InvoiceAmt = parseInt(data.InvoiceAmt) + (parseInt(items[i].Menge) * (parseFloat(items[i].Netpr))); // + parseFloat(items[i].Tax)));
			// 				// ((parseInt(items[i].Menge) * (parseFloat(items[i].Netpr) + parseFloat(items[i].Tax)));
			// 				data.InvoiceAmt = parseFloat(data.InvoiceAmt).toFixed(2);

			// 				this.asnModel.refresh(true);
			// 			}
			// 		}

			// 	} else {
			// 		MessageBox.information("Please enter quantity for selected items");
			// 	}
			// } else {
			// 	MessageBox.information("Please select the item");
			// 	e.getSource().setValue();
			// }
		},

		onNavBack: function () {
			// history.go(-2);
			var component = this.getOwnerComponent().getComponentData();
			if (component !== undefined && component.startupParameters.ASN_NO) {
				//navigate to asn app
				var navigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				navigator.toExternal({
					target: {
						semanticObject: "asn",
						action: "manage"
					},
					params: {
						Asn_Num: component.startupParameters.ASN_NO[0]
					}
				});
			} else {
				this.router.navTo("PoMaster");
			}
		},

		onAsnUpdate: function (event) {

			var ItemsWithStates = this.getView().byId("AsnCreateTable").getItems();
			var ItemsWithStatesArray = ItemsWithStates.map(function (c) {
				return c.getBindingContext("asnModel").getObject();
			});

			var OriginalItems = JSON.parse(JSON.stringify(ItemsWithStatesArray));

			var that = this;
			this.data = this.asnModel.getData();
			var createData = {
				"Update": true,
				"Delete": this.DeleteFlag,
				"AsnNum": this.Asn_No,
				"Fis_Year": this.FisYear,
				"Buyer_Name": this.data.Buyer_Name,
				"Currency": this.data.Currency,
				"InvoiceAmt": this.data.InvoiceAmt.toString(),
				"InvoiceVal": this.data.InvoiceVal.toString(),
				"UnplannedCost": this.data.UnplannedCost.toString(),
				"UnplannedCost_text": this.data.UnplannedCost_text,
				"InvoiceDate": this.data.InvoiceDate,
				"InvoiceNum": this.data.InvoiceNum,
				"Po_No": this.data.Po_No,
				"Purchase_Group_Desc": this.data.Purchase_Group_Desc,
				"ShipTime": this.data.ShipTime,
				"Total_Amount": this.data.Total_Amount.toString(),
				"Vendor_No": this.data.Vendor_No,
				"Werks": this.data.Werks,
				"asnheadertoasnitemnav": []
			};
			createData.Total_Amount = this.Amount;
			createData.Vendor_No = this.Vendor_No;
			if (this.data.InvoiceNum) {
				createData.DraftAsn = false;
				if (this.getView().byId("UploadCollection").getItems().length <= 0) {
					MessageBox.error("Atleast One attachment is required.");
					return;
				}
			} else {
				createData.DraftAsn = true;
			}
			var oTable = this.getView().byId("AsnCreateTable");
			var contexts = oTable.getSelectedContexts();
			//!createData.InvoiceNum || || !createData.InvoiceDate
			if (!createData.InvoiceAmt) {
				MessageBox.error("Please fill all the required Information");
				return;
			} else if (!contexts.length) {
				MessageBox.error("No Item Selected");
				return;
			} else {
				var items = contexts.map(function (c) {
					return c.getObject();
				});

				for (var i = 0; i < items.length; i++) {
					if (!items[i].Draft_AsnQty) {
						MessageBox.error("Draft ASN Quantity is required for selected items");
						sap.ui.core.BusyIndicator.hide();
						return;
					} else {
						createData.asnheadertoasnitemnav.push(items[i]);
					}
				}
				var validateResults = [];
				var DraftQty = createData.asnheadertoasnitemnav;
				DraftQty.forEach(function (item) {
					item.Draft_AsnQty1 = item.Draft_AsnQty1 ? item.Draft_AsnQty1 : 0.00;
					var AsnCreated = +item.Asn_Created - +item.Draft_AsnQty1;
					var comparedQty = +item.Draft_AsnQty + AsnCreated;
					if (parseFloat(item.Total_Qty) < comparedQty) {
						MessageBox.error("Draft ASN Quantity cannot be greater then ASN to be Created");
						validateResults.push(true);
					} else {
						validateResults.push(false);
					}
				});
				if (validateResults.every(item => item !== true)) {
					var Items = createData.asnheadertoasnitemnav;
					Items.forEach(function (item) {
						// ItemsWithStates.push(temp);
						if (item.Selected) {
							delete item.Draft_AsnQty1
							delete item.Selected;
							delete item.CheckFlag;
						}
					});
					that.oDataModel.create("/PO_ASN_HEADERSet", createData, null, function (oData, response) {
						that.asn = oData.AsnNum;
						that.year = oData.Fis_Year;
						var ASN = oData.AsnNum + "/" + oData.Fis_Year;
						that.onStartUpload();
						MessageBox.success("ASN " + oData.AsnNum + "/" + oData.Fis_Year + " updated succesfully  ", {
							actions: [sap.m.MessageBox.Action.OK],
							icon: sap.m.MessageBox.Icon.SUCCESS,
							title: "Success",
							onClose: function (oAction) {
								if (oAction === "OK") {
									that.onNavBack();
									// history.go(-2);
								}
							}
						});

					}, function (oError) {
						// createData.asnheadertoasnitemnav = ItemsWithStates;
						var asnModelData = that.asnModel.getData();
						asnModelData.asnheadertoasnitemnav.results = OriginalItems;
						that.asnModel.setData(asnModelData);
						Items = ItemsWithStates;
						try {
							var error = JSON.parse(oError.response.body);
							MessageBox.error(error.error.message.value);
						} catch (err) {
							var errorXML = jQuery.parseXML(oError.getParameter("responseText")).querySelector("message").textContent;
							MessageBox.error(errorXML);
						}
					});
				}
			}
		},
		handleLinkPress: function (oEvent) {
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PricePopoverFragment", this);
				this.getView().addDependent(this._oPopover);
			}

			var sPath = oEvent.getSource().getBindingContext("asnModel").sPath;
			var data = this.asnModel.getProperty(sPath);
			this.popOverModel.setData(data);
			this._oPopover.setModel(this.popOverModel);
			// var Pstyp = data.Pstyp;
			// if(Pstyp==="3"){
			// 	sap.ui.getCore().byId("hsvId").setVisible(false);
			// }
			// else{
			// 		sap.ui.getCore().byId("hsvId").setVisible(true);
			// }

			this._oPopover.openBy(oEvent.getSource());

		},

		onAsnCancel: function () {
			this.router.navTo("PoMaster");
		},

		//	********************************************Upload File start Code ***********************************
		onChange: function (oEvent) {
			var oUploadCollection = oEvent.getSource();

			if (this.header_xcsrf_token) {
				var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
					name: "x-csrf-token",
					value: this.header_xcsrf_token
				});
				oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
			}

		},

		onStartUpload: function (oEvent) {
			var oUploadCollection = this.getView().byId("UploadCollection");
			oUploadCollection.upload();
		},

		onBeforeUploadStarts: function (oEvent) {
			// Header Slug
			// var that = this;
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: this.asn + "/" + this.year + "/" + oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
		},

		onSelectionChange: function (oEvent) {

			// if (oEvent.getParameter("selectAll")) {
			var ListItems = this.getView().byId("AsnCreateTable").getItems();
			for (var i = 0; i < ListItems.length; i++) {
				var BindingContext = ListItems[i].getBindingContext("asnModel").getObject();
				if (BindingContext.CheckFlag == "X") {
					ListItems[i].setSelected(true);
				}
			}
			// 	// }
			// } else if (oEvent.getParameter("listItem").getBindingContext("asnModel").getProperty("CheckFlag") === "X") {
			// 	oEvent.getParameter("listItem").setSelected(true);
			// }
			this.draftInvoiceAmt();
		},

		calculateInvoiceAmt: function () {
			var data = this.asnModel.getData();
			data.InvoiceAmt = 0;
			var oTable = this.getView().byId("AsnCreateTable");
			var contexts = oTable.getSelectedContexts();

			if (contexts.length) {
				var items = contexts.map(function (c) {
					return c.getObject();
				});

				for (var i = 0; i < items.length; i++) {

					var temp = parseFloat(items[i].Menge);
					if (temp < 0 || items[i].Menge.includes("-")) {
						sap.m.MessageBox.error("Quantity can't be in negative.");
						sap.ui.core.BusyIndicator.hide();
						return;
					}
					if (!items[i].Menge) {
						sap.m.MessageBox.error("Please enter a valid Quantity for selected items");
						data.InvoiceAmt = 0;
						break;
					}
					// data.InvoiceAmt = parseFloat(data.InvoiceAmt) + (parseFloat(items[i].Menge) * (parseFloat(items[i].Netpr) + parseFloat(items[i]
					// 	.Tax)));

					var NetPr = (parseFloat(items[i].Menge) * (parseFloat(items[i].Netpr))).toFixed(2);
					var Cgst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Cgst))).toFixed(2);
					var Igst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Igst))).toFixed(2);
					var Sgst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Sgst))).toFixed(2);

					data.InvoiceAmt = parseFloat(data.InvoiceAmt) + parseFloat(NetPr) + parseFloat(Cgst) + parseFloat(Igst) + parseFloat(Sgst);

					data.InvoiceAmt = parseFloat(data.InvoiceAmt).toFixed(2);

					data.InvoiceAmt = Math.round(data.InvoiceAmt);
				}
			}
			this.asnModel.refresh(true);
		},
		onDateFilter: function (event) {
			var FromDate = this.byId("FromDateId").getValue();
			var ToDate = this.byId("ToDateId").getValue();
			var oBindings = this.getView().byId("AsnCreateTable").getBinding("items");
			if (FromDate || ToDate) {
				var Filter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter({
							path: 'Eindt',
							operator: sap.ui.model.FilterOperator.LE,
							value1: ToDate
						}),
						new sap.ui.model.Filter({
							path: 'Eindt',
							operator: sap.ui.model.FilterOperator.GE,
							value1: FromDate
						})
					],
					and: true
				});
				oBindings.filter(Filter);
			} else {
				MessageBox.error("No Dates are Selected");
			}

		},
		onDeliveryCost: function (event) {
			var invoiceAmount = this.getView().byId("invoiceAmtId").getValue();
			var unplannedAmount = this.getView().byId("unplannedAmtId").getValue();
			unplannedAmount = Math.abs(parseFloat(unplannedAmount));

			unplannedAmount = unplannedAmount ? unplannedAmount : 0;

			var InvoiceValAmount = +invoiceAmount + +unplannedAmount;

			var InvoiceVal = InvoiceValAmount;
			this.getView().byId("invoiceValueId").setValue(InvoiceVal.toFixed(2));
			this.getView().byId("AsnObjectId").setNumber(InvoiceVal.toFixed(2));
		},
		onEditPress: function (event) {
			this.byId("invoiceValueId").setEditable(true);
		},
		// onUpdateFinished: function (event) {
		// 	var that = this;
		// 	var ModelData = this.asnModel.getData();
		// 	var data = this.asnModel.getData().asnheadertoasnitemnav.results;
		// 	data.forEach(function (item, index) {
		// 		// if (item.Draft_AsnQty !== "0") {
		// 		// 	item.Selected = true;
		// 		// 	item.CheckFlag = "X";
		// 		// 	// that.byId("AsnCreateTable").getItems()[index].setSelected(true);
		// 		// 	// ModelData.InvoiceAmt = parseFloat(ModelData.InvoiceAmt) + (parseFloat(item.Menge) * (parseFloat(item.Netpr) + parseFloat(item.Tax)));
		// 		// 	// ModelData.InvoiceAmt = parseFloat(ModelData.InvoiceAmt).toFixed(2);
		// 		// }
		// 		that.asnModel.refresh();
		// 	});

		// },
		onDelete: function (event) {
			this.DeleteFlag = true;
			this.path = event.getSource().getBindingContext("asnModel").getPath().slice(-1);
			this.DeleteArray.push(this.asnModel.getData().asnheadertoasnitemnav.results[this.path]);
			this.asnModel.getData().asnheadertoasnitemnav.results.splice(this.path, 1);
			this.asnModel.refresh();
			this.asnModel.getData().InvoiceVal = '';
			this.draftInvoiceAmt();
		},
		draftInvoiceAmt: function (event) {
			const val = event.getParameter("newValue"),
				obj = event.getSource().getParent().getBindingContext("asnModel").getObject();

			if (event) {
				var Meins = obj.Meins;
				if (Meins == "EA") {
					if (val.includes(".")) {
						MessageBox.error("Fractional Values are not allowed");
						event.getSource().setValue(parseInt(val, 10).toString());
						return;
					}
				}
			}
			var data = this.asnModel.getData();
			data.InvoiceAmt = 0;
			var oTable = this.getView().byId("AsnCreateTable");
			var contexts = oTable.getSelectedContexts();

			if (contexts.length) {
				var items = contexts.map(function (c) {
					return c.getObject();
				});

				for (var i = 0; i < items.length; i++) {

					var temp = parseFloat(items[i].Draft_AsnQty);
					if (temp < 0 || items[i].Draft_AsnQty.includes("-")) {
						sap.m.MessageBox.error("Quantity can't be in negative.");
						sap.ui.core.BusyIndicator.hide();
						return;
					}
					if (!items[i].Draft_AsnQty) {
						sap.m.MessageBox.error("Please enter a valid Quantity for selected items");
						data.InvoiceAmt = 0;
						break;
					}
					// data.InvoiceAmt = parseFloat(data.InvoiceAmt) + (parseFloat(items[i].Draft_AsnQty) * (parseFloat(items[i].Netpr) + parseFloat(
					// 	items[i].Tax)));
					// data.InvoiceAmt = parseFloat(data.InvoiceAmt).toFixed(2);

					var NetPr = (parseFloat(items[i].Draft_AsnQty) * (parseFloat(items[i].Netpr))).toFixed(2);
					var Cgst = (parseFloat(items[i].Draft_AsnQty) * (parseFloat(items[i].Cgst))).toFixed(2);
					var Igst = (parseFloat(items[i].Draft_AsnQty) * (parseFloat(items[i].Igst))).toFixed(2);
					var Sgst = (parseFloat(items[i].Draft_AsnQty) * (parseFloat(items[i].Sgst))).toFixed(2);

					data.InvoiceAmt = parseFloat(data.InvoiceAmt) + parseFloat(NetPr) + parseFloat(Cgst) + parseFloat(Igst) + parseFloat(Sgst);
					data.InvoiceAmt = data.InvoiceAmt.toFixed(2);

					data.InvoiceAmt = Math.round(data.InvoiceAmt);

					var InvoiceVal = +this.asnModel.getData().InvoiceAmt + +this.asnModel.getData().UnplannedCost;

					InvoiceVal = Math.round(InvoiceVal);

					this.asnModel.getData().InvoiceVal = InvoiceVal.toFixed(2);
					this.getView().byId("AsnObjectId").setNumber(this.asnModel.getData().InvoiceVal);
				}
			}

			const pkgMatQty = parseFloat(val) / parseFloat(obj.SOQ);
			obj.PkgMatQty = isNaN(pkgMatQty) ? "0" : isFinite(pkgMatQty) === false ? "0" : (Math.ceil(pkgMatQty)).toString();

			this.asnModel.refresh();
		},
		onUndo: function (evt) {
			var that = this;
			this.DeleteFlag = false;
			if (this.DeleteArray) {
				this.DeleteArray.forEach(function (item, index) {
					that.asnModel.getData().asnheadertoasnitemnav.results.unshift(item);
				});
				that.asnModel.refresh();
				that.DeleteArray = [];
				that.draftInvoiceAmt();
			}
		},
		onLinkPress: function (oEvent) {
			var that = this;
			var LineItemData = oEvent.getSource().getParent().getBindingContext("asnModel").getObject();
			if (!this._oPopoverFragment) {
				this._oPopoverFragment = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.DatePopoverFragment", this);
				this._oPopoverFragment.setModel(this.dateConfirmationModel);
				this.getView().addDependent(this._oPopoverFragment);
			}
			this.oDataModel.read("/ConfirmationDateSet?$filter=Ebeln eq '" + LineItemData.Po_No + "'and Ebelp  eq '" + LineItemData.Ebelp +
				"'",
				null,
				null,
				false,
				function (oData, oResponse) {
					that.dateConfirmationModel.setData(oData);
					that.dateConfirmationModel.refresh(true);

				},
				function (oError) {
					var value = JSON.parse(oError.response.body);
					MessageBox.error(value.error.message.value);
				});
			this._oPopoverFragment.openBy(oEvent.getSource());
			// this._oPopover.openBy(oEvent.getSource());

		},
		onTypeMissmatch: function (oEvent) {
			MessageBox.error("Only PDF files are allowed.");
		}

	});

});