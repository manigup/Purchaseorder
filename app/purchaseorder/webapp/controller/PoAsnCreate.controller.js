sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox"

], function (Controller, MessageBox) {
	"use strict";

	return Controller.extend("sp.fiori.purchaseorder.controller.PoAsnCreate", {
		onInit: function () {

			// this.loginModel = sap.ui.getCore().getModel("loginModel");
			// this.loginData = this.loginModel.getData();

			this.oDataModel = sap.ui.getCore().getModel("oDataModel");

			this.getView().addStyleClass("sapUiSizeCompact");

			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRouteMatched(this.handleRouteMatched, this);

			this.asnModel = new sap.ui.model.json.JSONModel();
			this.asnModel.setSizeLimit(1000);
			this.getView().setModel(this.asnModel, "asnModel");
			this.detailHeaderModel = new sap.ui.model.json.JSONModel();
			this.detailHeaderModel.setSizeLimit(1000);
			this.getView().setModel(this.detailHeaderModel, "detailHeaderModel");

			this.flagModel = sap.ui.getCore().getModel("flagModel");
			var data = this.flagModel.getData();
			data.confirmPressFlag = false;
			this.flagModel.refresh(true);
			this.dateConfirmationModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.dateConfirmationModel, "DateConfirmationModel");
			this.popOverModel = new sap.ui.model.json.JSONModel();
		},
		handleRouteMatched: function (event) {

			if (event.getParameter("name") === "PoAsnCreate") {
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
				// Tomorrow.setDate(Today.getDate() + 1);
				// this.getView().byId("DP1").setDateValue(new Date());
				this.getView().byId("DP1").setMinDate(Yesterday);
				this.getView().byId("DP1").setMaxDate(Today);

				var Po_Num = event.getParameter("arguments").Po_No;
				//this.Po_Num = Po_Num.replace(/-/g, '/');
				this.Po_Num = "19/01P/03/00001";
				this.Amount = event.getParameter("arguments").Amount;
				this.Vendor_No = event.getParameter("arguments").Vendor_No;
				var unitCode = sessionStorage.getItem("unitCode");
				//var unitCode = "P01";
				var oModel = this.getOwnerComponent().getModel();

				this.getView().byId("AsnCreateTable").removeSelections(true);
				var request = `/ASNItems?unitCode=${unitCode}&docNum=${this.Po_Num}`;
				oModel.read(request, {
					success: function (oData) {
						var filteredPurchaseOrder = oData.results.find(po => po.CustomerReferenceNumber_PoNum === that.Po_Num);
						if (filteredPurchaseOrder) {
							that.detailHeaderModel.setData(filteredPurchaseOrder);
							that.detailHeaderModel.refresh(true);

							that.asnModel.setData(oData.results);
							that.asnModel.refresh(true);
						} else {
							MessageBox.error("Purchase order not found");
						}
					},
					error: function (oError) {
						var value = JSON.parse(oError.response.body);
						MessageBox.error(value.error.message.value);
					}
				});
				// ,App='PO'
				// this.oDataModel.read("/PO_ASN_HEADERSet(Po_No='" + this.Po_Num + "')?$expand=asnheadertoasnitemnav",
				// 	null, null, false,
				// 	function (oData, oResponse) {
				// 		var POItems = oData.asnheadertoasnitemnav.results;
				// 		let pkgMatQty;
				// 		oData.asnheadertoasnitemnav.results = POItems.filter(function (item) {
				// 			pkgMatQty = parseFloat(item.Menge) / parseFloat(item.SOQ);
				// 			item.PkgMatQty = isNaN(pkgMatQty) ? "0" : isFinite(pkgMatQty) === false ? "0" : (Math.ceil(pkgMatQty)).toString();
				// 			return item.Menge !== "0.00";
				// 		});

				// 		for (var i = 0; i < oData.asnheadertoasnitemnav.results.length; i++) {
				// 			if (oData.asnheadertoasnitemnav.results[i].Meins == "EA") {
				// 				oData.asnheadertoasnitemnav.results[i].Menge = parseInt(oData.asnheadertoasnitemnav.results[i].Menge).toString();
				// 			}
				// 		}

				// 		that.asnModel.setData(oData);
				// 		that.asnModel.refresh(true);
				// 		// that.getView().byId("DP1").setDateValue(new Date());
				// 	},
				// 	function (oError) {
				// 		var value = JSON.parse(oError.response.body);
				// 		MessageBox.error(value.error.message.value);
				// 	});
				sap.ui.core.BusyIndicator.hide();

				// Get CSRF token
				// if (!this.header_xcsrf_token) {
				// 	var model = this.getView().getModel();
				// 	var oServiceUrl = model.sServiceUrl + "/";
				// 	var that = this;

				// 	sap.ui.core.BusyIndicator.show(0);
				// 	model._request({
				// 		requestUri: oServiceUrl,
				// 		method: "GET",
				// 		headers: {
				// 			"X-Requested-With": "XMLHttpRequest",
				// 			"Content-Type": "application/atom+xml",
				// 			"DataServiceVersion": "2.0",
				// 			"X-CSRF-Token": "Fetch"
				// 		}
				// 	}, function (data, response) {
				// 		sap.ui.core.BusyIndicator.hide();
				// 		that.header_xcsrf_token = response.headers["x-csrf-token"];
				// 	});
				// 	sap.ui.core.BusyIndicator.hide();
				// 	var slash = window.location.href.includes("site") ? "/" : "";
				// 	var modulePath = jQuery.sap.getModulePath("sp/fiori/purchaseorder");
				// 	modulePath = modulePath === "." ? "" : modulePath;
				// 	var serviceUrl = modulePath + slash + "sap/opu/odata/shiv/NW_SUPP_PORTAL_PO_APP_SRV/AsnAttachementSet";
				// 	var site = window.location.href.includes("site");
				// 	if (site) {
				// 		this.getView().byId("UploadCollection").setUploadUrl(serviceUrl);
				// 	}
				// 	else
				// 		this.getView().byId("UploadCollection").setUploadUrl("/sap/opu/odata/shiv/NW_SUPP_PORTAL_PO_APP_SRV/AsnAttachementSet");

				// }
				sap.ui.core.BusyIndicator.hide();
			}
			// this.asnModel.refresh(true); 
		},

		onUnplannedCostChange: function (oEvent) {
			if (oEvent.getParameter("newValue").includes("-")) {
				MessageBox.error("Unplanned cost less than 0 is not allowed!");
				var newVal = Math.abs(parseFloat(oEvent.getParameter("newValue")));
				oEvent.getSource().setValue(newVal);
				return;
			}
			if (oEvent.getParameter("newValue").includes(".")) {
				var splitValue = oEvent.getParameter("newValue").split(".");
				if (splitValue[1].length > 2) {
					MessageBox.error("Value upto 2 decimals is allowed.");
					oEvent.getSource().setValue(parseFloat(oEvent.getParameter("newValue")).toFixed(2));
				}
			}
		},

		onAsnQtyLiveChange: function (oEvent) {
			const val = oEvent.getParameter("newValue"),
				obj = oEvent.getSource().getParent().getBindingContext("asnModel").getObject();
			if (obj.Meins == "EA") {
				if (val.includes(".")) {
					MessageBox.error("Fractional Values are not allowed");
					oEvent.getSource().setValue(parseInt(val, 10).toString());
					return;
				}
			}
			const pkgMatQty = parseFloat(val) / parseFloat(obj.SOQ);
			obj.PkgMatQty = isNaN(pkgMatQty) ? "0" : isFinite(pkgMatQty) === false ? "0" : (Math.ceil(pkgMatQty)).toString();
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
		// onQuanChange: function (e) {

		// 	this.calculateInvoiceAmt();
		// 	// var data = this.asnModel.getData();
		// 	// data.InvoiceAmt = 0;
		// 	// var oTable = this.getView().byId("AsnCreateTable");
		// 	// var contexts = oTable.getSelectedContexts();

		// 	// if (contexts.length) {
		// 	// 	var value = parseInt(e.getParameter("value"));
		// 	// 	var index = e.getSource().getBinding("value").getContext().getPath().substring(e.getSource().getBinding("value").getContext().getPath()
		// 	// 		.lastIndexOf("/") + 1, e.getSource().getBinding("value").getContext().getPath().length);
		// 	// 	if (value > 0) { //Check whether table has any selected contexts
		// 	// 		var items = contexts.map(function (c) {
		// 	// 			return c.getObject();
		// 	// 		});

		// 	// 		if (items.length) {
		// 	// 			for (var i = 0; i < items.length; i++) {
		// 	// 				if (parseInt(index) === i) {
		// 	// 					items[i].Menge = e.getParameter("value");
		// 	// 				}
		// 	// 				data.InvoiceAmt = parseInt(data.InvoiceAmt) + (parseInt(items[i].Menge) * (parseFloat(items[i].Netpr))); // + parseFloat(items[i].Tax)));
		// 	// 				// ((parseInt(items[i].Menge) * (parseFloat(items[i].Netpr) + parseFloat(items[i].Tax)));
		// 	// 				data.InvoiceAmt = parseFloat(data.InvoiceAmt).toFixed(2);

		// 	// 				this.asnModel.refresh(true);
		// 	// 			}
		// 	// 		}

		// 	// 	} else {
		// 	// 		MessageBox.information("Please enter quantity for selected items");
		// 	// 	}
		// 	// } else {
		// 	// 	MessageBox.information("Please select the item");
		// 	// 	e.getSource().setValue();
		// 	// }
		// },

		onNavBack: function () {
			// this.router.navTo("PoMaster");
			this.byId("FromDateId").setValue();
			this.byId("ToDateId").setValue();
			history.go(-1);
		},
		onAsnSave: function (event) {
			var that = this;
			var oModel = this.getOwnerComponent().getModel();
			this.data = this.asnModel.getData();
			var form = {
				"UnitCode": sessionStorage.getItem("unitCode"),
				"CreatedBy": "Manikandan",
				"CreatedIP": "",
				"RowDetails": []
			};
			var oTable = this.getView().byId("AsnCreateTable");
			var contexts = oTable.getSelectedContexts();
			if (this.data.BillNumber) {
				if (!this.data.BillDate) {
					MessageBox.error("Please fill the Invoice Date");
					return;
				}
			} else {
				MessageBox.error("Please fill the Invoice Number");
				return;
			}
			if (!contexts.length) {
				MessageBox.error("No Item Selected");
				return;
			} else {
				var items = contexts.map(function (c) {
					return c.getObject();
				});
				for (var i = 0; i < items.length; i++) {

					if (!items[i].BalanceQty) {
						MessageBox.error("ASN Quantity is required for selected items");
						sap.ui.core.BusyIndicator.hide();

						return;
					} else {
						var row = {
							"BillLineNumber": items[i].BillLineNumber, 
							"BillNumber": this.data.BillNumber, 
							"BillDate": this.data.BillDate, 
							"ScheduleNumber": items[i].ScheduleNumber, 
							"ScheduleLineNumber": items[i].ScheduleLineNumber,
							"PONumber": items[i].CustomerReferenceNumber_PoNum,
							"IAIItemCode": items[i].ItemCode,  
							"UOM": items[i].ItemUOM,
							"HSNCode": items[i].HsnCode,
							"Rate": items[i].ItemRate,
							"Quantity": items[i].BalanceQty,
							"PackingAmount": items[i].PFA,
							"Freight": items[i].FFC,
							"OtherCharges": items[i].OT1,
							"AssValue": items[i].ASSValue,
							"IGST": items[i].IGP,
							"IGA": items[i].IGA, 
							"CGST": items[i].CGP, 
							"CGA": items[i].CGA,
							"SGST": items[i].SGP,
							"SGA": items[i].SGA,
							"TCS": items[i].TCS, 
							"TCA": items[i].TCA, 
							"LineValue": items[i].LineValue,
							"TransportName": this.data.TransportName, 
							"TransportMode": this.data.TransportMode, 
							"DocketNumber": this.data.DocketNumber, 
							"GRDate": this.data.GRDate,
    						"Packaging": items[i].Packaging, 
							"WeightPerKG": items[i].WeightPerKG, 
							"EwayBillNumber": this.data.EwayBillNumber, 
							"EwayBillDate": this.data.EwayBillDate,
							"MillNumber": this.data.MillNumber, 
							"MillName": this.data.MillName, 
							"PDIRNumber": this.data.PDIRNumber, 
							"HeatNumber": this.data.HeatNumber, 
							"BatchNumber": this.data.BatchNumber, 
							"ManufacturingMonth": this.data.ManufacturingMonth
						};
						form.RowDetails.push(row);
					}

				}
				var formdatastr = JSON.stringify(form);
				this.hardcodedURL = "";
                if (window.location.href.includes("launchpad")) {
                    this.hardcodedURL = "https://impautosuppdev.launchpad.cfapps.ap10.hana.ondemand.com/da8bb600-97b5-4ae9-822d-e6aa134d8e1a.onboarding.spfiorionboarding-0.0.1";
                }
                var sPath = this.hardcodedURL + `/v2/odata/v4/catalog/submitFormData`;
                $.ajax({
                    type: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    url: sPath,
                    data: JSON.stringify({
                        data: formdatastr
                    }),
                    context: this,
                    success: function (data, textStatus, jqXHR) {
						MessageBox.success("ASN created succesfully");
                        this.onAsnSaveDB();
                    }.bind(this),
                    error: function (error) {
                        MessageBox.error("ASN creation failed");
                    }
                });
			}
			
		},
		onAsnSaveDB: function () {
			var that = this;
			//this.getView().byId("MaterialSearchId").setValue("");
			//this.onRowSelect(event);
			var oModel = this.getOwnerComponent().getModel();
			//this.calculateInvoiceAmt();
			//var invoiceAmount = this.getView().byId("invoiceAmtId").getValue().trim();
			//var unplannedAmount = this.getView().byId("unplannedAmtId").getValue().trim();
			//unplannedAmount = Math.abs(parseFloat(unplannedAmount));
			//unplannedAmount = unplannedAmount ? unplannedAmount : 0;
			//var InvoiceVal = +invoiceAmount + +unplannedAmount;
			//this.getView().byId("invoiceValueId").setValue(InvoiceVal.toFixed(2));

			// that.onDeliveryCost();

			//var ButtonText = event.getSource().getText();
			this.data = this.asnModel.getData();
			var ASNHeaderData = {
				"CustomerReferenceNumber_PoNum": this.data[0].CustomerReferenceNumber_PoNum,
				"AsnNum": this.data.AsnNum,
				"InvoiceDate": this.data.BillDate,
				"InvoiceNum": this.data.BillNumber,
				"DocketNumber": this.data.DocketNumber,
				"GRDate": this.data.GRDate,
				"TransportName": this.data.TransportName,
				"TransportMode": this.data.TransportMode,
				"EwayBillNumber": this.data.EwayBillNumber,
				"EwayBillDate": this.data.EwayBillDate,
				"MillNumber": this.data.MillNumber,
				"MillName": this.data.MillName,
				"PDIRNumber": this.data.PDIRNumber,
				"HeatNumber": this.data.HeatNumber,
				"BatchNumber": this.data.BatchNumber,
				"ManufacturingMonth": this.data.ManufacturingMonth
			};
			var ASNItemData = [];
			// var createData = {
			// 	"Update": false,
			// 	"DraftAsn": false,
			// 	"AsnNum": this.data.AsnNum,
			// 	"Buyer_Name": this.data.Buyer_Name,
			// 	"Currency": this.data.Currency,
			// 	"InvoiceAmt": this.data.InvoiceAmt.toString(),
			// 	"InvoiceVal": this.data.InvoiceVal.toString(),
			// 	"UnplannedCost": this.data.UnplannedCost.toString(),
			// 	"UnplannedCost_text": this.data.UnplannedCost_text,
			// 	"InvoiceDate": this.data.InvoiceDate,
			// 	"InvoiceNum": this.data.InvoiceNum,
			// 	"Po_No": this.data.Po_No,
			// 	"Purchase_Group_Desc": this.data.Purchase_Group_Desc,
			// 	"ShipTime": this.data.ShipTime,
			// 	"Total_Amount": this.data.Total_Amount.toString(),
			// 	"Vendor_No": this.data.Vendor_No,
			// 	"Werks": this.data.Werks,
			// 	"asnheadertoasnitemnav": []
			// };
			// if (ButtonText === "Save as Draft") {
			// 	var DraftAsn = true;
			// } 
			// else {
			// 	if (this.getView().byId("UploadCollection").getItems().length <= 0) {
			// 		MessageBox.error("Atleast One attachment is required.");
			// 		return;
			// 	}
			// }
			// createData.Total_Amount = this.Amount;
			// createData.Vendor_No = this.Vendor_No;
			var oTable = this.getView().byId("AsnCreateTable");
			var contexts = oTable.getSelectedContexts();
			// !createData.InvoiceNum || || !createData.InvoiceDate
			//uncomment 300-312
			if (ASNHeaderData.InvoiceNum) {
				if (!ASNHeaderData.InvoiceDate) {
					MessageBox.error("Please fill the Invoice Date");
					return;
				}
			} else {
				MessageBox.error("Please fill the Invoice Number");
				return;
			}
			// if (!ASNHeaderData.InvoiceAmt) {
			// 	MessageBox.error("Please fill all the required Information");
			// 	return;
			// } 
			if (!contexts.length) {
				MessageBox.error("No Item Selected");
				return;
			} else {
				var items = contexts.map(function (c) {
					return c.getObject();
				});

				for (var i = 0; i < items.length; i++) {

					if (!items[i].BalanceQty) {
						MessageBox.error("ASN Quantity is required for selected items");
						sap.ui.core.BusyIndicator.hide();

						return;
					} else {
						ASNItemData.push(items[i]);
						//if (items[i].Status === 'CNR') { // If status is confirmation not reqd. check PO quantity
						// if (parseFloat(items[i].Menge) <= (parseFloat(items[i].BalanceQty) - parseFloat(items[i].Asn_Created))) {
						// 	ASNItemData.push(items[i]);
						// } else {
						// 	MessageBox.error("ASN Quantity is greater than the balance quantity for " + items[i].Maktx);
						// 	sap.ui.core.BusyIndicator.hide();
						// 	return;
						// }
						//} 
						// else { // If status is confirmation reqd. check confirmation quantity
						// 	if (parseFloat(items[i].Menge) <= (parseFloat(items[i].Total_Qty) - parseFloat(items[i].Asn_Created))) {
						// 		createData.asnheadertoasnitemnav.push(items[i]);
						// 	} else {
						// 		MessageBox.error("ASN Quantity is greater than the balance quantity for " + items[i].Maktx);
						// 		sap.ui.core.BusyIndicator.hide();
						// 		return;
						// 	}
						// }
					}

				}
				oModel.create("/ASNListHeader", ASNHeaderData, null, function (oData, response) {
					MessageBox.success("ASN created succesfully");
					// that.asn = oData.AsnNum;
					// that.year = oData.Fis_Year;
					// var ASN = oData.AsnNum + "/" + oData.Fis_Year;
					//that.onStartUpload();
					//MessageBox.success("ASN " + oData.AsnNum + "/" + oData.Fis_Year + " created succesfully  ", {
					// MessageBox.success("ASN created succesfully  ", {
					// 	actions: [sap.m.MessageBox.Action.OK],
					// 	icon: sap.m.MessageBox.Icon.SUCCESS,
					// 	title: "Success",
					// 	onClose: function (oAction) {
					// 		if (oAction === "OK") {
					// 			sp.fiori.purchaseorder.controller.formatter.onNavBack();
					// 		}
					// 	}
					// });

				}, function (oError) {
					try {
						var error = JSON.parse(oError.response.body);
						MessageBox.error(error.error.message.value);
					} catch (err) {
						var errorXML = jQuery.parseXML(oError.getParameter("responseText")).querySelector("message").textContent;
						MessageBox.error(errorXML);
					}
				});
				for (var i = 0; i < ASNItemData.length; i++) {
					oModel.create("/ASNList", ASNItemData[i], null, function (oData, response) {
						// that.asn = oData.AsnNum;
						// that.year = oData.Fis_Year;
						// var ASN = oData.AsnNum + "/" + oData.Fis_Year;
						//that.onStartUpload();
						//MessageBox.success("ASN " + oData.AsnNum + "/" + oData.Fis_Year + " created succesfully  ", {
						MessageBox.success("ASN created succesfully  ", {
							actions: [sap.m.MessageBox.Action.OK],
							icon: sap.m.MessageBox.Icon.SUCCESS,
							title: "Success",
							onClose: function (oAction) {
								if (oAction === "OK") {
									sp.fiori.purchaseorder.controller.formatter.onNavBack();
								}
							}
						});

					}, function (oError) {
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
			this.calculateInvoiceAmt();
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

					var nMenge = parseFloat(items[i].Menge) / parseFloat(items[i].PerUnit);
					// data.InvoiceAmt = parseFloat(data.InvoiceAmt) + (parseFloat(items[i].Menge) * (parseFloat(items[i].Netpr) + parseFloat(items[i].Tax)));
					// var NetPr = (parseFloat(items[i].Menge) * (parseFloat(items[i].Netpr))).toFixed(2);
					// var Cgst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Cgst))).toFixed(2);
					// var Igst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Igst))).toFixed(2);
					// var Sgst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Sgst))).toFixed(2);

					var NetPr = (nMenge * (parseFloat(items[i].Netpr))).toFixed(2);
					var Cgst = (nMenge * (parseFloat(items[i].Cgst))).toFixed(2);
					var Igst = (nMenge * (parseFloat(items[i].Igst))).toFixed(2);
					var Sgst = (nMenge * (parseFloat(items[i].Sgst))).toFixed(2);

					data.InvoiceAmt = parseFloat(data.InvoiceAmt) + parseFloat(NetPr) + parseFloat(Cgst) + parseFloat(Igst) + parseFloat(Sgst);

					data.InvoiceAmt = parseFloat(data.InvoiceAmt).toFixed(2);

					//data.InvoiceAmt = Math.round(data.InvoiceAmt);

					var InvoiceVal = +this.asnModel.getData().InvoiceAmt + +this.asnModel.getData().UnplannedCost;

					//InvoiceVal = Math.round(data.InvoiceAmt);
					this.asnModel.getData().InvoiceVal = InvoiceVal.toFixed(2);
				}
			} else {
				data.InvoiceAmt = 0.00;

				data.InvoiceAmt = parseFloat(data.InvoiceAmt).toFixed(2);
				var InvoiceVal = +data.InvoiceAmt + +this.asnModel.getData().UnplannedCost;

				//InvoiceVal = Math.round(InvoiceVal);
				this.asnModel.getData().InvoiceVal = InvoiceVal.toFixed(2);
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
							path: 'ShipDate',
							operator: sap.ui.model.FilterOperator.LE,
							value1: ToDate
						}),
						new sap.ui.model.Filter({
							path: 'ShipDate',
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
		onDateFilterClear: function (event) {
			this.byId("FromDateId").setValue("");
			this.byId("ToDateId").setValue("");
			var oBindings = this.getView().byId("AsnCreateTable").getBinding("items");
			var Filter = new sap.ui.model.Filter(
				new sap.ui.model.Filter({
					path: 'Eindt',
					operator: sap.ui.model.FilterOperator.CP,
					value1: ""
				})
			);
			oBindings.filter(Filter);

		},
		onDeliveryCost: function (event) {
			var invoiceAmount = this.getView().byId("invoiceAmtId").getValue().trim();
			var unplannedAmount = this.getView().byId("unplannedAmtId").getValue().trim();
			unplannedAmount = Math.abs(parseFloat(unplannedAmount));
			unplannedAmount = unplannedAmount ? unplannedAmount : 0;
			var InvoiceVal = +invoiceAmount + +unplannedAmount;
			this.getView().byId("invoiceValueId").setValue(InvoiceVal.toFixed(2));
		},
		onEditPress: function (event) {
			this.byId("invoiceValueId").setEditable(true);
		},
		onLinkPress: function (oEvent) {
			var that = this;
			var LineItemData = oEvent.getSource().getParent().getBindingContext("asnModel").getObject();
			if (!this._oPopoverFragment) {
				this._oPopoverFragment = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.DatePopoverFragment", this);
				this._oPopoverFragment.setModel(this.dateConfirmationModel);
				this.getView().addDependent(this._oPopoverFragment);
			}
			this.oDataModel.read("/ConfirmationDateSet?$filter=Ebeln eq '" + LineItemData.Po_No + "'and Ebelp  eq '" + LineItemData.Ebelp + "'",
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
		},
		onInvNoChange: function (oEvent) {

			if (oEvent.getParameter("value") === "") {
				this.getView().byId("DP1").setEnabled(false);
				this.getView().byId("DP1").setValue("");
			} else {
				this.getView().byId("DP1").setEnabled(true);
			}
		},
		onFromDateChange: function (oEvent) {
			var FromDate = this.getView().byId("FromDateId").getDateValue();
			this.getView().byId("ToDateId").setMinDate(FromDate);
		},

		onMaterialLiveChange: function (oEvent) {
			var search = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
			var afilters = [];

			if (search) {
				// var values = search.split(" ");
				// if (values.length) {
				// 	for (var i = 0; i < values.length; i++) {
				// 		if (values[i].trim()) {
				afilters.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, search));
				afilters.push(new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, search));

				//		afilters.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, values[i]));
				//		afilters.push(new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, values[i]));
				// 		}
				// 	}
				// }
			} else {
				afilters.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, ""));
				afilters.push(new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, ""));
				//this.calculateInvoiceAmt();
				this.onRowSelect(oEvent);

			}
			// afilters.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, search));
			// afilters.push(new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, search));
			this.byId("AsnCreateTable").getBinding("items").filter(new sap.ui.model.Filter({
				filters: afilters
			}));
		},

		onSwitchChange: function (e) {
			const val = e.getParameter("state");
			var obj = e.getSource().getParent().getBindingContext("asnModel").getObject();
			if (val == true)
				obj.TaxChange = "X";
			else
				obj.TaxChange = "";
			this.asnModel.refresh(true);
		},

		onQuanChange: function (e) {
			const val = e.getParameter("newValue"),
				obj = e.getSource().getParent().getBindingContext("asnModel").getObject();
			var Meins = obj.Meins;
			obj.Menge = val;
			if (Meins == "EA") {
				if (val.includes(".")) {
					MessageBox.error("Fractional Values are not allowed");
					e.getSource().setValue(parseInt(val, 10).toString());
					return;
				}
			}
			const pkgMatQty = parseFloat(val) / parseFloat(obj.SOQ);
			obj.PkgMatQty = isNaN(pkgMatQty) ? "0" : isFinite(pkgMatQty) === false ? "0" : (Math.ceil(pkgMatQty)).toString();

			var oTable = this.getView().byId("AsnCreateTable");
			var contexts = oTable.getSelectedContexts();

			for (var i = 0; i < contexts.length; i++) {
				var index = contexts[i].getPath().substring(contexts[i].getPath().lastIndexOf("/") + 1);
				var item = contexts[i].getProperty();
				for (var j = 0; j < oTable.getItems().length; j++) {
					// if (oTable.getItems()[index - 1]) {
					var previousItem = oTable.getItems()[j].getBindingContext("asnModel").getProperty();
					var previousIndex = oTable.getItems()[j].getBindingContext("asnModel").getPath()
						.substring(oTable.getItems()[j].getBindingContext("asnModel").getPath().lastIndexOf("/") + 1);
					if ((previousItem.Matnr === item.Matnr && previousItem.Ebelp === item.Ebelp) && parseInt(previousIndex) < parseInt(index) &&
						(!oTable.getItems()[j].getSelected() || (previousItem.Menge !== this.checkData[previousIndex].Menge))) {
						var forwardItem = oTable.getItems()[j + 1].getBindingContext("asnModel").getProperty();
						if (forwardItem.Matnr === item.Matnr && forwardItem.Ebelp === item.Ebelp) {
							oTable.getItems()[j + 1].setSelected(false);
						}
					}
				}
			}

			var selected = e.getSource().getParent().getProperty("selected");
			var data = this.asnModel.getData();
			data.ASNamt = 0;
			var index = e.getSource().getParent().getBindingContext("asnModel").getPath().split("/")[3];
			var items = contexts.map(function (c) {
				return c.getObject();
			});

			data.asnheadertoasnitemnav.results[index].Menge = e.getSource().getValue();

			for (var i = 0; i < items.length; i++) {

				if (!items[i].Netpr) {
					items[i].Netpr = 0;
				}
				if (!items[i].Cgst) {
					items[i].Cgst = 0;
				}
				if (!items[i].Igst) {
					items[i].Igst = 0;
				}
				if (!items[i].Sgst) {
					items[i].Sgst = 0;
				}

				// data.ASNamt = parseFloat(data.ASNamt) + (parseFloat(items[i].Menge) * ((parseFloat(items[i].Netpr)) + (parseFloat(items[i].Cgst)) +
				// 	(parseFloat(items[i].Igst)) + (parseFloat(items[i].Sgst))));
				var NetPr = (parseFloat(items[i].Menge) * (parseFloat(items[i].Netpr))).toFixed(2);
				var Cgst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Cgst))).toFixed(2);
				var Igst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Igst))).toFixed(2);
				var Sgst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Sgst))).toFixed(2);

				data.ASNamt = parseFloat(data.ASNamt) + parseFloat(NetPr) + parseFloat(Cgst) + parseFloat(Igst) + parseFloat(Sgst);
				// data.ASNamt = parseFloat(data.ASNamt).toFixed(2);
			}
			// }
			data.ASNamt = parseFloat(data.ASNamt).toFixed(2);

			//	data.ASNamt = Math.round(data.ASNamt);

			data.InvoiceAmt = data.ASNamt;
			var InvoiceVal = +this.asnModel.getData().InvoiceAmt + +this.asnModel.getData().UnplannedCost;
			//	this.asnModel.getData().InvoiceVal = Math.round(InvoiceVal.toFixed(2));
			this.asnModel.getData().InvoiceVal = InvoiceVal.toFixed(2);

			this.asnModel.refresh(true);

		},
		// onRowSelect: function (e) {
		// 	var data = this.asnModel.getData();
		// 	data.ASNamt = 0;
		// 	data.InvVal = 0;
		// 	// this.asnModel.refresh(true);
		// 	var oTable = this.getView().byId("AsnCreateTable");
		// 	var contexts = oTable.getSelectedContexts();

		// 	for (var i = 0; i < contexts.length; i++) {
		// 		var index = contexts[i].getPath().substring(contexts[i].getPath().lastIndexOf("/") + 1);
		// 		var item = contexts[i].getProperty();
		// 		for (var j = 0; j < oTable.getItems().length; j++) {
		// 			// if (oTable.getItems()[index - 1]) {
		// 			var previousItem = oTable.getItems()[j].getBindingContext("asnModel").getProperty();
		// 			var previousIndex = oTable.getItems()[j].getBindingContext("asnModel").getPath()
		// 				.substring(oTable.getItems()[j].getBindingContext("asnModel").getPath().lastIndexOf("/") + 1);
		// 			if ((previousItem.Matnr === item.Matnr && previousItem.Ebelp === item.Ebelp) && parseInt(previousIndex) < parseInt(index) &&
		// 				(!oTable.getItems()[j].getSelected() || (previousItem.Menge !== this.checkData[previousIndex].Menge))) {
		// 				var forwardItem = oTable.getItems()[j + 1].getBindingContext("asnModel").getProperty();
		// 				if (forwardItem.Matnr === item.Matnr && forwardItem.Ebelp === item.Ebelp) {
		// 					oTable.getItems()[j + 1].setSelected(false);
		// 				}
		// 				// MessageBox.error("Please select the schedule line item " + previousItem.Etenr);
		// 				// return;
		// 			}
		// 		}
		// 		// }
		// 	}

		// 	contexts = oTable.getSelectedContexts();
		// 	if (contexts.length) { //Check whether table has any selected contexts
		// 		var items = contexts.map(function (c) {
		// 			return c.getObject();
		// 		});

		// 		if (items.length) {
		// 			for (var i = 0; i < items.length; i++) {
		// 				if (parseFloat(items[i].Menge) >= 0) {
		// 					if (!items[i].Netpr) {
		// 						items[i].Netpr = "0";
		// 					}
		// 					if (!items[i].Cgst) {
		// 						items[i].Cgst = "0";
		// 					}
		// 					if (!items[i].Igst) {
		// 						items[i].Igst = "0";
		// 					}
		// 					if (!items[i].Sgst) {
		// 						items[i].Sgst = "0";
		// 					}
		// 					var nMenge = parseFloat(items[i].Menge) / parseFloat(items[i].PerUnit);
		// 					// data.ASNamt = parseFloat(data.ASNamt) + (parseFloat(items[i].Menge) * ((parseFloat(items[i].Netpr)) + (parseFloat(items[i].Cgst)) +
		// 					// 	(parseFloat(items[i].Igst)) + (parseFloat(items[i].Sgst))));	
		// 					// var NetPr = (parseFloat(items[i].Menge) * (parseFloat(items[i].Netpr))).toFixed(2);
		// 					// var Cgst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Cgst))).toFixed(2);
		// 					// var Igst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Igst))).toFixed(2);
		// 					// var Sgst = (parseFloat(items[i].Menge) * (parseFloat(items[i].Sgst))).toFixed(2);
		// 					var NetPr = (nMenge * (parseFloat(items[i].Netpr))).toFixed(2);
		// 					var Cgst = (nMenge * (parseFloat(items[i].Cgst))).toFixed(2);
		// 					var Igst = (nMenge * (parseFloat(items[i].Igst))).toFixed(2);
		// 					var Sgst = (nMenge * (parseFloat(items[i].Sgst))).toFixed(2);

		// 					data.ASNamt = parseFloat(data.ASNamt) + parseFloat(NetPr) + parseFloat(Cgst) + parseFloat(Igst) + parseFloat(Sgst);
		// 					data.InvVal = parseFloat(data.InvVal) + (parseFloat(items[i].NetprVen) * nMenge);
		// 				} else {
		// 					MessageBox.information("Please enter quantity for selected items");
		// 					return;
		// 				}

		// 			}
		// 			data.ASNamt = parseFloat(data.ASNamt).toFixed(2);

		// 			//data.ASNamt = Math.round(data.ASNamt);

		// 			data.InvoiceAmt = data.ASNamt;

		// 			data.InvVal = parseFloat(data.InvVal).toFixed(2);

		// 			//data.InvVal = Math.round(data.InvVal);

		// 			data.InvoiceVal = data.InvVal;

		// 			// var unplannedAmount = this.asnModel.getData().UnplannedCost;

		// 			// unplannedAmount = Math.abs(parseFloat(unplannedAmount));
		// 			// unplannedAmount = unplannedAmount ? unplannedAmount : 0;
		// 			// var InvoiceVal = +this.asnModel.getData().InvoiceAmt + unplannedAmount;

		// 			// this.asnModel.getData().InvoiceVal = Math.round(InvoiceVal.toFixed(2));

		// 			this.asnModel.refresh(true);
		// 		}
		// 	} else {
		// 		data.ASNamt = 0.00;
		// 		data.InvoiceAmt = data.ASNamt;

		// 		var unplannedAmount = this.asnModel.getData().UnplannedCost;

		// 		unplannedAmount = Math.abs(parseFloat(unplannedAmount));
		// 		unplannedAmount = unplannedAmount ? unplannedAmount : 0;
		// 		var InvoiceVal = +data.InvoiceAmt + unplannedAmount;

		// 		this.asnModel.getData().InvoiceVal = InvoiceVal.toFixed(2);

		// 		this.asnModel.refresh(true);
		// 	}

		// 	// this.onSelectionChangeEnableDisableCheck(e);
		// 	// else {
		// 	// 	MessageBox.information("Please select the item");
		// 	// 	e.getSource().setValue();
		// 	// }
		// },
		onQuantityChange : function(e){
			const val = e.getParameter("newValue"),
				obj = e.getSource().getParent().getBindingContext("asnModel").getObject();
				var path = e.getSource().getParent().getBindingContextPath().split("/")[1];
			var data = this.asnModel.getData();
			data[path].BalanceQty = val;	
			data[path].ASSValue = parseFloat(data[path].BalanceQty) * parseFloat(data[path].ItemRate);
			if(data[path].PFA){
				data[path].ASSValue = parseFloat(data[path].ASSValue) + parseFloat(data[path].PFA);
			}
			if(data[path].FFC){
				data[path].ASSValue = parseFloat(data[path].ASSValue) + parseFloat(data[path].FFC);
			}
			if(data[path].OT1){
				data[path].ASSValue = parseFloat(data[path].ASSValue) + parseFloat(data[path].OT1);
			}	
			this.asnModel.refresh(true);
		},
		onPackChange : function(e){
			const val = e.getParameter("value") || 0;
			var path = e.getSource().getParent().getBindingContextPath().split("/")[1];	
			var data = this.asnModel.getData();	
			data[path].PFA = val;
			data[path].ASSValue = (parseFloat(data[path].BalanceQty) * parseFloat(data[path].ItemRate)) + parseFloat(data[path].PFA) + parseFloat(data[path].FFC) + parseFloat(data[path].OT1);	
			this.asnModel.refresh(true);
		},
		onFreightChange : function(e){
			const val = e.getParameter("value") || 0;
			var path = e.getSource().getParent().getBindingContextPath().split("/")[1];	
			var data = this.asnModel.getData();	
			data[path].FFC = val;	
			data[path].ASSValue = (parseFloat(data[path].BalanceQty) * parseFloat(data[path].ItemRate)) + parseFloat(data[path].PFA) + parseFloat(data[path].FFC) + parseFloat(data[path].OT1);
			this.asnModel.refresh(true);
		},
		onOtherChange : function(e){
			const val = e.getParameter("value") || 0;
			var path = e.getSource().getParent().getBindingContextPath().split("/")[1];	
			var data = this.asnModel.getData();	
			data[path].OT1 = val;	
			data[path].ASSValue = (parseFloat(data[path].BalanceQty) * parseFloat(data[path].ItemRate)) + parseFloat(data[path].PFA) + parseFloat(data[path].FFC) + parseFloat(data[path].OT1);
			this.asnModel.refresh(true);
		}

	});

});