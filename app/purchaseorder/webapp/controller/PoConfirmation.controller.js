sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sp/fiori/purchaseorder/controller/formatter",
	"sap/ui/export/Spreadsheet",
], function (Controller, MessageBox, formatter, Spreadsheet) {
	"use strict";

	return Controller.extend("sp.fiori.purchaseorder.controller.PoConfirmation", {
		formatter: formatter,
		onInit: function () {

			this.fragModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.fragModel, "fragModel");

			this.oDataModel = sap.ui.getCore().getModel("oDataModel");

			this.flagModel = sap.ui.getCore().getModel("flagModel");
			this.getView().setModel(this.oDataModel);

			this.oTableColumnModel = new sap.ui.model.json.JSONModel("model/TableColumn.json");
			this.getView().setModel(this.oTableColumnModel, "TableColumn");

			// this.oTableColumnModel = this.getView().getModel("TableColumn");

			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRouteMatched(this.handleRouteMatched, this);

			this.detailModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.detailModel, "detailModel");

			this.headerModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.headerModel, "headerModel");

			this.popOverModel = new sap.ui.model.json.JSONModel();
			this.detailAmountPopoverModel = new sap.ui.model.json.JSONModel();
			this.ConfirmFragModel = new sap.ui.model.json.JSONModel();

			this.getView().addStyleClass("sapUiSizeCompact");

		},
		onNavBack: function () {
			this.router.navTo("PoMaster");
		},

		handleRouteMatched: function (event) {

			if (event.getParameter("name") === "PoConfirmation") {
				// 	this.getView().byId("RB1-1").setSelected(true);
				// 	sap.ui.core.BusyIndicator.show(0);
				// 	this.odata = {};
				// this.getView().byId("MaterialSearchId").setValue();
				// this.getView().byId("ShipDateId").setMinDate(new Date());
				var that = this;
				// 	this.getView().byId("chkBoxSelectAll").setSelected(false);
				this.getView().byId("DeliveryTableId").removeSelections(true);
				this.Po_Num = event.getParameter("arguments").Po_No;
				var request = "/PO_HEADERSet(Po_No='" + this.Po_Num + "',Vendor_No='')";
				this.oDataModel.read(request, null, null, false, function (oData) {
					sap.ui.core.BusyIndicator.hide();
					that.odata = oData;
					that.headerModel.setData(oData);
					that.headerModel.refresh(true);
				},
					function (oError) {
						sap.ui.core.BusyIndicator.hide();
						var value = JSON.parse(oError.response.body);
						MessageBox.error(value.error.message.value);

					}
				);

				sap.ui.core.BusyIndicator.show(0);
				// var detailPath = "/PO_SCH_CONFSet?$filter= Po_No eq '" + this.Po_Num +
				// 	"' and Item_No eq '' and Vendor_No eq '' and Material_No eq '' and Material_Desc eq '' and WeekIndicator eq '1' ";
				// this.oDataModel.read("/PO_SCH_CONFSet?$filter= Po_No eq '" + this.Po_Num + "'", null, null, false, function (oData) {
				this.oDataModel.read("/PoConfirmSet?$filter= Po_No eq '" + this.Po_Num + "'", null, null, false, function (oData) {
					sap.ui.core.BusyIndicator.hide();
					that.odata = oData;
					that.detailModel.setData(oData);
					that.detailModel.refresh(true);
				},
					function (oError) {
						sap.ui.core.BusyIndicator.hide();
						var value = JSON.parse(oError.response.body);
						MessageBox.error(value.error.message.value);
						that.router.navTo("PoDetail", {
							"Po_No": that.Po_Num
						});
					}
				);

				// 	var tableModel = that.getView().getModel("TableColumn"),
				// 		tableData = tableModel.getData();
				// 	var detailData = {};
				// 	try {
				// 		detailData = that.detailModel.getData().results[0];
				// 	} catch (Exception) {
				// 		// handle Exception
				// 	}
				// 	this.checkDisableItem(that.odata);

				// 	tableData.Col_1 = this.dateFormat(detailData.Del_Date1);
				// 	tableData.Col_2 = this.dateFormat(detailData.Del_Date2);
				// 	tableData.Col_3 = this.dateFormat(detailData.Del_Date3);
				// 	tableData.Col_4 = this.dateFormat(detailData.Del_Date4);
				// 	tableData.Col_5 = this.dateFormat(detailData.Del_Date5);
				// 	tableData.Col_6 = this.dateFormat(detailData.Del_Date6);
				// 	tableData.Col_7 = this.dateFormat(detailData.Del_Date7);

				// 	tableModel.setData(tableData);
				// 	tableModel.refresh(true);

				// 	this.checkCount = 0;
				// 	this.enabledCount = 0;

			}
		},

		checkDisableItem: function (tableData) {
			var len = tableData.results.length,
				count = false;
			for (var i = 0; i < len; i++) {
				if ((tableData.results[i].DisableInd_1 !== "X") || (tableData.results[i].DisableInd_2 !== "X") || (tableData.results[i].DisableInd_3 !==
					"X") || (tableData.results[i].DisableInd_4 !== "X") || (tableData.results[i].DisableInd_5 !== "X") || (tableData.results[i].DisableInd_6 !==
						"X") || (tableData.results[i].DisableInd_7 !== "X")) {
					count = true;
				}
			}

			if (count) {
				this.getView().byId("submitBtnId").setEnabled(true);
			} else {
				this.getView().byId("submitBtnId").setEnabled(false);
			}
		},

		radioButtonSelect: function (oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			var that = this;
			var selectedVal = oEvent.getParameter("selectedIndex") + 1;
			var detailPath = "/PO_SCH_CONFSet?$filter= Po_No eq '" + this.Po_Num +
				"' and Item_No eq '' and Vendor_No eq '' and Material_No eq '' and Material_Desc eq '' and WeekIndicator eq '" + selectedVal +
				"' ";
			this.oDataModel.read(detailPath, null, null, false, function (oData) {
				sap.ui.core.BusyIndicator.hide();
				that.odata = oData;
				that.detailModel.setData(oData);
				that.detailModel.refresh(true);
			},
				function (oError) {
					sap.ui.core.BusyIndicator.hide();
					var value = JSON.parse(oError.response.body);
					MessageBox.error(value.error.message.value);

				}
			);

			this.checkDisableItem(that.odata);

			var tableModel = that.getView().getModel("TableColumn"),
				tableData = tableModel.getData();
			var detailData = {};
			try {
				detailData = that.detailModel.getData().results[0];
			} catch (Exception) {
				// handle Exception
			}
			tableData.Col_1 = this.dateFormat(detailData.Del_Date1);
			tableData.Col_2 = this.dateFormat(detailData.Del_Date2);
			tableData.Col_3 = this.dateFormat(detailData.Del_Date3);
			tableData.Col_4 = this.dateFormat(detailData.Del_Date4);
			tableData.Col_5 = this.dateFormat(detailData.Del_Date5);
			tableData.Col_6 = this.dateFormat(detailData.Del_Date6);
			tableData.Col_7 = this.dateFormat(detailData.Del_Date7);

			tableModel.setData(tableData);
			tableModel.refresh(true);
		},

		dateFormat: function (oDate) {
			if (oDate !== "" && oDate !== null && oDate !== undefined) {

				var date = oDate.substring(4, 6) + "/" + oDate.substring(6, 8) + "/" + oDate.substring(0, 4);

				var DateInstance = new Date(date);
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd MMM"
				});
				return dateFormat.format(DateInstance);
			}
			return "";
		},

		onCreateAsn: function () {
			sap.ui.core.BusyIndicator.show(0);
			var that = this;
			this.router.navTo("PoAsnCreate", {
				"Po_No": that.Po_Num,
				"Amount": that.detailModel.getData().Amount
			});
		},

		sumOfDaysValue: function (oEvent) {
			var index = oEvent.getSource().getParent().getBindingContext("detailModel").getPath().split("/")[2];
			var data = this.detailModel.getData().results[index];
			if (data.Col_1 === "") {
				data.Col_1 = "0";
			}
			if (data.Col_2 === "") {
				data.Col_2 = "0";
			}
			if (data.Col_3 === "") {
				data.Col_3 = "0";
			}
			if (data.Col_4 === "") {
				data.Col_4 = "0";
			}
			if (data.Col_5 === "") {
				data.Col_5 = "0";
			}
			if (data.Col_6 === "") {
				data.Col_6 = "0";
			}
			if (data.Col_7 === "") {
				data.Col_7 = "0";
			}
			this.detailModel.getData().results[index].WeekTotal = (parseFloat(data.Col_1) + parseFloat(data.Col_2) + parseFloat(data.Col_3) +
				parseFloat(data.Col_4) + parseFloat(data.Col_5) + parseFloat(data.Col_6) +
				parseFloat(data.Col_7)).toString();
			this.detailModel.refresh(true);
		},

		onChkBoxSelect: function (oEvent) {
			if (!oEvent.getParameter("selected")) {
				this.checkCount--;
				var index = parseInt(oEvent.getSource().getParent().getBindingContext("detailModel").getPath().split("/")[2]) + 1;
				this.detailModel.getData().results[index].Item_indicator = false;
				this.detailModel.refresh(true);
			} else {
				this.checkCount++;
				var index = parseInt(oEvent.getSource().getParent().getBindingContext("detailModel").getPath().split("/")[2]) + 1;
				this.detailModel.getData().results[index].Item_indicator = true;
				this.detailModel.refresh(true);
			}

			this.getView().byId("chkBoxSelectAll").setSelected(false);

			var totalItem = 0;
			try {
				totalItem = this.detailModel.getData().results.length / 2;
			} catch (exception) {
				// Handle Exception
			}
			if (this.checkCount >= totalItem) {
				this.getView().byId("chkBoxSelectAll").setSelected(true);
			}

		},

		selectAllCheck: function (oEvent) {
			var that = this;
			var isAllSelected = oEvent.getParameter("selected");
			var data = this.detailModel.getData();
			var tableData = data.results;
			this.checkCount = 0;
			for (var i = 0; i < tableData.length; i++) {

				if (isAllSelected) {
					tableData[i].Item_indicator = true;
					this.checkCount++;
				} else {
					tableData[i].Item_indicator = false;
				}
			}

			data.results = tableData;
			this.detailModel.setData(data);
			this.detailModel.refresh(true);

		},

		onCofirmAsn: function (oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			var that = this;
			this.detailModel.refresh(true);
			this.data = this.headerModel.getData();
			this.tableData = this.detailModel.getData().results;

			var oTable = this.getView().byId("DeliveryTableId");

			var contexts = oTable.getSelectedContexts();

			var createData = {
				"Amount": this.data.Amount,
				"Buyer_Name": this.data.Buyer_Name,
				"Currency": this.data.Currency,
				"Item_Count": this.data.Item_Count,
				"Order_Type": this.data.Order_Type,
				"Order_Type_Desc": this.data.Order_Type_Desc,
				"Po_Date": this.data.Po_Date,
				"Po_No": this.data.Po_No,
				"Purchase_Group": this.data.Purchase_Group,
				"Purchase_Group_Desc": this.data.Purchase_Group_Desc,
				"Purchase_Org": this.data.Purchase_Org,
				"Purchase_Org_Desc": this.data.Purchase_Org_Desc,
				"Status": this.data.Status,
				"Upcoming_Del_Date": this.data.Upcoming_Del_Date,
				"Vendor_Name": this.data.Vendor_Name,
				"Vendor_No": this.data.Vendor_No,
				"headertoitemNav": [],
				"headertoschconfNav": [],
				"headertopoconfirmnav": []
			};

			if (contexts) { //Check whether table has any selected contexts
				var items = contexts.map(function (c) {
					return c.getObject();
				});

				if (items.length) {

					for (var i = 0; i < items.length; i++) {
						var temp = parseFloat(items[i].Del_Quantity);
						if (temp === 0) {
							sap.m.MessageBox.error("Quantity can't be Zero");
							sap.ui.core.BusyIndicator.hide();
							return;
						}
						if (temp < 0 || items[i].Del_Quantity.includes("-")) {
							sap.m.MessageBox.error("Quantity can't be in negative.");
							sap.ui.core.BusyIndicator.hide();
							return;
						}
						var ConfirmDate = new Date(items[i].ShipDate.substring(0, 4) + "-" + items[i].ShipDate.substring(4, 6) + "-" + items[i].ShipDate
							.substring(6, 8));
						// var ConfirmDate = new Date(items[i].Conf_Date.substring(0, 4) + "-" + items[i].Conf_Date.substring(4, 6) + "-" +
						// 	items[i].Conf_Date.substring(6, 8));
						ConfirmDate = ConfirmDate.setHours(0, 0, 0, 0); // Confirmation Date
						var CurrentDate = new Date().setHours(0, 0, 0, 0); // Current Date
						// CurrentDate = CurrentDate// Current Date

						// var Difference = (new Date(ConfirmDate) - new Date(ReqDate)) / 24 / 60 / 60 / 1000;
						if (ConfirmDate < CurrentDate) {
							MessageBox.error("Please enter current date or future date");
							sap.ui.core.BusyIndicator.hide();
							return;
						}

						if (items[i].Del_Quantity && items[i].Conf_Date) {
							if (parseInt(items[i].Del_Quantity) <= (parseInt(items[i].PO_Quantity) - parseInt(items[i].Conf_Quantity))) {
								createData.headertopoconfirmnav.push(items[i]);
							} else {
								MessageBox.error("Quantity to be confirmed is greater than the balance quantity for " + items[i].Material_Desc);
								sap.ui.core.BusyIndicator.hide();
								return;
							}
						} else {
							MessageBox.error("Quantity and Confirmation date is required for selected items");
							sap.ui.core.BusyIndicator.hide();
							return;
						}
					}
				}
			}
			// for (var i = 0; i < that.tableData.length; i++) {
			// 	if (that.tableData[i].Item_indicator === "true" || that.tableData[i].Item_indicator === true) {
			// 		/*	try {
			// 				that.tableData[i + 1].Item_indicator = "true";
			// 			} catch (exception) {
			// 				// test
			// 			}*/
			// 		delete that.tableData[i].__metadata;
			// 		that.tableData[i].Item_indicator = "true";
			// 		createData.headertoschconfNav.push(that.tableData[i]);
			// 	}
			// }

			if (createData.headertopoconfirmnav.length <= 0) {
				MessageBox.error("No PO Items Selected");
				sap.ui.core.BusyIndicator.hide();
			} else {
				MessageBox.confirm("Do You Want to Confirm ? ", {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CLOSE],
					onClose: function (oAction) {
						if (oAction === "OK") {
							sap.ui.core.BusyIndicator.show(5000);
							that.oDataModel.create("/PO_HEADERSet", createData, null,
								function (oData) {
									MessageBox.confirm("Successfully Confirmed!", {
										icon: sap.m.MessageBox.Icon.SUCCESS,
										title: "SUCCESS",
										actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CLOSE],
										onClose: function (action) {
											if (action === "OK") {
												sap.ui.core.BusyIndicator.hide();
												oTable.removeSelections();
												var data = that.flagModel.getData();
												data.confirmPressFlag = true;
												that.flagModel.refresh(true);
												sp.fiori.purchaseorder.controller.formatter.onNavBack();
												// that.router.navTo("PoMaster");

											} else if (action === "CLOSE") {
												sap.ui.core.BusyIndicator.hide();
												sp.fiori.purchaseorder.controller.formatter.onNavBack();
											}
										}
									});

								},
								function (oError) {
									sap.ui.core.BusyIndicator.hide();
									try {
										var error = jQuery.parseJSON(oError.response.body);
										if (error.error.innererror.errordetails.length > 0) {
											that.FragConfirmResponse = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoConfirmResponse", this);
											that.getView().addDependent(that.FragConfirmResponse);
											var errorLength = error.error.innererror.errordetails.length;
											error.error.innererror.errordetails.splice(errorLength - 1, 1);
											that.ConfirmFragModel.setData(error.error.innererror);
											that.ConfirmFragModel.refresh(true);
											that.FragConfirmResponse.setModel(that.ConfirmFragModel, "errorModel");

											var Dialog = new sap.m.Dialog({
												title: "Error",
												content: that.FragConfirmResponse,
												Draggable: true,
												buttons: [
													new sap.m.Button({
														text: "Close",
														press: function () {
															Dialog.close();
														}
													})
												],
												afterClose: function () {
													Dialog.destroy();
												}
											});
											Dialog.open();
										}
									} catch (err) {
										sap.ui.core.BusyIndicator.hide();
									}
								});
						} else {
							sap.ui.core.BusyIndicator.hide();
						}
					}
				});
			}
		},
		onFragClose: function (oEvent) {
			oEvent.getSource().getParent().close();
		},

		onQuantityPress: function (oEvent) {
			var that = this;
			var Ebelp = oEvent.getSource().getBindingContext("detailModel").getProperty("Item_No");

			// var Ebelp = sPath.split("/")[3];
			var type = "R";
			var request = "/PoScheduleSet?$filter= Ebeln eq '" + this.Po_Num + "' and Ebelp eq '" + Ebelp + "' and Type eq '" +
				type + "'";
			this.oDataModel.read(request, null, null, false, function (oData) {
				// that.odata = oData;
				that.fragModel.setData(oData);
				that.fragModel.refresh(true);
			},
				function (oError) {

					var value = JSON.parse(oError.response.body);
					MessageBox.error(value.error.message.value);
					return;
				}
			);
			var PID = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoFragRequiredQuan", this);
			this.getView().addDependent(PID);
			PID.setModel(this.oDataModel);
			PID.setModel(this.fragModel, "fragModel");
			var Dialog = new sap.m.Dialog({
				title: "Schedule",
				content: PID,
				Draggable: true,
				buttons: [
					new sap.m.Button({
						text: "Cancel",
						press: function () {
							Dialog.close();
						}
					})
				],
				afterClose: function () {
					Dialog.destroy();
				}
			});
			Dialog.open();
		},

		onAmountPress: function (oAmount) {
			if (!this.QuantAmount) {
				this.QuantAmount = sap.ui.xmlfragment("sp.fiori.purchaseorder.fragment.PoAmountFrag", this);
				this.getView().addDependent(this.QuantAmount);
			}

			var sPath = oAmount.getSource().getBindingContext("detailModel").sPath;
			var data = this.detailModel.getProperty(sPath);
			this.detailAmountPopoverModel.setData(data);
			this.QuantAmount.setModel(this.detailAmountPopoverModel);
			this.QuantAmount.openBy(oAmount.getSource());
		},

		onQtyLiveChange: function (oEvent) {
			if (oEvent.getParameter("newValue").includes(".")) {
				MessageBox.error("Fractional Values are not allowed");
				oEvent.getSource().setValue(parseInt(oEvent.getParameter("newValue"), 10).toString());
				return;
			}
		},
		onTableFinished: function (oEvent) {
			var tableItems = this.getView().byId("DeliveryTableId").getItems();
			for (var i = 0; i < tableItems.length; i++) {
				var item = tableItems[i];
				// item.$().find('INPUT').attr('disabled', true).css('color', '#000000');
			}
		},
		onDateChanged: function (oEvent) {
			var Item = oEvent.getSource();
			Item.$().find('INPUT').attr('disabled', true).css('color', '#000000');
		},
		onDateFilter: function (event) {
			var FromDate = this.byId("FromDateId").getValue();
			var ToDate = this.byId("ToDateId").getValue();
			var oBindings = this.getView().byId("DeliveryTableId").getBinding("items");
			if (FromDate || ToDate) {
				var Filter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter({
							path: "ShipDate",
							operator: sap.ui.model.FilterOperator.LE,
							value1: ToDate
						}),
						new sap.ui.model.Filter({
							path: "ShipDate",
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
			this.getView().byId("DeliveryTableId").getBinding("items").filter([]);
		},
		onMaterialLiveChange: function (oEvent) {
			var search = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
			var afilters = [];
			if (search) {
				// var values = search.split(" ");
				// if (values.length) {
				// 	for (var i = 0; i < values.length; i++) {
				// 		if (values[i].trim()) {
				afilters.push(new sap.ui.model.Filter("Material_No", sap.ui.model.FilterOperator.Contains, search));
				afilters.push(new sap.ui.model.Filter("Material_Desc", sap.ui.model.FilterOperator.Contains, search));

				//			afilters.push(new sap.ui.model.Filter("Material_No", sap.ui.model.FilterOperator.Contains, values[i]));
				// 			afilters.push(new sap.ui.model.Filter("Material_Desc", sap.ui.model.FilterOperator.Contains, values[i]));
				// 		}
				// 	}
				// }
			} else {
				afilters.push(new sap.ui.model.Filter("Material_No", sap.ui.model.FilterOperator.EQ, ""));
				afilters.push(new sap.ui.model.Filter("Material_Desc", sap.ui.model.FilterOperator.Contains, ""));
			}
			this.byId("DeliveryTableId").getBinding("items").filter(new sap.ui.model.Filter({
				filters: afilters
			}));
		},
		onExportPress: function () {

			var data = this.getView().getModel("detailModel").getData().results;
			this.filename = "PO.xlsx";


			if (data.length > 0) {
				let expCols = [], cell, prop, temp = "{0}";
				const row = this.byId("DeliveryTableId").getItems()[0];
				this.byId("DeliveryTableId").getColumns().forEach((col, index) => {
					if (col.getAggregation("header")) {
						// making export columns
						cell = row.getAggregation("cells")[index];
						switch (cell.getMetadata().getName()) {
							case "sap.m.ObjectIdentifier":
								prop = [cell.getBindingInfo("title").parts[0].path];
								temp = "{0}";
								break;
							case "sap.m.ObjectNumber":
								prop = cell.getBindingInfo("number").parts[0].path;

								break;
							case "sap.m.Input":
								prop = cell.getBindingInfo("value").parts[0].path;
								break;
							case "sap.m.DatePicker":
								prop = cell.getBindingInfo("value").parts[0].path;
								break;
							case "sap.m.Button":
								break;
							default:
								prop = cell.getBindingInfo("text").parts[0].path;
								break;
						}
						expCols.push({
							label: col.getAggregation("header").getText(),
							property: prop,
							template: temp
						});
					}
				});
				const oSheet = new Spreadsheet({
					workbook: { columns: expCols },
					dataSource: data,
					fileName: this.filename
				});
				oSheet.build().finally(() => oSheet.destroy());
			} else
				MessageToast.show("No data to export");
		},
	});
});