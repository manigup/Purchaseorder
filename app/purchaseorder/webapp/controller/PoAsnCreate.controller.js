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
			//this.initializeScheduleNumber();
			this.byId("uploadSet").attachEvent("openPressed", this.onOpenPressed, this);
		},
		handleRouteMatched: function (event) {
			var oModel = this.getView().getModel();
			var oUploadSet = this.byId("uploadSet");
			oUploadSet.removeAllItems();

			if (event.getParameter("name") === "PoAsnCreate") {
				var that = this;
				var datePicker = this.getView().byId("DP1");

				datePicker.addDelegate({
					onAfterRendering: function () {
						datePicker.$().find('INPUT').attr('disab1qled', true).css('color', '#000000');
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
				this.Po_Num = Po_Num.replace(/-/g, '/');
				//this.Po_Num = "19/01P/03/00001";
				this.Amount = event.getParameter("arguments").Amount;
				this.Vendor_No = event.getParameter("arguments").Vendor_No;
				var unitCode = sessionStorage.getItem("unitCode") || "P01";
				this.AddressCodePO = sessionStorage.getItem("AddressCodePO") || 'DIE-01-02'
				//var unitCode = "P01";
				var oModel = this.getOwnerComponent().getModel();

				this.getView().byId("AsnCreateTable").removeSelections(true);
				//var request = `/ASNItems?unitCode=${unitCode}&docNum=${this.Po_Num}`;
				var request = "/PurchaseOrders";
				oModel.read(request, {
					urlParameters: {
						"$expand": "DocumentRows",
                        AddressCode: this.AddressCodePO,
                        UnitCode: unitCode
                    },
					success: function (oData) {
						var filteredPurchaseOrder = oData.results.find(po => po.PoNum === that.Po_Num);
						if (filteredPurchaseOrder) {
							that.asnModel.setData(filteredPurchaseOrder);
							that.asnModel.refresh(true);
							var asnModelData = that.getView().getModel("asnModel").getData();
							if(asnModelData.HasAttachments === "Invoice Submitted")
							{
								that.getHeaderDetails();
							}
							//that.initializeScheduleNumber();
						} else {
							MessageBox.error("Purchase order not found");
						}
					},
					error: function (oError) {
						var value = JSON.parse(oError.response.body);
						MessageBox.error(value.error.message.value);
					}
				});
				sap.ui.core.BusyIndicator.hide();
			}
			// this.asnModel.refresh(true); 
		},
		getHeaderDetails: function () {
			var that = this;
			var oModel = this.getView().getModel();
				oModel.read("/ASNListHeader", {
					success: function (oData) {
						let poNum = that.Po_Num.replace(/\//g, '-');
						var filteredPurchaseOrder = oData.results.find(po => po.PNum_PoNum === poNum);
						if (filteredPurchaseOrder) {
							var asnModelData = that.getView().getModel("asnModel").getData();
							asnModelData.BillNumber = filteredPurchaseOrder.BillNumber;
							asnModelData.BillDate = filteredPurchaseOrder.BillDate;
							asnModelData.DocketNumber = filteredPurchaseOrder.DocketNumber;
							asnModelData.GRDate = filteredPurchaseOrder.GRDate;
							asnModelData.TransportName = filteredPurchaseOrder.TransportName;
							asnModelData.TransportMode = filteredPurchaseOrder.TransportMode;
							asnModelData.EwayBillNumber = filteredPurchaseOrder.EwayBillNumber;
							asnModelData.EwayBillDate = filteredPurchaseOrder.EwayBillDate;
							asnModelData.MillNumber = filteredPurchaseOrder.MillNumber;
							asnModelData.MillName = filteredPurchaseOrder.MillName;
							asnModelData.PDIRNumber = filteredPurchaseOrder.PDIRNumber;
							asnModelData.HeatNumber = filteredPurchaseOrder.HeatNumber;
							asnModelData.BatchNumber = filteredPurchaseOrder.BatchNumber;
							asnModelData.ManufacturingMonth = filteredPurchaseOrder.ManufacturingMonth;
							that.asnModel.refresh(true);
							that._fetchFilesForPoNum(poNum);
							/*
							var attachments = [];
							attachments.push(filteredPurchaseOrder);
							attachments[0].Url = this.getView().getModel().sServiceUrl + `/ASNListHeader(PNum_PoNum='${that.Po_Num}')/$value`;
							that.detailHeaderModel.setData(attachments);
							*/
							that.detailHeaderModel.refresh(true);
						} else {
							MessageBox.error("Purchase order not found");
						}
					}.bind(this),
					error: function (oError) {
						var value = JSON.parse(oError.response.body);
						MessageBox.error(value.error.message.value);
					}.bind(this)
				});
		},
		_fetchFilesForPoNum: function (poNum) {
			var oModel = this.getView().getModel();
			var oUploadSet = this.byId("uploadSet");
			oUploadSet.removeAllItems();
		
			oModel.read("/Files", {
				filters: [new sap.ui.model.Filter("PNum_PoNum", sap.ui.model.FilterOperator.EQ, poNum)],
				success: function (oData) {
					oData.results.forEach(function(fileData) {
						var oItem = new sap.m.upload.UploadSetItem({
							fileName: fileData.fileName,
							mediaType: fileData.mediaType,
							url: fileData.url,
							attributes: [
								new sap.m.ObjectAttribute({ title: "Uploaded By", text: fileData.createdBy }),
								new sap.m.ObjectAttribute({ title: "Uploaded on", text: fileData.createdAt }),
								new sap.m.ObjectAttribute({ title: "File Size", text: fileData.size.toString() })
							]
						});
	
						oUploadSet.addItem(oItem);
					});
				},
				error: function (oError) {
					console.log("Error: "+ oError)
				}
			});
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
		onNavBack: function () {
			// this.router.navTo("PoMaster");
			history.go(-1);
		},
		onAsnSaveDB: function () {
			var that = this;
			var oModel = this.getOwnerComponent().getModel();

			this.data = this.asnModel.getData();
			var ASNHeaderData = {
				"PNum_PoNum": this.data.PoNum.replace(/\//g, '-'),
				"AsnNum": this.data.AsnNum,
				"BillDate": this.data.BillDate,
				"BillNumber": this.data.BillNumber,
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
				"ManufacturingMonth": this.data.ManufacturingMonth,
				"PlantName": this.data.PlantName,
				"PlantCode": this.data.PlantCode,
				"VendorCode": this.data.VendorCode
			};

			// var ASNItemData = [];
			// var oTable = this.getView().byId("AsnCreateTable");
			// var contexts = oTable.getSelectedContexts();

			if (!ASNHeaderData.BillNumber) {
				MessageBox.error("Please fill the Invoice Number");
				return;
			} else if (!ASNHeaderData.BillDate) {
				MessageBox.error("Please fill the Invoice Date");
				return;
			}
			if (this.getView().byId("uploadSet").getItems().length <= 0) {
				MessageBox.error("Please upload invoice.");
				return;
			}
				oModel.create("/ASNListHeader", ASNHeaderData, {
					success: function (oData) {
						MessageBox.success("Invoice submitted successfully.");
						sp.fiori.purchaseorder.controller.formatter.onNavBack();
					},
					error: function (oError) {
						MessageBox.error("Error submitting invoice: " + oError.message);
					}
				});
		},
		// onAsnSave: function (event) {
		// 	var that = this;
		// 	var oModel = this.getOwnerComponent().getModel();
		// 	this.data = this.asnModel.getData();
		// 	var form = {
		// 		"UnitCode": sessionStorage.getItem("unitCode") || "P01",
		// 		"CreatedBy": "Manikandan",
		// 		"CreatedIP": "",
		// 		"RowDetails": []
		// 	};
		// 	var oTable = this.getView().byId("AsnCreateTable");
		// 	var contexts = oTable.getSelectedContexts();
		// 	if (this.data.BillNumber) {
		// 		if (!this.data.BillDate) {
		// 			MessageBox.error("Please fill the Invoice Date");
		// 			return;
		// 		}
		// 	} else {
		// 		MessageBox.error("Please fill the Invoice Number");
		// 		return;
		// 	}
		// 	if (this.getView().byId("UploadCollection").getItems().length <= 0) {
		// 		MessageBox.error("Atleast One attachment is required.");
		// 		return;
		// 	}
		// 	if (!contexts.length) {
		// 		MessageBox.error("No Item Selected");
		// 		return;
		// 	} else {
		// 		var items = contexts.map(function (c) {
		// 			return c.getObject();
		// 		});
		// 		for (var i = 0; i < items.length; i++) {

		// 			if (!items[i].BalanceQty) {
		// 				MessageBox.error("ASN Quantity is required for selected items");
		// 				sap.ui.core.BusyIndicator.hide();

		// 				return;
		// 			} else {
		// 				if (this.data.BillDate) {
		// 					var date = this.data.BillDate.substring(4, 6) + "/" + this.data.BillDate.substring(6, 8) + "/" + this.data.BillDate.substring(0, 4);
		// 					var DateInstance = new Date(date);
		// 					var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
		// 					pattern: "dd/MM/yyyy"
		// 					});
		// 					this.BillDate = dateFormat.format(DateInstance);
		// 					}
		// 					if (this.data.ManufacturingMonth) {
		// 						var date = this.data.ManufacturingMonth.substring(4, 6) + "/" + this.data.ManufacturingMonth.substring(6, 8) + "/" + this.data.ManufacturingMonth.substring(0, 4);
		// 						var DateInstance = new Date(date);
		// 						var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
		// 						pattern: "dd/MM/yyyy"
		// 						});
		// 						this.ManufacturingMonth = dateFormat.format(DateInstance);
		// 						}
		// 						if(items[i].IGP === undefined){
		// 							items[i].IGP = "";
		// 						}
		// 						if(items[i].IGA === undefined){
		// 							items[i].IGA = "";
		// 						}
		// 						if(items[i].CGP === undefined){
		// 							items[i].CGP = "";
		// 						}
		// 						if(items[i].CGA === undefined){
		// 							items[i].CGA = "";
		// 						}
		// 						if(items[i].SGP === undefined){
		// 							items[i].SGP = "";
		// 						}
		// 						if(items[i].SGA === undefined){
		// 							items[i].SGA = "";
		// 						}
		// 						if(items[i].TCS === undefined){
		// 							items[i].TCS = "";
		// 						}
		// 						if(items[i].TCA === undefined){
		// 							items[i].TCA = "";
		// 						}
		// 						if(items[i].LineValue === undefined){
		// 							items[i].LineValue = "";
		// 						}
		// 						if(items[i].Packaging === undefined){
		// 							items[i].Packaging = "";
		// 						}
		// 						if(items[i].WeightPerKG === undefined){
		// 							items[i].WeightPerKG = "";
		// 						}
		// 						if(this.data.TransportName === undefined){
		// 							this.data.TransportName = "";
		// 						}
		// 						if(this.data.TransportMode === undefined){
		// 							this.data.TransportMode = "";
		// 						}
		// 						if(this.data.DocketNumber === undefined){
		// 							this.data.DocketNumber = "";
		// 						}
		// 						if(this.data.GRDate === undefined){
		// 							this.data.GRDate = "";
		// 						}
		// 						if(this.data.EwayBillNumber === undefined){
		// 							this.data.EwayBillNumber = "";
		// 						}
		// 						if(this.data.EwayBillDate === undefined){
		// 							this.data.EwayBillDate = "";
		// 						}
		// 						if(this.data.MillNumber === undefined){
		// 							this.data.MillNumber = "";
		// 						}
		// 						if(this.data.MillName === undefined){
		// 							this.data.MillName = "";
		// 						}
		// 						if(this.data.PDIRNumber === undefined){
		// 							this.data.PDIRNumber = "";
		// 						}
		// 						if(this.data.HeatNumber === undefined){
		// 							this.data.HeatNumber = "";
		// 						}
		// 						if(this.data.BatchNumber === undefined){
		// 							this.data.BatchNumber = "";
		// 						}
		// 						if(this.data.ManufacturingMonth === undefined){
		// 							this.ManufacturingMonth = "";
		// 						}
		// 						if(items[i].PFA === undefined){
		// 							items[i].PFA = "0";
		// 						}
		// 						if(items[i].FFC === undefined){
		// 							items[i].FFC = "0";
		// 						}
		// 						if(items[i].OT1 === undefined){
		// 							items[i].OT1 = "0";
		// 						}
		// 				var row = {
		// 					"BillLineNumber": items[i].LineNum,
		// 					"BillNumber": this.data.BillNumber,
		// 					"BillDate": this.BillDate,
		// 					"ScheduleNumber": "",
		// 					"ScheduleLineNumber": "",
		// 					"PONumber": items[i].PNum_PoNum,
		// 					"IAIVendorCode": this.data.VendorCode,
		// 					"IAIItemCode": items[i].ItemCode,
		// 					"UOM": items[i].UOM,
		// 					"HSNCode": items[i].HSNCode,
		// 					"Rate": items[i].UnitPrice,
		// 					"Quantity": items[i].BalanceQty,
		// 					"PackingAmount": items[i].PFA,
		// 					"Freight": items[i].FFC,
		// 					"OtherCharges": items[i].OT1,
		// 					"AssValue": items[i].ASSValue.toString(),
		// 					"IGST": items[i].IGP,
		// 					"IGA": items[i].IGA,
		// 					"CGST": items[i].CGP,
		// 					"CGA": items[i].CGA,
		// 					"SGST": items[i].SGP,
		// 					"SGA": items[i].SGA,
		// 					"TCS": items[i].TCS,
		// 					"TCA": items[i].TCA,
		// 					"LineValue": items[i].LineValue,
		// 					"TransportName": this.data.TransportName,
		// 					"TransportMode": this.data.TransportMode,
		// 					"DocketNumber": this.data.DocketNumber,
		// 					"GRDate": this.data.GRDate,
		// 					"Packaging": items[i].Packaging,
		// 					"WeightPerKG": items[i].WeightPerKG,
		// 					"EwayBillNumber": this.data.EwayBillNumber,
		// 					"EwayBillDate": this.data.EwayBillDate,
		// 					"MillNumber": this.data.MillNumber,
		// 					"MillName": this.data.MillName,
		// 					"PDIRNumber": this.data.PDIRNumber,
		// 					"HeatNumber": this.data.HeatNumber,
		// 					"BatchNumber": this.data.BatchNumber,
		// 					"ManufacturingMonth": this.ManufacturingMonth
		// 				};
		// 				form.RowDetails.push(row);
		// 			}

		// 		}
		// 		var formdatastr = JSON.stringify(form);
		// 		this.hardcodedURL = "";
		// 		if (window.location.href.includes("launchpad")) {
		// 			this.hardcodedURL = "https://impautosuppdev.launchpad.cfapps.ap10.hana.ondemand.com/547b58c0-9667-470f-a767-c8524482b3ed.PO.spfioripurchaseorder-0.0.1";
		// 		}
		// 		var sPath = this.hardcodedURL + `/v2/odata/v4/catalog/PostASN`;
		// 		$.ajax({
		// 			type: "POST",
		// 			headers: {
		// 				'Content-Type': 'application/json'
		// 			},
		// 			url: sPath,
		// 			data: JSON.stringify({
		// 				asnData: formdatastr
		// 			}),
		// 			context: this,
		// 			success: function (data, textStatus, jqXHR) {
		// 				MessageBox.success("ASN created succesfully");
		// 				this.onAsnSaveDB();
		// 			}.bind(this),
		// 			error: function (error) {
		// 				MessageBox.error("ASN creation failed");
		// 			}
		// 		});
		// 	}

		// },

/*
		onAsnSaveDB: function () {
			var that = this;
			//this.getView().byId("MaterialSearchId").setValue("");
			//this.onRowSelect(event);
			var oModel = this.getOwnerComponent().getModel();
			var oUploadCollection = this.getView().byId("UploadCollection");
    		var files = oUploadCollection.getItems();
			
			this.data = this.asnModel.getData();
			var ASNHeaderData = {
				"PNum_PoNum": this.data.PoNum,
				"AsnNum": this.data.AsnNum,
				"BillDate": this.data.BillDate,
				"BillNumber": this.data.BillNumber,
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
				"ManufacturingMonth": this.data.ManufacturingMonth,
				"PlantName": this.data.PlantName,
				"PlantCode": this.data.PlantCode,
				"VendorCode": this.data.VendorCode
			};
			// var ASNItemData = [];
			
			// var oTable = this.getView().byId("AsnCreateTable");
			// var contexts = oTable.getSelectedContexts();
			
			if (ASNHeaderData.BillNumber) {
				if (!ASNHeaderData.BillDate) {
					MessageBox.error("Please fill the Invoice Date");
					return;
				}
			} else {
				MessageBox.error("Please fill the Invoice Number");
				return;
			}
			if (this.getView().byId("UploadCollection").getItems().length <= 0) {
				MessageBox.error("Please attach invoice.");
				return;
			}
			// if (!contexts.length) {
			// 	MessageBox.error("No Item Selected");
			// 	return;
			// } else {
			// 	var items = contexts.map(function (c) {
			// 		return c.getObject();
			// 	});

			// 	for (var i = 0; i < items.length; i++) {

			// 		if (!items[i].BalanceQty) {
			// 			MessageBox.error("ASN Quantity is required for selected items");
			// 			sap.ui.core.BusyIndicator.hide();

			// 			return;
			// 		} else {
			// 			items[i].ASSValue = items[i].ASSValue.toString();
			// 			ASNItemData.push(items[i]);
						
			// 		}

			// 	}
				oModel.create("/ASNListHeader", ASNHeaderData, null, function (oData, response) {
					MessageBox.success("ASN created succesfully");
					

				}, function (oError) {
					try {
						//var error = JSON.parse(oError.response.body);
						MessageBox.error(oError.response.body);
					} catch (err) {
						var errorXML = jQuery.parseXML(oError.getParameter("responseText")).querySelector("message").textContent;
						MessageBox.error(errorXML);
					}
				});
				// for (var i = 0; i < ASNItemData.length; i++) {
				// 	oModel.create("/ASNList", ASNItemData[i], null, function (oData, response) {
						
				// 		MessageBox.success("ASN created succesfully  ", {
				// 			actions: [sap.m.MessageBox.Action.OK],
				// 			icon: sap.m.MessageBox.Icon.SUCCESS,
				// 			title: "Success",
				// 			onClose: function (oAction) {
				// 				if (oAction === "OK") {
				// 					sp.fiori.purchaseorder.controller.formatter.onNavBack();
				// 				}
				// 			}
				// 		});

				// 	}, function (oError) {
				// 		try {
				// 			//var error = JSON.parse(oError.response.body);
				// 			MessageBox.error(oError.response.body);
				// 		} catch (err) {
				// 			var errorXML = jQuery.parseXML(oError.getParameter("responseText")).querySelector("message").textContent;
				// 			MessageBox.error(errorXML);
				// 		}
				// 	});
				// }
			//}
		},
*/

		// onAsnSaveDB: function () {
		// 	var that = this;
		// 	var oModel = this.getOwnerComponent().getModel();

		// 	this.data = this.asnModel.getData();
		// 	var ASNHeaderData = {
		// 		"PNum_PoNum": this.data.PoNum,
		// 		"AsnNum": this.data.AsnNum,
		// 		"BillDate": this.data.BillDate,
		// 		"BillNumber": this.data.BillNumber,
		// 		"DocketNumber": this.data.DocketNumber,
		// 		"GRDate": this.data.GRDate,
		// 		"TransportName": this.data.TransportName,
		// 		"TransportMode": this.data.TransportMode,
		// 		"EwayBillNumber": this.data.EwayBillNumber,
		// 		"EwayBillDate": this.data.EwayBillDate,
		// 		"MillNumber": this.data.MillNumber,
		// 		"MillName": this.data.MillName,
		// 		"PDIRNumber": this.data.PDIRNumber,
		// 		"HeatNumber": this.data.HeatNumber,
		// 		"BatchNumber": this.data.BatchNumber,
		// 		"ManufacturingMonth": this.data.ManufacturingMonth,
		// 		"PlantName": this.data.PlantName,
		// 		"PlantCode": this.data.PlantCode,
		// 		"VendorCode": this.data.VendorCode
		// 	};

		// 	var ASNItemData = [];
		// 	var oTable = this.getView().byId("AsnCreateTable");
		// 	var contexts = oTable.getSelectedContexts();

		// 	if (!ASNHeaderData.BillNumber) {
		// 		MessageBox.error("Please fill the Invoice Number");
		// 		return;
		// 	} else if (!ASNHeaderData.BillDate) {
		// 		MessageBox.error("Please fill the Invoice Date");
		// 		return;
		// 	}

		// 	if (!contexts.length) {
		// 		MessageBox.error("No Item Selected");
		// 		return;
		// 	} 

		// 	contexts.forEach(function (context) {
		// 		var item = context.getObject();
		// 		if (!item.BalanceQty) {
		// 			MessageBox.error("ASN Quantity is required for selected items");
		// 			return;
		// 		} else {
		// 			item.ASSValue = item.ASSValue.toString();
		// 			ASNItemData.push(item);
		// 		}
		// 	});

		// 	var processASNData = function () {
		// 		oModel.create("/ASNListHeader", ASNHeaderData, {
		// 			success: function (oData) {
		// 				MessageBox.success("ASN Header created successfully.");
		// 				// Create ASN items
		// 				ASNItemData.forEach(function (item) {
		// 					oModel.create("/ASNList", item, {
		// 						success: function (oData) {
		// 							MessageBox.success("ASN Item created successfully.");
		// 						},
		// 						error: function (oError) {
		// 							MessageBox.error("Error creating ASN Item: " + oError.message);
		// 						}
		// 					});
		// 				});
		// 			},
		// 			error: function (oError) {
		// 				MessageBox.error("Error creating ASN Header: " + oError.message);
		// 			}
		// 		});
		// 	};

		// 	if (this._file) {
		// 		var reader = new FileReader();
		// 		reader.onload = function (e) {
		// 			var base64 = e.target.result.split(',')[1];
		// 			ASNHeaderData.Attachment = base64;
		// 			ASNHeaderData.AttachmentName = that._file.name;
		// 			ASNHeaderData.HasAttachment = true;
		
		// 			processASNData();
		// 		};
		// 		reader.readAsDataURL(this._file);
		// 	} else {
		// 		ASNHeaderData.HasAttachment = false;
		// 		processASNData();
		// 	}
		// },

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
		/*
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
		onChange: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
		
			if (this.header_xcsrf_token) {
				var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
					name: "x-csrf-token",
					value: this.header_xcsrf_token
				});
				oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
			}

			var aFiles = oEvent.getParameter("files");
			if (aFiles && aFiles.length > 0) {
				this._file = aFiles[0];
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
		*/

		onAfterItemAdded: function (oEvent) {
			let item = oEvent.getParameter("item");
			let poNum = this.Po_Num.replace(/\//g, '-');
			
			this._createEntity(item, poNum)
			.then(() => {
				this._uploadContent(item, poNum);
			})
			.catch((err) => {
				console.log("Error: " + err);
			})
		},

		onUploadCompleted: function (oEvent) {
			var oUploadSet = this.byId("uploadSet");
			var oUploadedItem = oEvent.getParameter("item");
			var sUploadUrl = oUploadedItem.getUploadUrl();
		
			var sDownloadUrl = sUploadUrl
			oUploadedItem.setUrl(sDownloadUrl);
			oUploadSet.getBinding("items").refresh();
			oUploadSet.invalidate();
		},
		_createEntity: function (item, poNum) {
			var oModel = this.getView().getModel();
			var oData = {
				PNum_PoNum: poNum,
				mediaType: item.getMediaType(),
				fileName: item.getFileName(),
				size: item.getFileObject().size,
				url: "https://impautosuppdev.launchpad.cfapps.ap10.hana.ondemand.com/547b58c0-9667-470f-a767-c8524482b3ed.PO.spfioripurchaseorder-0.0.1" + `/v2/odata/v4/catalog/Files(PNum_PoNum='${poNum}')/content`
				//url: this.getView().getModel().sServiceUrl + `/Files(PNum_PoNum='${poNum}')/content`

			};
		
			return new Promise((resolve, reject) => {
				oModel.create("/Files", oData, {
					success: function () {
						resolve();
					},
					error: function (oError) {
						console.log("Error: ", oError);
						reject(oError);
					}
				});
			});
		},
		
/*		
		_createEntity: function (item, poNum) {
			var data = {
				PNum_PoNum: poNum,
				mediaType: item.getMediaType(),
				fileName: item.getFileName(),
				size: item.getFileObject().size
			};

			var settings = {
				url: "/v2/odata/v4/catalog/Files",
				method: "POST",
				headers: {
					"Content-type": "application/json"
				},
				data: JSON.stringify(data)
			}

			return new Promise((resolve, reject) => {
				$.ajax(settings)
					.done(() => {
						resolve();
					})
					.fail((err) => {
						console.log("Error: " + err)
						reject(err);
					})
			})				
		},
*/		
		_uploadContent: function (item, poNum) {
			//var encodedPoNum = encodeURIComponent(poNum);
			var url = "https://impautosuppdev.launchpad.cfapps.ap10.hana.ondemand.com/547b58c0-9667-470f-a767-c8524482b3ed.PO.spfioripurchaseorder-0.0.1" + `/v2/odata/v4/catalog/Files(PNum_PoNum='${poNum}')/content`
			item.setUploadUrl(url);    
			var oUploadSet = this.byId("uploadSet");
			oUploadSet.setHttpRequestMethod("PUT")
			oUploadSet.uploadItem(item);
		},

		onOpenPressed: function (oEvent) {
			oEvent.preventDefault();
			//var item = oEvent.getSource();
			var item = oEvent.getParameter("item");
			this._fileName = item.getFileName();
			this._download(item)
				.then((blob) => {
					var url = window.URL.createObjectURL(blob);
					var link = document.createElement('a');
					link.href = url;
					link.setAttribute('download', this._fileName);
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);						
				})
				.catch((err)=> {
					console.log(err);
				});					
		},
		_download: function (item) {
			console.log("_download")
			var settings = {
				url: item.getUrl(),
				method: "GET",
				xhrFields:{
					responseType: "blob"
				}
			}	

			return new Promise((resolve, reject) => {
				$.ajax(settings)
				.done((result, textStatus, request) => {
					resolve(result);
				})
				.fail((err) => {
					reject(err);
				})
			});						
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
				//this.onRowSelect(oEvent);

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
		onQuantityChange: function (e) {
			const val = e.getParameter("newValue"),
				obj = e.getSource().getParent().getBindingContext("asnModel").getObject();
			var path = e.getSource().getParent().getBindingContextPath().split("/")[3];
			var data = this.asnModel.getData().DocumentRows.results;
			data[path].BalanceQty = val;
			data[path].ASSValue = parseFloat(data[path].BalanceQty) * parseFloat(data[path].UnitPrice);
			if (data[path].PFA) {
				data[path].ASSValue = parseFloat(data[path].ASSValue) + parseFloat(data[path].PFA);
			}
			if (data[path].FFC) {
				data[path].ASSValue = parseFloat(data[path].ASSValue) + parseFloat(data[path].FFC);
			}
			if (data[path].OT1) {
				data[path].ASSValue = parseFloat(data[path].ASSValue) + parseFloat(data[path].OT1);
			}
			this.asnModel.refresh(true);
		},
		onPackChange: function (e) {
			const val = e.getParameter("value") || 0;
			var path = e.getSource().getParent().getBindingContextPath().split("/")[3];
			var data = this.asnModel.getData().DocumentRows.results;
			data[path].PFA = val;
			if (data[path].FFC === undefined){data[path].FFC = "0"}
			if (data[path].OT1 === undefined){data[path].OT1 = "0"}
			data[path].ASSValue = (parseFloat(data[path].BalanceQty) * parseFloat(data[path].UnitPrice)) + parseFloat(data[path].PFA) + parseFloat(data[path].FFC) + parseFloat(data[path].OT1);
			this.asnModel.refresh(true);
		},
		onFreightChange: function (e) {
			const val = e.getParameter("value") || 0;
			var path = e.getSource().getParent().getBindingContextPath().split("/")[3];
			var data = this.asnModel.getData().DocumentRows.results;
			data[path].FFC = val;
			if (data[path].PFA === undefined){data[path].PFA = "0"}
			if (data[path].OT1 === undefined){data[path].OT1 = "0"}
			data[path].ASSValue = (parseFloat(data[path].BalanceQty) * parseFloat(data[path].UnitPrice)) + parseFloat(data[path].PFA) + parseFloat(data[path].FFC) + parseFloat(data[path].OT1);
			this.asnModel.refresh(true);
		},
		onOtherChange: function (e) {
			const val = e.getParameter("value") || 0;
			var path = e.getSource().getParent().getBindingContextPath().split("/")[3];
			var data = this.asnModel.getData().DocumentRows.results;
			data[path].OT1 = val;
			if (data[path].FFC === undefined){data[path].FFC = "0"}
			if (data[path].PFA === undefined){data[path].PFA = "0"}
			data[path].ASSValue = (parseFloat(data[path].BalanceQty) * parseFloat(data[path].UnitPrice)) + parseFloat(data[path].PFA) + parseFloat(data[path].FFC) + parseFloat(data[path].OT1);
			this.asnModel.refresh(true);
		},
		initializeScheduleNumber: function () {
			var unitCode = sessionStorage.getItem("unitCode");
			var modeldata = this.getView().getModel("asnModel").getData();
			var Po_No = modeldata.PNum_PoNum;
			this.AddressCodePO = Po_No.replace(/\//g, '-');
			var oComboBox = this.getView().byId("schnoId");
			if (!oComboBox.getModel("ScheduleNumber")) {
				this.GetScheduleNumber(unitCode, this.AddressCodePO);
			}
		},
		GetScheduleNumber: function (UnitCode, AddressCodePO) {
			var oComboBox = this.getView().byId("schnoId");
			var oModel = this.getView().getModel();
			return new Promise(function (resolve, reject) {
				oModel.callFunction("/GetScheduleNumber", {
					method: "GET",
					urlParameters: {
						UnitCode: UnitCode,
						AddressCode: AddressCodePO
					},
					success: function (oData) {
						var scheduleNumberData = oData.results;
						var oScheduleNumberModel = new sap.ui.model.json.JSONModel();
						oScheduleNumberModel.setData({ items: scheduleNumberData });
						this.getView().setModel(oScheduleNumberModel, "schedulenumber");
						resolve();
					}.bind(this),
					error: function (oError) {
						reject(new Error("Failed to fetch Schedule Number."));
					}
				});
			}.bind(this));
		},
		ScheduleNumberHelpSelect: function () {
			var oStateSelect = this.getView().byId("schlinenoId");
			var sCountryKey = this.getView().byId("schnoId").getSelectedKey();
			var unitCode = sessionStorage.getItem("unitCode");

			if (sCountryKey) {
				oStateSelect.setEnabled(true);
				this.GetScheduleLineNumber(unitCode, this.AddressCodePO, sCountryKey);
			} else {
				oStateSelect.setEnabled(false);
			}
		},
		GetScheduleLineNumber: function (UnitCode, AddressCodePO, ScheduleNumber) {
			var oStateSelect = this.getView().byId("schlinenoId");
			var oModel = this.getView().getModel();
			return new Promise(function (resolve, reject) {
				oModel.callFunction("/GetScheduleLineNumber", {
					method: "GET",
					urlParameters: {
						UnitCode: UnitCode,
						AddressCode: AddressCodePO,
						ScheduleNumber: ScheduleNumber
					},
					success: function (oData) {
						var scheduleLineNumberData = oData.results;
						var oScheduleLineNumberModel = new sap.ui.model.json.JSONModel();
						oScheduleLineNumberModel.setData({ items: scheduleLineNumberData });
						this.getView().setModel(oScheduleLineNumberModel, "schedulelinenumber");
						resolve();
					}.bind(this),
					error: function (oError) {
						reject(new Error("Failed to fetch Schedule Line Number."));
					}
				});
			}.bind(this));

		},
		ScheduleLineNumberHelpSelect: function () {
			// var oStateSelect = this.getView().byId("schlinenoId");
			//     var data = this.createModel.getData();
			//     if (oStateSelect.getSelectedKey()) {
			//         var sCountryKey = this.getView().byId("schnoId").getSelectedKey();
			//         var sStateKey = oStateSelect.getSelectedKey();
			//         if (sCountryKey === "India") {
			//             if (sStateKey === "Haryana") {
			//                 data.Location = "Within State";
			//             } else {
			//                 data.Location = "Outside State";
			//             }
			//         } else {
			//             data.Location = "Outside Country";
			//         }
			//         this.loadCities(sCountryKey, sStateKey);
			//     } else {
			//         MessageToast.show("Please select a state first.");
			//     }
			//     this.createModel.refresh(true);
		},


	});

});