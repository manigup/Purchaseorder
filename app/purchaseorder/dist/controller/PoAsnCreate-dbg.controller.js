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

			if (event.getParameter("name") === "PoAsnCreate") {

				var oModel = this.getView().getModel();
				var oUploadSet = this.byId("uploadSet");
				oUploadSet.removeAllIncompleteItems();

				//this.byId("rateOk").setSelected(true);

				this.modulePath = jQuery.sap.getModulePath("sp/fiori/purchaseorder");
				this.modulePath = this.modulePath === "." ? "" : this.modulePath;

				this.byId("totalInvNetAmnt").setValueState("None");
				this.byId("totalCGstAmnt").setValueState("None");
				this.byId("totalSGstAmnt").setValueState("None");
				this.byId("totalIGstAmnt").setValueState("None");
				this.byId("totalAmnt").setValueState("None");
				this.byId("ewayBillNumberId").setValueState("None");

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
				// var Tomorrow = new Date();
				// var Yesterday = new Date();

				// Yesterday.setDate(Today.getDate() - 4);
				// Tomorrow.setDate(Today.getDate() + 1);
				// this.getView().byId("DP1").setDateValue(new Date());
				// this.getView().byId("DP1").setMinDate(Yesterday);
				this.getView().byId("DP1").setMaxDate(Today);

				var Po_Num = event.getParameter("arguments").Po_No;
				this.Po_Num = Po_Num.replace(/-/g, '/');
				//this.Po_Num = "19/01P/03/00001";
				this.Amount = event.getParameter("arguments").Amount;
				this.Vendor_No = event.getParameter("arguments").Vendor_No;
				var unitCode = event.getParameter("arguments").UnitCode || "P01";
				this.AddressCodePO = sessionStorage.getItem("AddressCodePO") || 'JSE-01-01'
				//var unitCode = "P01";
				var oModel = this.getOwnerComponent().getModel();

				this.getView().byId("AsnCreateTable").removeSelections(true);
				//var request = `/ASNItems?unitCode=${unitCode}&docNum=${this.Po_Num}`;
				var request = "/PurchaseOrders";
				oModel.read(request, {
					urlParameters: {
						"$expand": "DocumentRows",
						AddressCode: this.AddressCodePO,
						UnitCode: unitCode,
						Po_Num: this.Po_Num
					},
					success: function (oData) {
						var filteredPurchaseOrder = oData.results.find(po => po.PoNum === that.Po_Num);
						if (filteredPurchaseOrder) {
							that.asnModel.setData(filteredPurchaseOrder);
							that.asnModel.refresh(true);
							var asnModelData = that.getView().getModel("asnModel").getData();
							if (asnModelData.HasAttachments === "Invoice Submitted") {
								that.getHeaderDetails();
							}
							that.GetTransportModeList();
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
		GetTransportModeList: function () {
			var oModel = this.getView().getModel();
			return new Promise(function (resolve, reject) {
				oModel.callFunction("/GetTransportModeList", {
					method: "GET",
					success: function (oData, response) {
						var transportData = oData.results;
						var oTransportModel = new sap.ui.model.json.JSONModel();
						oTransportModel.setData({ items: transportData });
						this.getView().setModel(oTransportModel, "transport");
						resolve();
					}.bind(this),
					error: function (oError) {
						reject(new Error("Failed to fetch transport data."));
					}
				});
			}.bind(this));
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
						asnModelData.TotalInvNetAmnt = filteredPurchaseOrder.TotalInvNetAmnt;
						asnModelData.TotalCGstAmnt = filteredPurchaseOrder.TotalCGstAmnt;
						asnModelData.TotalSGstAmnt = filteredPurchaseOrder.TotalSGstAmnt;
						asnModelData.TotalIGstAmnt = filteredPurchaseOrder.TotalIGstAmnt;
						asnModelData.TotalAmnt = filteredPurchaseOrder.TotalAmnt;
						asnModelData.TransporterID = filteredPurchaseOrder.TransporterID;
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
					oData.results.forEach(function (fileData) {
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
					console.log("Error: " + oError)
				}
			});
		},

		onNavBack: function () {
			// this.router.navTo("PoMaster");
			history.go(-1);
		},
		onAsnSaveDB: function () {
			// var that = this;
			if (this.validateFields()) {
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
					"VendorCode": this.data.VendorCode,
					"TotalInvNetAmnt": this.data.TotalInvNetAmnt,
					"TotalCGstAmnt": this.data.TotalCGstAmnt,
					"TotalSGstAmnt": this.data.TotalSGstAmnt,
					"TotalIGstAmnt": this.data.TotalIGstAmnt,
					"TotalAmnt": this.data.TotalAmnt,
					"TransporterID": this.data.TransporterID
					//"RateStatus": this.data.DocumentRows.results.every(item => item.RateAgreed === true) ? "Rate Matched" : "Rate Un-Matched"
				};

				// var ASNItemData = [];
				var oTable = this.getView().byId("AsnCreateTable");
				var contexts = oTable.getSelectedItems();

				if (!ASNHeaderData.BillNumber) {
					MessageBox.error("Please fill the Invoice Number");
					return;
				} else if (!ASNHeaderData.BillDate) {
					MessageBox.error("Please fill the Invoice Date");
					return;
				}
				if (this.getView().byId("uploadSet").getIncompleteItems().length <= 0) {
					MessageBox.error("Please upload invoice.");
					return;
				}
				if (!contexts.length) {
					MessageBox.error("No Item Selected");
					return;
				}

				let obj, result;
				result = contexts.some(item => {
					obj = item.getBindingContext("asnModel").getObject();
					return parseInt(obj.InvBalQty) === 0;
				});

				if (result) {
					MessageBox.error("Please unselect item with balanced qty 0 to proceed");
					return;
				}

				oModel.create("/ASNListHeader", ASNHeaderData, {
					success: () => {
						// const payload = JSON.stringify(this.data.DocumentRows.results.map(item => {
						// 	delete item.__metadata;
						// 	item.InvQty = item.InvBalQty;
						// 	return item;
						// }));
						let obj, poQty, invQty, invBalQty, invListPayload = [];
						const payload = JSON.stringify(contexts.map(item => {
							obj = item.getBindingContext("asnModel").getObject();
							if (parseInt(obj.InvBalQty) > 0) {
								poQty = parseInt(obj.PoQty);
								invQty = parseInt(obj.InvBalQty) === 0 ? poQty : parseInt(obj.InvBalQty) + parseInt(obj.InvQty);
								invBalQty = poQty - invQty;
								invListPayload.push({
									REF_INV: this.data.BillNumber,
									Item_Code: obj.ItemCode,
									Po_Num: obj.PNum_PoNum,
									INVOICE_DATE: this.data.BillDate,
									INVOICE_AMT: this.data.TotalAmnt,
									IGST_AMT: this.data.TotalInvNetAmnt,
									CGST_AMT: this.data.TotalCGstAmnt,
									SGST_AMT: this.data.TotalSGstAmnt,
									Po_Qty: poQty,
									Inv_Qty: invQty,
									InvBal_Qty: invBalQty,
									INV_DELETE: false
								});
								delete obj.__metadata;
								delete obj.PNum;
								obj.InvQty = invQty;
								obj.InvBalQty = invBalQty;
								return obj;
							}
						}));
						let settings = {
							async: true,
							url: this.modulePath + "/po/odata/v4/catalog/stageDocumentRows",
							method: "POST",
							headers: {
								"content-type": "application/json"
							},
							processData: false,
							data: JSON.stringify({ data: payload })
						};
						$.ajax(settings)
							.done(() => {
								settings = {
									async: true,
									url: this.modulePath + "/po/odata/v4/catalog/stageInvHeaderList",
									method: "POST",
									headers: {
										"content-type": "application/json"
									},
									processData: false,
									data: JSON.stringify({ data: JSON.stringify(invListPayload) })
								};
								$.ajax(settings)
									.done(() => {
										this._createEntity(this.uploadItem, this.data.PoNum.replace(/\//g, '-'), this.data.BillNumber)
											.then(() => {
												this._uploadContent(this.uploadItem, this.data.PoNum.replace(/\//g, '-'), this.data.BillNumber);
											})
											.catch((err) => {
												console.log("Error: " + err);
											})
										MessageBox.success("Invoice submitted successfully.", {
											onClose: () => sp.fiori.purchaseorder.controller.formatter.onNavBack()
										});
									});
							});
					},
					error: (error) => {
						const errBody = error.response.body;
						if (errBody.indexOf("<?xml") !== -1) {
							MessageBox.error($($.parseXML(errBody)).find("message").text());
						} else {
							MessageBox.error(JSON.parse(errBody).error.message.value);
						}
					}
				});
			} else {
				MessageBox.error("Please fill correct Eway Bill Number");
				return;
			}
		},


		onAsnCancel: function () {
			this.router.navTo("PoMaster");
		},

		//	********************************************Upload File start Code ***********************************
		onAfterItemAdded: function (evt) {
			this.uploadItem = evt.getParameter("item");
			evt.getParameter("item").setVisibleEdit(false).setVisibleRemove(false);
			// let poNum = this.Po_Num.replace(/\//g, '-');
			// this._createEntity(item, poNum)
			// 	.then(() => {
			// 		this._uploadContent(item, poNum);
			// 	})
			// 	.catch((err) => {
			// 		console.log("Error: " + err);
			// 	})
		},

		// onUploadCompleted: function (oEvent) {
		// 	// var oUploadSet = this.byId("uploadSet");
		// 	var oUploadedItem = oEvent.getParameter("item");
		// 	var sUploadUrl = oUploadedItem.getUploadUrl();

		// 	var sDownloadUrl = sUploadUrl
		// 	oUploadedItem.setUrl(sDownloadUrl);
		// 	// oUploadSet.getBinding("items").refresh();
		// 	// oUploadSet.invalidate();
		// },
		_createEntity: function (item, poNum, invNum) {
			var oModel = this.getView().getModel();
			this.hardcodedURL = "";
			if (window.location.href.includes("site")) {
				this.hardcodedURL = jQuery.sap.getModulePath("sp.fiori.purchaseorder");
			}
			var oData = {
				PNum_PoNum: poNum,
				Ref_Inv: invNum,
				mediaType: item.getMediaType(),
				fileName: item.getFileName(),
				size: item.getFileObject().size,
				url: this.hardcodedURL + `/po/odata/v4/catalog/Files(PNum_PoNum='${poNum}',Ref_Inv='${invNum}')/content`
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


		_uploadContent: function (item, poNum, invNum) {
			//var encodedPoNum = encodeURIComponent(poNum);
			this.hardcodedURL = "";
			if (window.location.href.includes("site")) {
				this.hardcodedURL = jQuery.sap.getModulePath("sp.fiori.purchaseorder");
			}
			var url = this.hardcodedURL + `/po/odata/v4/catalog/Files(PNum_PoNum='${poNum}',Ref_Inv='${invNum}')/content`
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
				.catch((err) => {
					console.log(err);
				});
		},
		_download: function (item) {
			console.log("_download")
			var settings = {
				url: item.getUrl(),
				method: "GET",
				xhrFields: {
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


		onTypeMissmatch: function (oEvent) {
			MessageBox.error("Only PDF files are allowed.");
		},

		onRateOkChange: function (evt) {
			const state = evt.getParameter("selected");
			this.asnModel.getData().DocumentRows.results.forEach(item => {
				item.RateAgreed = state;
			});
			this.asnModel.refresh(true);
		},

		onRateAgreedChange: function (evt) {
			const state = evt.getParameter("selected");
			if (state) {
				evt.getSource().getBindingContext("asnModel").getObject().SupplierRate = 0;
			}
			this.asnModel.refresh(true);
		},

		onRowSelect: function () {
			let obj, totalInvNetAmnt = 0, totalCGstAmnt = 0, totalSGstAmnt = 0, totalIGstAmnt = 0, totalAmnt = 0;
			this.byId("AsnCreateTable").getSelectedItems().forEach(item => {
				obj = item.getBindingContext("asnModel").getObject();
				totalInvNetAmnt += parseFloat(obj.PoQty) * parseFloat(obj.UnitPrice);
				if (parseFloat(obj.CGST) !== 0) {
					totalCGstAmnt += (parseFloat(obj.CGST) * parseFloat(obj.PoQty) * parseFloat(obj.UnitPrice)) / 100;
				} if (parseFloat(obj.SGST) !== 0) {
					totalSGstAmnt += (parseFloat(obj.SGST) * parseFloat(obj.PoQty) * parseFloat(obj.UnitPrice)) / 100;
				} if (parseFloat(obj.IGST) !== 0) {
					totalIGstAmnt += (parseFloat(obj.IGST) * parseFloat(obj.PoQty) * parseFloat(obj.UnitPrice)) / 100;
				}
				totalAmnt = totalInvNetAmnt + totalCGstAmnt + totalSGstAmnt + totalIGstAmnt;
			});
			const totalInvNetAmntCtr = this.byId("totalInvNetAmnt"),
				totalCGstAmntCtr = this.byId("totalCGstAmnt"),
				totalSGstAmntCtr = this.byId("totalSGstAmnt"),
				totalIGstAmntCtr = this.byId("totalIGstAmnt"),
				totalAmntCtr = this.byId("totalAmnt");
			totalInvNetAmntCtr.setValue(parseFloat(this.formatAmnt(totalInvNetAmnt)));
			totalCGstAmntCtr.setValue(parseFloat(this.formatAmnt(totalCGstAmnt)));
			totalSGstAmntCtr.setValue(parseFloat(this.formatAmnt(totalSGstAmnt)));
			totalIGstAmntCtr.setValue(parseFloat(this.formatAmnt(totalIGstAmnt)));
			totalAmntCtr.setValue(parseFloat(this.formatAmnt(totalAmnt)));
			if (totalInvNetAmnt === parseFloat(totalInvNetAmntCtr.getValue())) {
				totalInvNetAmntCtr.setValueState("Success").setValueStateText("Amount Matched");
			} else {
				totalInvNetAmntCtr.setValueState("Warning").setValueStateText("Amount Mismatch");
			}

			if (totalCGstAmnt === parseFloat(totalCGstAmntCtr.getValue())) {
				totalCGstAmntCtr.setValueState("Success").setValueStateText("Amount Matched");
			} else {
				totalCGstAmntCtr.setValueState("Warning").setValueStateText("Amount Mismatch");
			}

			if (totalSGstAmnt === parseFloat(totalSGstAmntCtr.getValue())) {
				totalSGstAmntCtr.setValueState("Success").setValueStateText("Amount Matched");
			} else {
				totalSGstAmntCtr.setValueState("Warning").setValueStateText("Amount Mismatch");
			}

			if (totalIGstAmnt === parseFloat(totalIGstAmntCtr.getValue())) {
				totalIGstAmntCtr.setValueState("Success").setValueStateText("Amount Matched");
			} else {
				totalIGstAmntCtr.setValueState("Warning").setValueStateText("Amount Mismatch");
			}

			if (totalAmnt === parseFloat(totalAmntCtr.getValue())) {
				totalAmntCtr.setValueState("Success").setValueStateText("Amount Matched");
			} else {
				totalAmntCtr.setValueState("Warning").setValueStateText("Amount Mismatch");
			}
		},
		validateFields: function () {
			var bValidationError = true, oInput = this.getView().byId("ewayBillNumberId"), oBinding = oInput.getBinding("value");
			if (oInput.getValue()) {
				try {
					oBinding.getType().validateValue(oInput.getValue());
					oInput.setValueState("None");
					bValidationError = true;
				} catch (oException) {
					oInput.setValueState("Error");
					bValidationError = false;
				}
			}
			return bValidationError;
		},
		formatAmnt: function (oAmount) {
			if (oAmount) {
				var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
					"groupingEnabled": false,
					"groupingSeparator": '',
					"groupingSize": 0,
					"decimalSeparator": ".",
					"decimals": 2
				});
				return oFormat.format(oAmount);
			}
			return "0.00";
		},
	});

});