/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "sp/fiori/purchaseorder/model/models",
        "sap/m/MessageBox",
        "sp/fiori/purchaseorder/controller/formatter",
        "sap/ui/model/odata/ODataModel"
    ],
    function (UIComponent, Device, models, MessageBox, formatter, ODataModel) {
        "use strict";

        return UIComponent.extend("sp.fiori.purchaseorder.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);
                var slash = window.location.href.includes("site") ? "/" : "";
                var modulePath = jQuery.sap.getModulePath("sp/fiori/purchaseorder");
                modulePath = modulePath === "." ? "" : modulePath;
                var serviceUrl = modulePath + slash + this.getMetadata().getManifestEntry("sap.app").dataSources.mainService.uri;
                var oDataModel = new ODataModel(serviceUrl, true);

                // metadata failed
                oDataModel.attachMetadataFailed(err => {
                    var response = err.getParameter("response").body;
                    if (response.indexOf("<?xml") !== -1) {
                        MessageBox.error($($.parseXML(response)).find("message").text());
                    } else {
                        MessageBox.error(response);
                    }
                });

                oDataModel.attachMetadataLoaded(() => {
                    this.setModel(oDataModel);
                    sap.ui.getCore().setModel(oDataModel, "oDataModel");
                    oDataModel.setDefaultCountMode("None");

                    var flagModel = new sap.ui.model.json.JSONModel({ "confirmPressFlag": false });
                    sap.ui.getCore().setModel(flagModel, "flagModel");
                });

                // odata request failed
                oDataModel.attachRequestFailed(err => {
                    var responseText = err.getParameter("responseText");
                    if (responseText.indexOf("<?xml") !== -1) {
                        MessageBox.error($($.parseXML(responseText)).find("message").text());
                    } else {
                        MessageBox.error(JSON.parse(responseText).error.message.value);
                    }
                });
                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);