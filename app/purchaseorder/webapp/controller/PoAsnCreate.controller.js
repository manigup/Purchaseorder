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

				//this.byId("rateOk").setSelected(true);

				this.modulePath = jQuery.sap.getModulePath("sp/fiori/purchaseorder");
				this.modulePath = this.modulePath === "." ? "" : this.modulePath;

				this.byId("totalInvNetAmnt").setValueState("None");
				this.byId("totalGstAmnt").setValueState("None");

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
				var unitCode = sessionStorage.getItem("unitCode") || "P01";
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
				"TotalGstAmnt": this.data.TotalGstAmnt
				//"RateStatus": this.data.DocumentRows.results.every(item => item.RateAgreed === true) ? "Rate Matched" : "Rate Un-Matched"
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
			if (!ASNHeaderData.TotalInvNetAmnt) {
				MessageBox.error("Please fill Total Invoice Net Amount");
				return;
			} else if (!ASNHeaderData.TotalGstAmnt) {
				MessageBox.error("Please fill Total GST Amount");
				return;
			}
			if (this.getView().byId("uploadSet").getItems().length <= 0) {
				MessageBox.error("Please upload invoice.");
				return;
			}

			oModel.create("/ASNListHeader", ASNHeaderData, {
				success: () => {
					const payload = JSON.stringify(this.data.DocumentRows.results.map(item => {
						delete item.__metadata;
						return item;
					}));
					const settings = {
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
							MessageBox.success("Invoice submitted successfully.", {
								onClose: () => sp.fiori.purchaseorder.controller.formatter.onNavBack()
							});
						});
				},
				error: function (oError) {
					MessageBox.error("Error submitting invoice: " + oError.message);
				}
			});
		},


		onAsnCancel: function () {
			this.router.navTo("PoMaster");
		},

		//	********************************************Upload File start Code ***********************************
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
			this.hardcodedURL = "";
				if (window.location.href.includes("site")) {
					this.hardcodedURL = jQuery.sap.getModulePath("sp.fiori.purchaseorder");
				}
			var oData = {
				PNum_PoNum: poNum,
				mediaType: item.getMediaType(),
				fileName: item.getFileName(),
				size: item.getFileObject().size,
				url: this.hardcodedURL + `/po/odata/v4/catalog/Files(PNum_PoNum='${poNum}')/content`
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


		_uploadContent: function (item, poNum) {
			//var encodedPoNum = encodeURIComponent(poNum);
			this.hardcodedURL = "";
				if (window.location.href.includes("site")) {
					this.hardcodedURL = jQuery.sap.getModulePath("sp.fiori.purchaseorder");
				}
			var url = this.hardcodedURL + `/po/odata/v4/catalog/Files(PNum_PoNum='${poNum}')/content`
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
		onInvNoChange: function (oEvent) {

			if (oEvent.getParameter("value") === "") {
				this.getView().byId("DP1").setEnabled(false);
				this.getView().byId("DP1").setValue("");
			} else {
				this.getView().byId("DP1").setEnabled(true);
			}
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

		onTotalChange: function () {
			let obj, totalInvNetAmnt = 0, totalGstAmnt = 0;
			this.byId("AsnCreateTable").getItems().forEach(item => {
				obj = item.getBindingContext("asnModel").getObject();
				totalInvNetAmnt += parseFloat(obj.PoQty) * parseFloat(obj.UnitPrice);
				totalGstAmnt += parseFloat(obj.IGST) + parseFloat(obj.CGST) + parseFloat(obj.SGST);
			});
			const totalInvNetAmntCtr = this.byId("totalInvNetAmnt"),
				totalGstAmntCtr = this.byId("totalGstAmnt")
			if (totalInvNetAmnt === parseFloat(totalInvNetAmntCtr.getValue())) {
				totalInvNetAmntCtr.setValueState("Success");
			} else {
				totalInvNetAmntCtr.setValueState("Warning").setValueStateText("Amount Mismatch");
			}

			if (totalGstAmnt === parseFloat(totalGstAmntCtr.getValue())) {
				totalGstAmntCtr.setValueState("Success");
			} else {
				totalGstAmntCtr.setValueState("Warning").setValueStateText("Amount Mismatch");
			}
		}
	});

});