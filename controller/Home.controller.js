sap.ui.define([
	"com/infocus/salesApplication/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/viz/ui5/api/env/Format",
	"com/infocus/salesApplication/libs/html2pdf.bundle",
	"jquery.sap.global"
], function(BaseController, Fragment, Filter, FilterOperator, JSONModel, MessageBox, Format, html2pdf_bundle, jQuery) {
	"use strict";

	return BaseController.extend("com.infocus.salesApplication.controller.Home", {

		/*************** on Load Functions *****************/
		onInit: function() {

			// Initialize the user ID and other parameters
			this._initializeAppData();

			// Update the global data model
			this._updateGlobalDataModel();

			this._updateGlobalDataModel2();
			this._updateGlobalDataModel3();

		},
		_initializeAppData: function() {
			// this.getCustomerMasterParametersData();
			this.getCompanyCodeParametersData();
		},
		// Default
		_updateGlobalDataModel: function() {
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			if (oGlobalDataModel) {
				oGlobalDataModel.setProperty("/selectedTabText", "All Customer Turnover");
				oGlobalDataModel.setProperty("/isChartFragment1Visible", true);
				oGlobalDataModel.setProperty("/isChartFragment2Visible", false);
				oGlobalDataModel.setProperty("/isChartFragment3Visible", true);
				oGlobalDataModel.setProperty("/isChartFragment4Visible", false);
				oGlobalDataModel.setProperty("/isChartFragment5Visible", true);
				oGlobalDataModel.setProperty("/isChartFragment6Visible", false);
				oGlobalDataModel.setProperty("/isChartFragment7Visible", true);
				oGlobalDataModel.setProperty("/isChartFragment8Visible", false);

			} else {
				console.error("Global data model is not available.");
			}
		},
		// Customer Due
		_updateGlobalDataModel2: function() {
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			if (oGlobalDataModel) {
				oGlobalDataModel.setProperty("/selectedTabText2", "All Customer Outstanding");
				oGlobalDataModel.setProperty("/isNewChartFragment1Visible", true);
				oGlobalDataModel.setProperty("/isNewChartFragment2Visible", true);
				oGlobalDataModel.setProperty("/isNewChartFragment3Visible", true);
				oGlobalDataModel.setProperty("/isNewChartFragment4Visible", true);

			} else {
				console.error("Global data model is not available.");
			}
		},
		// Customer Due Qtr/FY
		_updateGlobalDataModel3: function() {
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			if (oGlobalDataModel) {
				oGlobalDataModel.setProperty("/selectedTabText3", "Single Customer Outstanding");
				oGlobalDataModel.setProperty("/isCusQtrFYFragment1Visible", true);
				oGlobalDataModel.setProperty("/isCusQtrFYFragment2Visible", true);

			} else {
				console.error("Global data model is not available.");
			}
		},
		validateInputs: function() {
			var oComponent = this.getOwnerComponent();
			var oGlobalData = oComponent.getModel("globalData").getData();
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();
			var oSelectedTabText = oGlobalData.selectedTabText;
			var oSelectedTabText3 = oGlobalData.selectedTabText3; // For Customer Due Qtr/FY
			var oView = this.getView();

			// Map input IDs to friendly field names
			var mFieldNames = {
				"_companyCodeId": "Company Code",
				"_customerInputId": "Customer",
				"_financialYearInputId": "Fiscal Year",
				"_quarterInputId": "Quarter",
				"_quarterInputYearId": "Quarter Year"
			};

			var getInputIdsToValidate = function() {

				var isSingleCustomer = oSelectedTabText === "Single Customer Turnover";

				if (isSingleCustomer) {
					return oSelectedIndex === 0 ? ["_companyCodeId", "_customerInputId", "_financialYearInputId"] : ["_companyCodeId",
						"_customerInputId", "_quarterInputId",
						"_quarterInputYearId"
					];
				} else {
					return oSelectedIndex === 0 ? ["_companyCodeId", "_financialYearInputId"] : ["_companyCodeId", "_quarterInputId",
						"_quarterInputYearId"
					];
				}

			};

			var bAllValid = true;
			var aEmptyFields = [];
			var aInputIds = getInputIdsToValidate();

			aInputIds.forEach(function(sId) {
				var oInput = oView.byId(sId);
				if (oInput && oInput.getVisible()) {
					var sValue = oInput.getValue();
					var sTrimmedValue = sValue ? sValue.trim() : "";

					if (!sTrimmedValue) {
						oInput.setValueState("Error");
						oInput.setValueStateText("This field cannot be empty.");
						bAllValid = false;

						var sFieldName = mFieldNames[sId] || sId;
						aEmptyFields.push(sFieldName);
					} else {
						oInput.setValueState("None");
					}
				}
			});

			if (aEmptyFields.length > 0) {
				sap.m.MessageBox.error("Please fill the following fields:\n\n" + aEmptyFields.join("\n"));
			}

			return bAllValid;
		},

		/*************** get parameters data *****************/
		getCustomerMasterParametersData: function() {
			var that = this;
			// var oCustomerMasterModel = this.getOwnerComponent().getModel("customerMasterModel");
			// var pUrl = "/ZCUST_MASTER";
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var aCompanyCode = oGlobalData.selectedCompanyCodeId || [];

			var oCustomerMasterModel = this.getOwnerComponent().getModel("quarterlyTurnoverModel");
			var pUrl = "/es_custf4set";

			var filters = [];
			var sBukrs = aCompanyCode;

			filters.push(new sap.ui.model.Filter("bukrs", sap.ui.model.FilterOperator.EQ, sBukrs));

			sap.ui.core.BusyIndicator.show(0);
			oCustomerMasterModel.read(pUrl, {
				filters: filters,
				success: function(response) {
					var pData = response.results;
					console.log(pData);

					// Add new fields to each object
					var updatedData = pData.map(function(item) {
						return Object.assign({}, item, {
							customer: item.kunnr,
							name: item.name1
						});
					});

					console.log("Updated Customer F4 Data:", updatedData);

					// Sort the data based on the Customer number (Customer field)
					updatedData.sort(function(a, b) {
						// Convert customer number to integers for correct numerical sorting
						return parseInt(a.Customer) - parseInt(b.Customer);
					});
					sap.ui.core.BusyIndicator.hide();

					// set the Customer data 
					var oCustomerMasterData = that.getOwnerComponent().getModel("customerMasterData");
					oCustomerMasterData.setData(updatedData);

				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.log(error);
					var errorObject = JSON.parse(error.responseText);
					sap.m.MessageBox.error(errorObject.error.message.value);
				}
			});

		},
		getCompanyCodeParametersData: function() {
			var that = this;
			var oQuarterlyTurnoverModel = this.getOwnerComponent().getModel("quarterlyTurnoverModel");
			var pUrl = "/es_f4bukrsset";

			sap.ui.core.BusyIndicator.show(0);
			oQuarterlyTurnoverModel.read(pUrl, {
				success: function(response) {
					var pData = response.results;
					console.log(pData);

					// Sort the data based on the Customer number (Customer field)
					// pData.sort(function(a, b) {
					// 	// Convert customer number to integers for correct numerical sorting
					// 	return parseInt(a.Customer) - parseInt(b.Customer);
					// });
					sap.ui.core.BusyIndicator.hide();

					// set the Customer data 
					var oCompanyCode = that.getOwnerComponent().getModel("companyCode");
					oCompanyCode.setData(pData);

				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.log(error);
					var errorObject = JSON.parse(error.responseText);
					sap.m.MessageBox.error(errorObject.error.message.value);
				}
			});

		},

		/*************** set the inputId & create the fragment *****************/
		// For SAPUI5 Version 1.52

		handleValueCustomerMaster: function(oEvent) {
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var aCompanyCode = oGlobalData.selectedCompanyCodeId || [];

			if (aCompanyCode.length === 0) {
				sap.m.MessageBox.error("Please Select Company Code");
				return;
			}

			// Show BusyIndicator
			sap.ui.core.BusyIndicator.show(0);

			this.getCustomerMasterParametersData();

			this._customerInputId = oEvent.getSource().getId();
			var that = this;

			if (!this._oCustomerMasterDialog) {
				// ✅ Use synchronous fragment loading (UI5 1.52 compatible)
				this._oCustomerMasterDialog = sap.ui.xmlfragment(
					that.getView().getId(),
					"com.infocus.salesApplication.view.dialogComponent.DialogCustomerMaster",
					that
				);

				// Add dialog as dependent so it gets destroyed with the view
				that.getView().addDependent(this._oCustomerMasterDialog);
			}

			// Hide BusyIndicator once dialog is ready
			sap.ui.core.BusyIndicator.hide();

			// Open the dialog
			this._oCustomerMasterDialog.open();
		},

		// handleValueCustomerMaster: function(oEvent) {

		// 	var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
		// 	var oGlobalData = oGlobalDataModel.getData();
		// 	var aCompanyCode = oGlobalData.selectedCompanyCodeId || [];

		// 	if (aCompanyCode.length === 0) {
		// 		sap.m.MessageBox.error("Please Select Company Code");
		// 		return;
		// 	} else {
		// 		// Show BusyIndicator
		// 		sap.ui.core.BusyIndicator.show(0);

		// 		this.getCustomerMasterParametersData();

		// 		this._customerInputId = oEvent.getSource().getId();
		// 		var that = this;

		// 		if (!this._oCustomerMasterDialog) {
		// 			Fragment.load({
		// 				id: that.getView().getId(),
		// 				name: "com.infocus.salesApplication.view.dialogComponent.DialogCustomerMaster",
		// 				controller: that
		// 			}).then(function(oDialog) {
		// 				that._oCustomerMasterDialog = oDialog;
		// 				that.getView().addDependent(oDialog);
		// 				// Hide BusyIndicator once dialog is ready
		// 				sap.ui.core.BusyIndicator.hide();
		// 				oDialog.open();
		// 			}).catch(function(oError) {
		// 				// Hide BusyIndicator once dialog is ready
		// 				sap.ui.core.BusyIndicator.hide();
		// 				console.error("Error loading Customer Master Dialog:", oError);
		// 			});
		// 		} else {
		// 			// Hide BusyIndicator once dialog is ready
		// 			sap.ui.core.BusyIndicator.hide();
		// 			this._oCustomerMasterDialog.open();
		// 		}
		// 	}
		// },
		handleValueFiscalYear: function(oEvent) {
			this._financialYearInputId = oEvent.getSource().getId();
			// open fragment
			if (!this.oOpenDialogFiscalYear) {
				this.oOpenDialogFiscalYear = sap.ui.xmlfragment("com.infocus.salesApplication.view.dialogComponent.DialogFiscalYear", this);
				this.getView().addDependent(this.oOpenDialogFiscalYear);
			}
			this.oOpenDialogFiscalYear.open();
		},
		handleValueQuarter: function(oEvent) {
			this._quarterInputId = oEvent.getSource().getId();
			// open fragment
			if (!this.oOpenDialogQuarter) {
				this.oOpenDialogQuarter = sap.ui.xmlfragment("com.infocus.salesApplication.view.dialogComponent.DialogQuarter", this);
				this.getView().addDependent(this.oOpenDialogQuarter);
			}
			this.oOpenDialogQuarter.open();
		},
		handleValueQuarterYear: function(oEvent) {
			this._quarterInputYearId = oEvent.getSource().getId();
			// open fragment
			if (!this.oOpenDialogQuarterYear) {
				this.oOpenDialogQuarterYear = sap.ui.xmlfragment("com.infocus.salesApplication.view.dialogComponent.DialogQuarterYear", this);
				this.getView().addDependent(this.oOpenDialogQuarterYear);
			}
			this.oOpenDialogQuarterYear.open();
		},
		handleValueCompanyCode: function(oEvent) {
			var that = this;
			this._companyCodeId = oEvent.getSource().getId();

			// Create fragment if not already loaded
			if (!this.oOpenDialogCompanyCode) {
				this.oOpenDialogCompanyCode = sap.ui.xmlfragment(
					that.getView().getId(),
					"com.infocus.salesApplication.view.dialogComponent.DialogCompanyCode",
					that
				);
				that.getView().addDependent(this.oOpenDialogCompanyCode);
			}

			this.oOpenDialogCompanyCode.open();

			// this._companyCodeId = oEvent.getSource().getId();
			// // open fragment
			// if (!this.oOpenDialogCompanyCode) {
			// 	this.oOpenDialogCompanyCode = sap.ui.xmlfragment("com.infocus.salesApplication.view.dialogComponent.DialogCompanyCode", this);
			// 	this.getView().addDependent(this.oOpenDialogCompanyCode);
			// }
			// this.oOpenDialogCompanyCode.open();

			// var that = this;

			// if (!this.oOpenDialogCompanyCode) {
			// 	Fragment.load({
			// 		id: that.getView().getId(),
			// 		name: "com.infocus.salesApplication.view.dialogComponent.DialogCompanyCode",
			// 		controller: that
			// 	}).then(function(oDialog) {
			// 		that.oOpenDialogCompanyCode = oDialog;
			// 		that.getView().addDependent(oDialog);
			// 		oDialog.open();
			// 	}).catch(function(oError) {
			// 		console.error("Error loading Company Code Dialog:", oError);
			// 	});
			// } else {
			// 	this.oOpenDialogCompanyCode.open();
			// }
		},

		/*************** search value within fragment *****************/

		onSearchCustomerMaster: function(oEvent) {
			var sQuery = oEvent.getParameter("newValue");
			var oList = Fragment.byId(this.getView().getId(), "idCustomerMasterList");
			if (!oList) return;

			var oBinding = oList.getBinding("items");
			if (!oBinding) return;

			var aFilters = [];
			if (sQuery) {
				var oFilter1 = new sap.ui.model.Filter("customer", sap.ui.model.FilterOperator.Contains, sQuery);
				var oFilter2 = new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(new sap.ui.model.Filter({
					filters: [oFilter1, oFilter2],
					and: false
				}));
			}

			oBinding.filter(aFilters);
		},
		onSearchCompanyCode: function(oEvent) {
			var sQuery = oEvent.getParameter("newValue");
			var oList = Fragment.byId(this.getView().getId(), "idCompanyCodeList");
			if (!oList) return;

			var oBinding = oList.getBinding("items");
			if (!oBinding) return;

			var aFilters = [];
			if (sQuery) {
				var oFilter1 = new sap.ui.model.Filter("bukrs", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(new sap.ui.model.Filter({
					filters: [oFilter1],
					and: false
				}));
			}

			oBinding.filter(aFilters);
		},
		_handleFiscalYearSearch: function(oEvent) {
			var sQuery = oEvent.getParameter("value");
			var oDialog = oEvent.getSource();

			var aItems = oDialog.getItems();
			aItems.forEach(function(oItem) {
				var sTitle = oItem.getTitle();
				if (sTitle && sTitle.toLowerCase().includes(sQuery.toLowerCase())) {
					oItem.setVisible(true);
				} else {
					oItem.setVisible(false);
				}
			});
		},
		_handleQuarterYearSearch: function(oEvent) {
			var sQuery = oEvent.getParameter("value");
			var oDialog = oEvent.getSource();

			var aItems = oDialog.getItems();
			aItems.forEach(function(oItem) {
				var sTitle = oItem.getTitle();
				if (sTitle && sTitle.toLowerCase().includes(sQuery.toLowerCase())) {
					oItem.setVisible(true);
				} else {
					oItem.setVisible(false);
				}
			});
		},

		/*************** set the each property to globalData & reflect data in input field  *****************/

		onSelectionChangeCustomerMaster: function(oEvent) {
			var oList = oEvent.getSource();
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var aSelectedCustomerIDs = oGlobalModel.getProperty("/selectedCustomerIDs") || [];
			var aSelectedCustomerNames = oGlobalModel.getProperty("/selectedCustomerNames") || [];

			var aAllItems = oList.getItems();
			aAllItems.forEach(function(oItem) {
				var sID = oItem.getTitle();
				var sName = oItem.getDescription();

				// If item is selected
				if (oItem.getSelected()) {
					if (!aSelectedCustomerIDs.includes(sID)) {
						aSelectedCustomerIDs.push(sID);
						aSelectedCustomerNames.push(sName);
					}
				} else {
					// If item is unselected
					var index = aSelectedCustomerIDs.indexOf(sID);
					if (index !== -1) {
						aSelectedCustomerIDs.splice(index, 1);
						aSelectedCustomerNames.splice(index, 1);
					}
				}
			});

			oGlobalModel.setProperty("/selectedCustomerNames", aSelectedCustomerNames);
			oGlobalModel.setProperty("/selectedCustomerIDs", aSelectedCustomerIDs);
			oGlobalModel.setProperty("/selectedCustomerNamesDisplay", aSelectedCustomerNames.join(", "));
		},
		onConfirmCustomerMaster: function() {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");

			// Values are already being maintained correctly in the model
			var aSelectedNamesDisplay = oGlobalModel.getProperty("/selectedCustomerNamesDisplay") || "";
			var aSelectedNames = oGlobalModel.getProperty("/selectedCustomerNames") || [];
			var aSelectedIDs = oGlobalModel.getProperty("/selectedCustomerIDs") || [];

			// You can now directly use these for any processing or display
			console.log("Confirmed selected IDs:", aSelectedIDs);
			console.log("Confirmed selected Names:", aSelectedNames);
			console.log("Confirmed selected Display Names:", aSelectedNamesDisplay);

			oGlobalModel.refresh(true);

			this._resetCustomerMasterDialog();
			this._oCustomerMasterDialog.close();
		},
		onCloseCustomerMaster: function() {
			// Clear global model selections
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			oGlobalModel.setProperty("/selectedCustomerIDs", []);
			oGlobalModel.setProperty("/selectedCustomerNames", []);
			oGlobalModel.setProperty("/selectedCustomerNamesDisplay", "");

			this._resetCustomerMasterDialog();
			this._oCustomerMasterDialog.close();
		},
		_resetCustomerMasterDialog: function() {
			var oList = Fragment.byId(this.getView().getId(), "idCustomerMasterList");
			var oSearchField = Fragment.byId(this.getView().getId(), "idCustomerSearchField");

			// Clear Search
			if (oSearchField) {
				oSearchField.setValue("");

				// Manually trigger the liveChange event handler with empty value
				this.onSearchCustomerMaster({
					getParameter: function() {
						return "";
					}
				});
			}

			// Clear selections
			if (oList) {
				oList.getItems().forEach(function(oItem) {
					oItem.setSelected(false);
				});
			}
		},

		onSelectionChangeCompanyCode: function(oEvent) {
			var oList = oEvent.getSource();
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var aSelectedCompanyCodeIDs = oGlobalModel.getProperty("/selectedCompanyCodeId") || [];
			// var aSelectedCustomerNames = oGlobalModel.getProperty("/selectedCustomerNames") || [];

			var aAllItems = oList.getItems();
			aAllItems.forEach(function(oItem) {
				var sID = oItem.getTitle();
				var sName = oItem.getDescription();

				// If item is selected
				if (oItem.getSelected()) {
					if (!aSelectedCompanyCodeIDs.includes(sID)) {
						aSelectedCompanyCodeIDs.push(sID);
						// aSelectedCustomerNames.push(sName);
					}
				} else {
					// If item is unselected
					var index = aSelectedCompanyCodeIDs.indexOf(sID);
					if (index !== -1) {
						aSelectedCompanyCodeIDs.splice(index, 1);
						// aSelectedCustomerNames.splice(index, 1);
					}
				}
			});

			// oGlobalModel.setProperty("/selectedCustomerNames", aSelectedCustomerNames);
			oGlobalModel.setProperty("/selectedCompanyCodeId", aSelectedCompanyCodeIDs);
			oGlobalModel.setProperty("/selectedCompanyIdDisplay", aSelectedCompanyCodeIDs.join(", "));
		},
		onConfirmCompanyCode: function() {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");

			// Values are already being maintained correctly in the model
			var aSelectedNamesDisplay = oGlobalModel.getProperty("/selectedCompanyIdDisplay") || "";
			// var aSelectedNames = oGlobalModel.getProperty("/selectedCustomerNames") || [];
			var aSelectedIDs = oGlobalModel.getProperty("/selectedCompanyCodeId") || [];

			// You can now directly use these for any processing or display
			console.log("Confirmed selected IDs:", aSelectedIDs);
			// console.log("Confirmed selected Names:", aSelectedNames);
			console.log("Confirmed selected Display Names:", aSelectedNamesDisplay);

			oGlobalModel.refresh(true);

			this._resetCompanyCodeDialog();
			this.oOpenDialogCompanyCode.close();
		},
		onCloseCompanyCode: function() {
			// Clear global model selections
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			oGlobalModel.setProperty("/selectedCompanyCodeId", []);
			oGlobalModel.setProperty("/selectedCompanyIdDisplay", "");

			this._resetCompanyCodeDialog();
			this.oOpenDialogCompanyCode.close();
		},
		_resetCompanyCodeDialog: function() {
			var oList = Fragment.byId(this.getView().getId(), "idCompanyCodeList");
			var oSearchField = Fragment.byId(this.getView().getId(), "idCompanyCodeSearchField");

			// Clear Search
			if (oSearchField) {
				oSearchField.setValue("");

				// Manually trigger the liveChange event handler with empty value
				this.onSearchCompanyCode({
					getParameter: function() {
						return "";
					}
				});
			}

			// Clear selections
			if (oList) {
				oList.getItems().forEach(function(oItem) {
					oItem.setSelected(false);
				});
			}
		},

		_handleFiscalYearClose: function(oEvent) {
			var aSelectedItems = oEvent.getParameter("selectedItems"); // Get selected items (multiSelect enabled)
			var aSelectedYears = [];

			if (aSelectedItems && aSelectedItems.length > 0) {
				aSelectedItems.forEach(function(oItem) {
					aSelectedYears.push(oItem.getTitle()); // Collect selected years
				});

				var oFiscalYearInput = this.byId(this._fiscalYearInputId); // Ensure input ID is correct
				if (oFiscalYearInput) {
					oFiscalYearInput.setValue(aSelectedYears.join(", ")); // Display selected values in input
				}

				// Store selected fiscal years in the global model
				var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
				if (oGlobalDataModel) {
					oGlobalDataModel.setProperty("/fiscalYears", aSelectedYears);
				}
			}

			// Reset visibility
			oEvent.getSource().getItems().forEach(function(oItem) {
				oItem.setVisible(true);
			});
		},
		_handleValueQuarterClose: function(oEvent) {
			var aSelectedItems = oEvent.getParameter("selectedItems"); // Get selected items for multiSelect
			var aSelectedQuarters = [];

			if (aSelectedItems && aSelectedItems.length > 0) {
				aSelectedItems.forEach(function(oItem) {
					aSelectedQuarters.push(oItem.getTitle()); // Collect selected quarters
				});

				var oQuarterInput = this.byId(this._quarterInputId); // Ensure input ID is correct
				if (oQuarterInput) {
					oQuarterInput.setValue(aSelectedQuarters.join(", ")); // Display selected values
				}

				// Store selected quarters in the global model
				var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
				if (oGlobalDataModel) {
					oGlobalDataModel.setProperty("/selectedQuarters", aSelectedQuarters);
				}
			}

			// Reset visibility
			oEvent.getSource().getItems().forEach(function(oItem) {
				oItem.setVisible(true);
			});
		},
		_handleQuarterYearClose: function(oEvent) {
			var aSelectedItems = oEvent.getParameter("selectedItems"); // Get selected items for multiSelect
			var aSelectedYears = [];

			if (aSelectedItems && aSelectedItems.length > 0) {
				aSelectedItems.forEach(function(oItem) {
					aSelectedYears.push(oItem.getTitle()); // Collect selected years
				});

				var oQuarterYearInput = this.byId(this._quarterInputYearId); // Ensure input ID is correct
				if (oQuarterYearInput) {
					oQuarterYearInput.setValue(aSelectedYears.join(", ")); // Display selected values
				}

				// Store selected quarter years in the global model
				var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
				if (oGlobalDataModel) {
					oGlobalDataModel.setProperty("/selectedQuarterYears", aSelectedYears);
				}
			}

			// Reset visibility
			oEvent.getSource().getItems().forEach(function(oItem) {
				oItem.setVisible(true);
			});
		},

		/*************** Clear the input value in livechange event  *****************/

		onCustomerInputLiveChange: function(oEvent) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var sValue = oEvent.getParameter("value");
			if (!sValue) {
				oGlobalModel.setProperty("/selectedCustomerNames", []);
				oGlobalModel.setProperty("/selectedCustomerIDs", []);
				oGlobalModel.setProperty("/selectedCustomerNamesDisplay", "");
			}
		},
		onCompanyCodeInputLiveChange: function(oEvent) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var sValue = oEvent.getParameter("value");
			if (!sValue) {
				// oGlobalModel.setProperty("/selectedCustomerNames", []);
				oGlobalModel.setProperty("/selectedCompanyCodeId", []);
				oGlobalModel.setProperty("/selectedCompanyIdDisplay", "");
			}
		},
		onFiscalYearInputLiveChange: function(oEvent) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var sValue = oEvent.getParameter("value");
			if (!sValue) {
				oGlobalModel.setProperty("/fiscalYears", "");
			}
		},
		onQuarterInputLiveChange: function(oEvent) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var sValue = oEvent.getParameter("value");
			if (!sValue) {
				oGlobalModel.setProperty("/selectedQuarters", "");
			}
		},
		onQuarterYearInputLiveChange: function(oEvent) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var sValue = oEvent.getParameter("value");
			if (!sValue) {
				oGlobalModel.setProperty("/selectedQuarterYears", "");
			}
		},

		/*************** radio Button & drop down selection  *****************/

		onRadioButtonSelectList: function(oEvent) {
			var sSelectedKey = oEvent.getSource().getSelectedIndex();

			var oGlobalData = this.getOwnerComponent().getModel("globalData").getData();

			var oSelectedTabText = oGlobalData.selectedTabText; // Fiscal Year Wise
			var sSelectedTabTextCustomerDue = oGlobalData.selectedTabText2; // Customer Due
			var sSelectedTabTextCustomerDueQtrFy = oGlobalData.selectedTabText3; // Customer Due Qtr/FY Wise

			// Get the containers (HBox elements)
			var oFiscalYearBox = this.getView().byId("fiscalYearBox");
			var oQuarterBox = this.getView().byId("quarterBox");
			var oQuarterYearBox = this.getView().byId("quarterYearBox");
			var oCustomerMasterBox = this.getView().byId("customerMasterBox");
			var oCompanyCodeBox = this.getView().byId("companyCodeBox");
			var oButtonBox = this.getView().byId("buttonBox");

			// var oCustomerMasterBox2=this.getView().byId("customerMasterBox2"); // New CustomerDue Changes
			var oDatePickerBox = this.getView().byId("datePickerBox"); // New CustomerDue Changes
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");

			if (sSelectedKey === 0) { // Fiscal Year Wise selected
				oFiscalYearBox.setVisible(true);
				oQuarterBox.setVisible(false);
				oQuarterYearBox.setVisible(false);
				oDatePickerBox.setVisible(false);
				// oCompanyCodeBox.setVisible(false);
				oButtonBox.setVisible(true);

				oGlobalDataModel.setProperty("/isCustomerRadio", false);
				oGlobalDataModel.setProperty("/isCustomerQtrFyRadio", false);

				this.byId("panel1").setVisible(true);
				this.byId("panel2").setVisible(false);
				this.byId("panel3").setVisible(false);

				if (oSelectedTabText === "Single Customer Turnover") {
					oCustomerMasterBox.setVisible(true);
				} else {
					oCustomerMasterBox.setVisible(false);
				}

			} else if (sSelectedKey === 1) { // Quarterly Wise selected
				oFiscalYearBox.setVisible(false);
				oQuarterBox.setVisible(true);
				oQuarterYearBox.setVisible(true);
				oDatePickerBox.setVisible(false);
				// oCompanyCodeBox.setVisible(false);
				oButtonBox.setVisible(true);

				oGlobalDataModel.setProperty("/isCustomerRadio", false);
				oGlobalDataModel.setProperty("/isCustomerQtrFyRadio", false);

				this.byId("panel1").setVisible(true);
				this.byId("panel2").setVisible(false);
				this.byId("panel3").setVisible(false);

				if (oSelectedTabText === "Single Customer Turnover") {
					oCustomerMasterBox.setVisible(true);
				} else {
					oCustomerMasterBox.setVisible(false);
				}

			} else if (sSelectedKey === 2) { // Customer Due selected // New CustomerDue Changes

				oGlobalDataModel.setProperty("/isCustomerRadio", true);
				oGlobalDataModel.setProperty("/isCustomerQtrFyRadio", false);
				oFiscalYearBox.setVisible(false);
				oQuarterBox.setVisible(false);
				oQuarterYearBox.setVisible(false);

				oDatePickerBox.setVisible(true);
				// oCompanyCodeBox.setVisible(true);
				oButtonBox.setVisible(true);
				this.byId("panel1").setVisible(false);
				this.byId("panel2").setVisible(true);
				this.byId("panel3").setVisible(false);

				if (sSelectedTabTextCustomerDue === "Single Customer Outstanding") {
					oCustomerMasterBox.setVisible(true);
				} else {
					oCustomerMasterBox.setVisible(false);
				}

			} else if (sSelectedKey === 3) { // Customer Due Qtr/FY selected // New CustomerDue Changes

				oGlobalDataModel.setProperty("/isCustomerRadio", false);
				oGlobalDataModel.setProperty("/isCustomerQtrFyRadio", true);

				oFiscalYearBox.setVisible(false);
				oQuarterBox.setVisible(true);
				oQuarterYearBox.setVisible(true);

				oDatePickerBox.setVisible(false);
				// oCompanyCodeBox.setVisible(false);
				oButtonBox.setVisible(true);
				this.byId("panel1").setVisible(false);
				this.byId("panel2").setVisible(false);
				this.byId("panel3").setVisible(true);

				if (sSelectedTabTextCustomerDueQtrFy === "Single Customer Outstanding") {
					oCustomerMasterBox.setVisible(true);
				} else {
					oCustomerMasterBox.setVisible(false);
				}
			}
		},
		/*onChartTypeChange: function(oEvent) {
			// Get the selected radio button
			var chartType = oEvent.getSource().getSelectedKey();
			var oVizFrame = sap.ui.core.Fragment.byId(this.createId("chartFragment3"), "idVizFrame");

			oVizFrame.setVizType(chartType);

		},*/

		/*************** get the Icontabfilter select updated in global model  *****************/

		onTabSelect: function(oEvent) {
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			var oCustomerMasterBox = this.getView().byId("customerMasterBox");

			// Get the selected tab key
			var sSelectedKey = oEvent.getParameter("selectedKey");

			// Define the mapping of keys to text values
			var oTextMapping = {
				"scenario1": "All Customer Turnover",
				"scenario2": "Top 10 Customer Turnover",
				"scenario3": "Single Customer Turnover",
				"scenario4": "Turnover"
			};

			// visible non-visible on customer box
			if (oTextMapping[sSelectedKey] === "Single Customer Turnover") {
				oCustomerMasterBox.setVisible(true);
			} else {
				oCustomerMasterBox.setVisible(false);
			}

			// Update the global model with the corresponding text
			if (oGlobalDataModel) {
				oGlobalDataModel.setProperty("/selectedTabText", oTextMapping[sSelectedKey] || "");
			}
		},

		onTabSelect2: function(oEvent) {
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			var oCustomerMasterBox = this.getView().byId("customerMasterBox");

			// Get the selected tab key
			var sSelectedKey = oEvent.getParameter("selectedKey");
			// if(sSelectedKey==="cus_scenario3"){
			// 	// var oList = sap.ui.core.Fragment.byId("idCustomerMasterDialog", "idCustomerMasterList");
			// 	var oList = this.byId("idCustomerMasterList"); 
			// 	if (oList) {
			// 		oList.setMode("SingleSelect"); // or "SingleSelect"
			// 	}
			// }

			// Define the mapping of keys to text values
			var oTextMapping = {
				"cus_scenario1": "All Customer Outstanding",
				"cus_scenario2": "Top 5 Customer Outstanding",
				"cus_scenario3": "Single Customer Outstanding",
				"cus_scenario4": "Total Outstanding"
			};

			// visible non-visible on customer box
			if (oTextMapping[sSelectedKey] === "Single Customer Outstanding") {
				oCustomerMasterBox.setVisible(true);
			} else {
				oCustomerMasterBox.setVisible(false);
			}

			// Update the global model with the corresponding text
			if (oGlobalDataModel) {
				oGlobalDataModel.setProperty("/selectedTabText2", oTextMapping[sSelectedKey] || "");
			}
		},
		onTabSelect3: function(oEvent) {
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			var oCustomerMasterBox = this.getView().byId("customerMasterBox");

			// Get the selected tab key
			var sSelectedKey = oEvent.getParameter("selectedKey");

			// Define the mapping of keys to text values
			var oTextMapping = {

				"cus_qtrFY_scenario1": "Single Customer Outstanding",
				"cus_qtrFY_scenario2": "Total Outstanding"

			};

			// visible non-visible on customer box
			if (oTextMapping[sSelectedKey] === "Single Customer Outstanding") {
				oCustomerMasterBox.setVisible(true);
			} else {
				oCustomerMasterBox.setVisible(false);
			}

			// Update the global model with the corresponding text
			if (oGlobalDataModel) {
				oGlobalDataModel.setProperty("/selectedTabText3", oTextMapping[sSelectedKey] || "");
			}
		},

		/*************** get the table data from oData service  *****************/

		hasData: function(value) {
			if (Array.isArray(value)) {
				return value.length > 0; // Check if array is not empty
			} else if (typeof value === "string") {
				return value.trim() !== ""; // Check if string is not empty
			} else if (typeof value === "number") {
				return true; // Numbers are always valid
			}
			return false; // Return false for null, undefined, or empty values
		},

		onSearchData: function() {
			var oGlobalData = this.getOwnerComponent().getModel("globalData").getData();

			if (oGlobalData.isCustomerRadio === true) {
				this.getBackendData2(); // Customer Due
			} else if (oGlobalData.isCustomerQtrFyRadio === true) {
				this.getBackendData3(); // Customer Due Qtr/FY
			} else {
				this.getBackendData(); // Initial Fiscal Year / Quater Wise
			}
		},

		getBackendData: function() {
			var oGlobalData = this.getOwnerComponent().getModel("globalData").getData();

			if (!this.validateInputs()) {
				/*sap.m.MessageBox.error("Please fill all required fields.");*/
				return;
			}

			var oSelectedTabText = oGlobalData.selectedTabText;

			if (oSelectedTabText === "All Customer Turnover") {
				this.getAllCustomerData();

			} else if (oSelectedTabText === "Top 10 Customer Turnover") {
				this.getTop10CustomerData();

			} else if (oSelectedTabText === "Single Customer Turnover") {
				this.getSingleCustomerData();

			} else {
				this.getQuarterlyData();

			}

		},

		// _buildFilters: function(oGlobalData, oSelectedIndex) {
		// 	var filters = [];

		// 	var oSelectedTabText = oGlobalData.selectedTabText;
		// 	var aFiscalYears = oGlobalData.fiscalYears || [];
		// 	var aSelectedCustomerMasterData = oGlobalData.selectedCustomerIDs || [];
		// 	var aQuarters = oGlobalData.selectedQuarters || [];
		// 	var aQuarterYears = oGlobalData.selectedQuarterYears || [];
		// 	var aCompanyCode = oGlobalData.selectedCompanyCodeId || [];

		// 	if (oSelectedIndex === 0) {
		// 		if (aFiscalYears.length > 0) {
		// 			filters.push(new Filter({
		// 				filters: aFiscalYears.map(function(year) {
		// 					return new Filter("fiscalYear", FilterOperator.EQ, year);
		// 				}),
		// 				and: false
		// 			}));
		// 		}
		// 		if (aCompanyCode.length > 0) {
		// 			filters.push(new Filter({
		// 				filters: aCompanyCode.map(function(com) {
		// 					return new Filter("bukrs", FilterOperator.EQ, com);
		// 				}),
		// 				and: false
		// 			}));
		// 		}
		// 	} else {
		// 		var quarterFilters = aQuarters.map(function(quarter) {
		// 			return new Filter("fiscalQuater", FilterOperator.EQ, quarter); // double-check spelling
		// 		});
		// 		var quarterYearFilters = aQuarterYears.map(function(year) {
		// 			return new Filter("quater_Year", FilterOperator.EQ, year); // double-check spelling
		// 		});
		// 		var companyCodeFilters = aCompanyCode.map(function(com) {
		// 			return new Filter("bukrs", FilterOperator.EQ, com); // double-check spelling
		// 		});
		// 		if (quarterFilters.length && quarterYearFilters.length && companyCodeFilters.length) {
		// 			filters.push(new Filter({
		// 				filters: [
		// 					new Filter({
		// 						filters: quarterFilters,
		// 						and: false
		// 					}),
		// 					new Filter({
		// 						filters: quarterYearFilters,
		// 						and: false
		// 					}),
		// 					new Filter({
		// 						filters: companyCodeFilters,
		// 						and: false
		// 					})
		// 				],
		// 				and: true
		// 			}));
		// 		}
		// 	}

		// 	// Add customer filter (for both tabs)
		// 	if (oSelectedTabText === "Single Customer Turnover" && aSelectedCustomerMasterData.length > 0) {
		// 		filters.push(new Filter({
		// 			filters: aSelectedCustomerMasterData.map(function(cust) {
		// 				return new Filter("customer", FilterOperator.EQ, cust);
		// 			}),
		// 			and: false
		// 		}));
		// 	}

		// 	return filters;
		// },
		_buildFilters: function(oGlobalData, oSelectedIndex) {
			var filters = [];

			var aFiscalYears = oGlobalData.fiscalYears || [];
			var aCompanyCode = oGlobalData.selectedCompanyCodeId || [];
			var aSelectedCustomerMasterData = oGlobalData.selectedCustomerIDs || [];
			var aQuarters = oGlobalData.selectedQuarters || [];
			var aQuarterYears = oGlobalData.selectedQuarterYears || [];
			var oSelectedTabText = oGlobalData.selectedTabText;

			var subFilters = []; // This will hold ANDed filter groups

			if (oSelectedIndex === 0) {
				// --- Tab 0: Fiscal Year & Company Code ---
				if (aFiscalYears.length > 0) {
					var fiscalFilters = [];
					for (var i = 0; i < aFiscalYears.length; i++) {
						fiscalFilters.push(new sap.ui.model.Filter("fiscalYear", sap.ui.model.FilterOperator.EQ, aFiscalYears[i]));
					}
					subFilters.push(new sap.ui.model.Filter({
						filters: fiscalFilters,
						and: false
					})); // OR within same field
				}

				if (aCompanyCode.length > 0) {
					var companyFilters = [];
					for (var j = 0; j < aCompanyCode.length; j++) {
						companyFilters.push(new sap.ui.model.Filter("bukrs", sap.ui.model.FilterOperator.EQ, aCompanyCode[j]));
					}
					subFilters.push(new sap.ui.model.Filter({
						filters: companyFilters,
						and: false
					}));
				}

			} else {
				// --- Tab 1: Quarters, Quarter Years & Company Code ---
				var quarterFilters = [];
				for (var k = 0; k < aQuarters.length; k++) {
					quarterFilters.push(new sap.ui.model.Filter("fiscalQuater", sap.ui.model.FilterOperator.EQ, aQuarters[k]));
				}

				var quarterYearFilters = [];
				for (var l = 0; l < aQuarterYears.length; l++) {
					quarterYearFilters.push(new sap.ui.model.Filter("quater_Year", sap.ui.model.FilterOperator.EQ, aQuarterYears[l]));
				}

				var companyCodeFilters = [];
				for (var m = 0; m < aCompanyCode.length; m++) {
					companyCodeFilters.push(new sap.ui.model.Filter("bukrs", sap.ui.model.FilterOperator.EQ, aCompanyCode[m]));
				}

				if (quarterFilters.length > 0) {
					subFilters.push(new sap.ui.model.Filter({
						filters: quarterFilters,
						and: false
					}));
				}
				if (quarterYearFilters.length > 0) {
					subFilters.push(new sap.ui.model.Filter({
						filters: quarterYearFilters,
						and: false
					}));
				}
				if (companyCodeFilters.length > 0) {
					subFilters.push(new sap.ui.model.Filter({
						filters: companyCodeFilters,
						and: false
					}));
				}
			}

			// --- Customer filter (AND with other fields, not OR) ---
			if (oSelectedTabText === "Single Customer Turnover" && aSelectedCustomerMasterData.length > 0) {
				var customerFilters = [];
				for (var n = 0; n < aSelectedCustomerMasterData.length; n++) {
					customerFilters.push(new sap.ui.model.Filter("customer", sap.ui.model.FilterOperator.EQ, aSelectedCustomerMasterData[n]));
				}
				subFilters.push(new sap.ui.model.Filter({
					filters: customerFilters,
					and: false
				}));
			}

			// Combine all field filters together using AND
			if (subFilters.length > 0) {
				filters.push(new sap.ui.model.Filter({
					filters: subFilters,
					and: true
				}));
			}

			return filters;
		},

		sortCustomFiscal_QuarterYear_Quarter: function(aData) {
			var quarterOrder = {
				"Q1": 1,
				"Q2": 2,
				"Q3": 3,
				"Q4": 4
			};

			return aData.sort(function(a, b) {
				// -----------------------------
				// Case 1: Sort by fiscalYear
				// -----------------------------
				if (a.fiscalYear && b.fiscalYear) {
					var yearA = parseInt(a.fiscalYear, 10);
					var yearB = parseInt(b.fiscalYear, 10);

					if (yearA !== yearB) {
						return yearA - yearB; // ascending by fiscal year
					}
				}

				// -----------------------------
				// Case 2: Sort by quaterYear + quater
				// -----------------------------
				if (a.quaterYear && b.quaterYear) {
					var yearA = parseInt(a.quaterYear, 10);
					var yearB = parseInt(b.quaterYear, 10);

					if (yearA !== yearB) {
						return yearA - yearB; // ascending by quarter year
					}

					// Handle quarter values (Q1/Q2/Q3/Q4)
					var qA = a.quater && a.quater.startsWith("Q") ? quarterOrder[a.quater] : parseInt(a.quater, 10) || 0;

					var qB = b.quater && b.quater.startsWith("Q") ? quarterOrder[b.quater] : parseInt(b.quater, 10) || 0;

					if (qA !== qB) {
						return qA - qB; // ascending by quarter
					}
				}

				// -----------------------------
				// Fallback: keep order unchanged
				// -----------------------------
				return 0;
			});
		},

		getAllCustomerData: function() {
			var that = this;

			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oAllCustomerModel = oComponent.getModel("allCustomerModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var oAllCustListDataModel = oComponent.getModel("allCustlistData");
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			// reusable filter function 
			var filters = this._buildFilters(oGlobalData, oSelectedIndex);

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oAllCustomerModel.read("/CUSTSet", {
				filters: filters,
				success: function(response) {
					// sorting the oData
					// var oData = that.sortByTurnOverDesc(response.results || []);
					var oData = that.sortCustomFiscal_QuarterYear_Quarter(response.results || []);
					console.log("Sorted Data:", oData);

					// format customer data function
					that.formatCustomerData(oData);

					// Update models based on selection
					var isSelectedIndex = oSelectedIndex === 0;
					var sPropertyPath = isSelectedIndex ? "/allCustlistDataFiscalYearWise" : "/allCustlistDataQuaterlyWise";
					var sFragmentId = isSelectedIndex ? "chartFragment1" : "chartFragment2";

					oAllCustListDataModel.setProperty(sPropertyPath, oData);

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isChartFragment1Visible", isSelectedIndex);
					oGlobalDataModel.setProperty("/isChartFragment2Visible", !isSelectedIndex);

					// Bind chart
					isSelectedIndex ? that.bindChartColorRulesByFiscalYearWise(sFragmentId, oData) : that.bindChartColorRulesByQuarterlyWise(
						sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},
		getTop10CustomerData: function() {
			var that = this;

			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oTop10CustomerModel = oComponent.getModel("top10CustomerModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var oTop10CustListDataModel = oComponent.getModel("top10listData");
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			// reusable filter function 
			var filters = this._buildFilters(oGlobalData, oSelectedIndex);

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oTop10CustomerModel.read("/CUSTSet", {
				filters: filters,
				success: function(response) {
					// sorting the oData
					// var oData = that.sortByTurnOverDesc(response.results || []);
					var oData = that.sortCustomFiscal_QuarterYear_Quarter(response.results || []);
					console.log("Sorted Data:", oData);

					// format customer data function
					that.formatCustomerData(oData);

					// Update models based on selection
					var isSelectedIndex = oSelectedIndex === 0;
					var sPropertyPath = isSelectedIndex ? "/top10CustlistDataFiscalYearWise" : "/top10CustlistDataQuaterlyWise";
					var sFragmentId = isSelectedIndex ? "chartFragment3" : "chartFragment4";

					oTop10CustListDataModel.setProperty(sPropertyPath, oData);

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isChartFragment3Visible", isSelectedIndex);
					oGlobalDataModel.setProperty("/isChartFragment4Visible", !isSelectedIndex);

					// Bind chart
					isSelectedIndex ? that.bindChartColorRulesByFiscalYearWise(sFragmentId, oData) : that.bindChartColorRulesByQuarterlyWise(
						sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},
		getSingleCustomerData: function() {
			var that = this;

			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oSingleCustomerModel = oComponent.getModel("singleCustomerModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var oSingleCustListDataModel = oComponent.getModel("singleCustlistData");
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			// reusable filter function 
			var filters = this._buildFilters(oGlobalData, oSelectedIndex);

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oSingleCustomerModel.read("/CUSTSet", {
				filters: filters,
				success: function(response) {
					// sorting the oData
					// var oData = that.sortByTurnOverDesc(response.results || []);
					var oData = that.sortCustomFiscal_QuarterYear_Quarter(response.results || []);
					console.log("Sorted Data:", oData);

					// format customer data function
					that.formatCustomerData(oData);

					// Update models based on selection
					var isSelectedIndex = oSelectedIndex === 0;
					var sPropertyPath = isSelectedIndex ? "/singleCustlistDataFiscalYearWise" : "/singleCustlistDataQuaterlyWise";
					var sFragmentId = isSelectedIndex ? "chartFragment5" : "chartFragment6";

					oSingleCustListDataModel.setProperty(sPropertyPath, oData);

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isChartFragment5Visible", isSelectedIndex);
					oGlobalDataModel.setProperty("/isChartFragment6Visible", !isSelectedIndex);

					// Bind chart
					isSelectedIndex ? that.bindChartColorRulesByFiscalYearWise(sFragmentId, oData) : that.bindChartColorRulesByQuarterlyWise(
						sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},
		getQuarterlyData: function() {
			var that = this;

			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oQuarterlyTurnoverModel = oComponent.getModel("quarterlyTurnoverModel");
			// var oQuarterlyTurnoverModel = oComponent.getModel("allCustomerModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var oQuarterlyTurnoverlistDataModel = oComponent.getModel("quarterlyTurnoverlistData");
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			// reusable filter function 
			var filters = this._buildFilters(oGlobalData, oSelectedIndex);

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oQuarterlyTurnoverModel.read("/CUSTSet", {
				filters: filters,
				success: function(response) {
					// sorting the oData
					// var oData = that.sortByTurnOverDesc(response.results || []);
					var oData = that.sortCustomFiscal_QuarterYear_Quarter(response.results || []);
					console.log("Sorted Data:", oData);

					// format customer data function
					that.formatCustomerData(oData);

					// Update models based on selection
					var isSelectedIndex = oSelectedIndex === 0;
					var sPropertyPath = isSelectedIndex ? "/quarterlyTurnoverlistDataFiscalYearWise" :
						"/quarterlyTurnoverlistDataQuaterlyWise";
					var sFragmentId = isSelectedIndex ? "chartFragment7" : "chartFragment8";

					oQuarterlyTurnoverlistDataModel.setProperty(sPropertyPath, oData);

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isChartFragment7Visible", isSelectedIndex);
					oGlobalDataModel.setProperty("/isChartFragment8Visible", !isSelectedIndex);

					// Bind chart
					isSelectedIndex ? that.bindChartColorRulesByFiscalYearWise(sFragmentId, oData) : that.bindChartColorRulesByQuarterlyWise(
						sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},

		formatDateToYYYYMMDD: function(oDate) {
			if (oDate) {
				var yyyy = oDate.getFullYear().toString();
				var mm = (oDate.getMonth() + 1).toString().padStart(2, '0');
				var dd = oDate.getDate().toString().padStart(2, '0');
				return yyyy + mm + dd; // e.g. "20250824"
			}
			return "";
		},

		/*************** helper function  *****************/
		sortByTurnOverDesc: function(aData) {
			return aData.sort(function(a, b) {
				return parseFloat(b.turnOver) - parseFloat(a.turnOver);
			});
		},
		formatCustomerData: function(oData) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oSelectedTabText = oGlobalModel.getProperty("/selectedTabText");
			oData.forEach(item => {
				this.convertTurnoverToCrore(item);
				if (oSelectedTabText !== "Turnover") {
					this.generateCustomerNameShort(item);
				}

			});
			return oData;
		},
		convertTurnoverToCrore: function(item) {
			if (item.turnOver) {
				item.turnOver = (parseFloat(item.turnOver) / 10000000).toFixed(2);
			}
		},
		generateCustomerNameShort: function(item) {
			const words = item.customerName.split(" ");
			const abbreviation = words
				.filter(w => w.length > 2 && w[0] === w[0].toUpperCase())
				.map(w => w[0])
				.join("")
				.toUpperCase();

			item.CustomerNameShort = abbreviation || item.customerName;
		},

		/*************** Clear data from all input fields,radio button & model make it default  *****************/

		clearListData: function() {
			const that = this;
			const oView = that.getView();

			sap.m.MessageBox.confirm("Are you sure you want to clear all data?", {
				onClose: function(oAction) {
					var oGlobalDataModel = that.getOwnerComponent().getModel("globalData");
					if (oAction === sap.m.MessageBox.Action.OK) {

						// Clear input fields
						const aInputIds = [
							"_customerInputId",
							"_financialYearInputId",
							"_quarterInputId",
							"_quarterInputYearId",
							"DatePickerId",
							"_companyCodeId"
						];
						aInputIds.forEach((sId) => {
							const oInput = that.byId(sId);
							if (oInput) oInput.setValue("");
						});

						// Clear the values bound to the input fields
						oGlobalDataModel.setProperty("/selectedCustomerNamesDisplay", "");
						oGlobalDataModel.setProperty("/selectedCustomerNames", "");
						oGlobalDataModel.setProperty("/selectedCustomerIDs", "");

						oGlobalDataModel.setProperty("/selectedCompanyIdDisplay", "");
						oGlobalDataModel.setProperty("/selectedCompanyCodeId", "");
						oGlobalDataModel.setProperty("/fiscalYears", "");
						oGlobalDataModel.setProperty("/selectedQuarters", "");
						oGlobalDataModel.setProperty("/selectedQuarterYears", "");

						// Reset RadioButtonGroup to default
						const oRadioGroup = that.byId("radioBtnlist");
						if (oRadioGroup) {
							oRadioGroup.setSelectedIndex(0); // 0 = Fiscal Year Wise
							that.onRadioButtonSelectList({
								getSource: () => oRadioGroup
							});
						}

						// Reset IconTabBar to default tab
						const oIconTabBar = oView.byId("iconTabBar");
						if (oIconTabBar) {
							oIconTabBar.setSelectedKey("scenario1");
							that.onTabSelect({
								getParameter: () => "scenario1"
							});
						}

						// Reset global data
						that._updateGlobalDataModel();

						// Define model reset map
						const oModelResetMap = {
							allCustlistData: [
								"/allCustlistDataFiscalYearWise",
								"/allCustlistDataQuaterlyWise"
							],
							top10listData: [
								"/top10CustlistDataFiscalYearWise",
								"/top10CustlistDataQuaterlyWise"
							],
							singleCustlistData: [
								"/singleCustlistDataFiscalYearWise",
								"/singleCustlistDataQuaterlyWise"
							],
							quarterlyTurnoverlistData: [
								"/quarterlyTurnoverlistDataFiscalYearWise",
								"/quarterlyTurnoverlistDataQuaterlyWise"
							]
						};

						// Reset data in each model
						Object.keys(oModelResetMap).forEach((sModelName) => {
							const oModel = that.getOwnerComponent().getModel(sModelName);
							if (oModel) {
								oModelResetMap[sModelName].forEach((sPath) => {
									oModel.setProperty(sPath, []);
								});
							}
						});

						// List of model names to clear
						var aModels = [
							"newAllCustomerOutstanding",
							"newTop5Outstanding",
							"newSingleCustomerOutstanding",
							"newTotalOutstanding",
							"newSingleCustomerOutstandingQtrFY",
							"new_Total_Outstanding_QtrFY"
						];

						aModels.forEach(function(sModelName) {
							var oModel = oView.getModel(sModelName);
							if (oModel) {
								oModel.setData([]); // or {} if structure is object
								oModel.refresh(true);
							}
						});
					}
				}
			});
		},

		/*************** chart function & plotting the chart data  *****************/

		generateColorMapByFiscalYearWise: function(data, selectedTabText) {
			const colorMap = {};
			let uniqueKeys = [];

			// Choose key format based on selected tab
			if (selectedTabText === "Turnover") {
				uniqueKeys = [...new Set(data.map(item => item.fiscalYear))];
			} else {
				uniqueKeys = [...new Set(data.map(item => `${item.customerName} (${item.fiscalYear})`))];
			}

			// Generate HSL colors based on index
			uniqueKeys.forEach((key, i) => {
				const color = `hsl(${(i * 43) % 360}, 70%, 50%)`;
				colorMap[key] = color;
			});

			return {
				colorMap
			};
		},
		bindChartColorRulesByFiscalYearWise: function(sFragmentId, oData) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oSelectedTabText = oGlobalModel.getProperty("/selectedTabText");
			var oVizFrame = sap.ui.core.Fragment.byId(this.createId(sFragmentId), "idVizFrame");

			if (!oVizFrame) {
				console.warn("VizFrame not found for Fragment ID:", sFragmentId);
				return;
			}

			var {
				colorMap
			} = this.generateColorMapByFiscalYearWise(oData, oSelectedTabText);

			var rules = [];

			if (oSelectedTabText === "Turnover") {
				rules = oData.map(item => ({
					dataContext: {
						"Fiscal Year": item.fiscalYear
					},
					properties: {
						color: colorMap[item.fiscalYear]
					}
				}));
			} else {
				rules = oData.map(item => {
					const customerYear = `${item.customerName} (${item.fiscalYear})`;
					return {
						dataContext: {
							"Customer Name": item.customerName,
							"Fiscal Year": item.fiscalYear
						},
						properties: {
							color: colorMap[customerYear]
						}
					};
				});
			}

			oVizFrame.setVizProperties({
				title: {
					visible: true,
					text: "Fiscal Year Wise Turnover"
				},
				plotArea: {
					dataPointStyle: {
						rules
					},
					dataLabel: {
						visible: true
					},
					drawingEffect: "glossy"
				},
				tooltip: {
					visible: true
				},
				interaction: {
					selectability: {
						mode: "multiple"
					}
				},
				categoryAxis: {
					label: {
						visible: true,
						allowMultiline: true,
						linesOfWrap: 4,
						overlapBehavior: "wrap",
						rotation: 0,
						angle: 0,
						maxWidth: 200,
						truncatedLabelRatio: 0.9,
						style: {
							fontSize: "10px"
						}
					}
				},
				valueAxis: {
					label: {
						visible: true
					}
				}
			});

			// Use bind to pass sFragmentId and call _onChartSelect
			oVizFrame.attachSelectData(this._onChartSelectFiscalYearWise.bind(this, sFragmentId));
		},
		_onChartSelectFiscalYearWise: function(sFragmentId, oEvent) {
			var oVizFrame = oEvent.getSource();
			var oPopover = sap.ui.core.Fragment.byId(this.createId(sFragmentId), "idPopOverFiscalYearWise");

			if (!oPopover) {
				console.warn("Popover not found for Fragment ID:", sFragmentId)
				return;
			}

			// Get selected data from the event (it will be in the 'data' parameter of the event)
			var aSelectedData = oEvent.getParameter("data");

			if (!aSelectedData || aSelectedData.length === 0) {
				console.warn("No data selected");
				return;
			}

			// We assume single selection and access the first item in the selected data array
			var oSelectedItem = aSelectedData[0];

			// Directly get the data from the selected item
			var oDataContext = oSelectedItem.data; // Directly access the data (it may not need 'data.data')

			// Assuming you are accessing Supplier Name, Fiscal Year, and Turnover
			var sCustomer = oDataContext["Customer Name"];
			var sFiscalYear = oDataContext["Fiscal Year"];
			var sTurnover = oDataContext["Turn Over (Cr)"]; // Adjust the field name as necessary

			// Create a JSON model to hold the data for the Popover
			var oPopoverModel = new sap.ui.model.json.JSONModel({
				customer: sCustomer,
				fiscalYear: sFiscalYear,
				turnover: sTurnover
			});

			// Set the model on the Popover
			oPopover.setModel(oPopoverModel);

			// Connect the Popover to the VizFrame
			oPopover.connect(oVizFrame.getVizUid());
		},

		generateColorMapByQuarterlyWise: function(data, selectedTabText) {
			var colorMap = {};
			var uniqueKeys = [];

			if (selectedTabText === "Turnover") {
				uniqueKeys = [...new Set(data.map(item => `(${item.quater} ${item.quaterYear})`))];
			} else {
				uniqueKeys = [...new Set(data.map(item => `${item.customerName} (${item.quater} ${item.quaterYear})`))];
			}

			uniqueKeys.forEach(function(key, i) {
				var color = `hsl(${(i * 37) % 360}, 65%, 55%)`;
				colorMap[key] = color;
			});

			return {
				colorMap: colorMap
			};
		},
		bindChartColorRulesByQuarterlyWise: function(sFragmentId, oData) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oSelectedTabText = oGlobalModel.getProperty("/selectedTabText");
			var oVizFrame = sap.ui.core.Fragment.byId(this.createId(sFragmentId), "idVizFrame");

			if (!oVizFrame) {
				console.warn("VizFrame not found for Fragment ID:", sFragmentId);
				return;
			}

			var result = this.generateColorMapByQuarterlyWise(oData, oSelectedTabText);
			var colorMap = result.colorMap;
			var rules = [];

			if (oSelectedTabText === "Turnover") {
				rules = oData.map(function(item) {
					var key = `(${item.quater} ${item.quaterYear})`;
					return {
						dataContext: {
							"Quarter": item.quater,
							"Quarter Year": item.quaterYear
						},
						properties: {
							color: colorMap[key]
						}
					};
				});
			} else {
				rules = oData.map(function(item) {
					var key = `${item.customerName} (${item.quater} ${item.quaterYear})`;
					return {
						dataContext: {
							"Customer Name": item.customerName,
							"Quarter": item.quater,
							"Quarter Year": item.quaterYear
						},
						properties: {
							color: colorMap[key]
						}
					};
				});
			}

			oVizFrame.setVizProperties({
				title: {
					visible: true,
					text: "Quaterly Wise Turnover"
				},
				plotArea: {
					dataPointStyle: {
						rules: rules
					},
					dataLabel: {
						visible: true
					},
					drawingEffect: "glossy"
				},
				tooltip: {
					visible: true
				},
				interaction: {
					selectability: {
						mode: "multiple"
					}
				},
				categoryAxis: {
					label: {
						visible: true,
						allowMultiline: true,
						linesOfWrap: 4,
						overlapBehavior: "wrap",
						rotation: 0,
						angle: 0,
						maxWidth: 200,
						truncatedLabelRatio: 0.9,
						style: {
							fontSize: "10px"
						}
					}
				},
				valueAxis: {
					label: {
						visible: true
					}
				}
			});

			// Use bind to pass sFragmentId and call _onChartSelect
			oVizFrame.attachSelectData(this._onChartSelectQuarterlyWise.bind(this, sFragmentId));

		},
		_onChartSelectQuarterlyWise: function(sFragmentId, oEvent) {
			var oVizFrame = oEvent.getSource();
			var oPopover = sap.ui.core.Fragment.byId(this.createId(sFragmentId), "idPopOverQuaterlyWise");

			if (!oPopover) {
				console.warn("Popover not found for Fragment ID:", sFragmentId);
				return;
			}

			// Get selected data from the event (it will be in the 'data' parameter of the event)
			var aSelectedData = oEvent.getParameter("data");

			if (!aSelectedData || aSelectedData.length === 0) {
				console.warn("No data selected");
				return;
			}

			// We assume single selection and access the first item in the selected data array
			var oSelectedItem = aSelectedData[0];

			// Directly get the data from the selected item
			var oDataContext = oSelectedItem.data; // Directly access the data (it may not need 'data.data')

			// Assuming you are accessing Supplier Name, Quarter, Quarter Year, and Turnover
			var sCustomer = oDataContext["Customer Name"];
			var sQuarter = oDataContext["Quarter"];
			var sQuarterYear = oDataContext["Quarter Year"];
			var sTurnover = oDataContext["Turn Over (Cr)"]; // Adjust the field name as necessary

			// Create a JSON model to hold the data for the Popover
			var oPopoverModel = new sap.ui.model.json.JSONModel({
				customer: sCustomer,
				quarter: sQuarter,
				quarterYear: sQuarterYear,
				turnover: sTurnover
			});

			// Set the model on the Popover
			oPopover.setModel(oPopoverModel);

			// Connect the Popover to the VizFrame
			oPopover.connect(oVizFrame.getVizUid());
		},

		/*************** Customer Due & Customer Due QTR/FY Scenario Functions  *****************/

		// Validation & Get Function Call For Customer Due

		validateInputs2: function() {

			var oComponent = this.getOwnerComponent();
			var oGlobalData = oComponent.getModel("globalData").getData();
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();
			var oSelectedTabText = oGlobalData.selectedTabText2;

			var inputDate = this.byId("DatePickerId");
			var inputCompanyCode = this.byId("_companyCodeId");
			var inputCustomer = this.byId("_customerInputId");

			var isValid = true;
			var message = '';

			if (!inputCompanyCode.getValue()) {
				inputCompanyCode.setValueState(sap.ui.core.ValueState.Error);
				isValid = false;
				message += 'Company Code , ';
			} else {
				inputCompanyCode.setValueState(sap.ui.core.ValueState.None);
			}

			if (oSelectedTabText === "Single Customer Outstanding") {
				if (!inputCustomer.getValue()) {
					inputCustomer.setValueState(sap.ui.core.ValueState.Error);
					isValid = false;
					message += 'Customer , ';
				} else {
					inputCustomer.setValueState(sap.ui.core.ValueState.None);
				}
			}

			if (!inputDate.getValue()) {
				inputDate.setValueState(sap.ui.core.ValueState.Error);
				isValid = false;
				message += 'Date , ';
			} else {
				inputDate.setValueState(sap.ui.core.ValueState.None);
			}

			if (!isValid) {
				// Remove the last comma and space from the message
				message = message.slice(0, -2);
				// sap.m.MessageBox.error("Please fill up the following field: " + message);
				sap.m.MessageBox.error("Please fill the following field:\n\n" + message);
				return false;
			}

			return true;

		},
		getBackendData2: function() {
			if (!this.validateInputs2()) {
				/*sap.m.MessageBox.error("Please fill all required fields.");*/
				return;
			}
			var that = this;
			var oGlobalData = this.getOwnerComponent().getModel("globalData").getData();

			var oSelectedTabText = oGlobalData.selectedTabText2;

			if (oSelectedTabText === "All Customer Outstanding") {
				this.getAllCustomerOutstandingData();
			} else if (oSelectedTabText === "Top 5 Customer Outstanding") {
				this.getTop5OutstandingData();
			} else if (oSelectedTabText === "Single Customer Outstanding") {
				this.getSingleCustomerOutstandingData();
			} else if (oSelectedTabText === "Total Outstanding") {
				this.getTotalOutstandingData();
			}
		},

		// Validation & Get Function Call For Customer Due Qtr/FY

		validateInputs3: function() {

			var oComponent = this.getOwnerComponent();
			var oGlobalData = oComponent.getModel("globalData").getData();
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();
			var oSelectedTabText3 = oGlobalData.selectedTabText3; // For Customer Due Qtr/FY
			var oView = this.getView();

			// Map input IDs to friendly field names
			var mFieldNames = {
				"_companyCodeId": "Company Code",
				"_customerInputId": "Customer",
				"_financialYearInputId": "Fiscal Year",
				"_quarterInputId": "Quarter",
				"_quarterInputYearId": "Quarter Year"
			};

			var getInputIdsToValidate = function() {

				if (oSelectedIndex === 3) {
					var isSingleCustomer = oSelectedTabText3 === "Single Customer Outstanding";

					if (isSingleCustomer) {
						return ["_companyCodeId", "_customerInputId", "_quarterInputYearId"];
					} else {
						return ["_companyCodeId", "_quarterInputYearId"];
					}
				}
			};

			var bAllValid = true;
			var aEmptyFields = [];
			var aInputIds = getInputIdsToValidate();

			aInputIds.forEach(function(sId) {
				var oInput = oView.byId(sId);
				if (oInput && oInput.getVisible()) {
					var sValue = oInput.getValue();
					var sTrimmedValue = sValue ? sValue.trim() : "";

					if (!sTrimmedValue) {
						oInput.setValueState("Error");
						oInput.setValueStateText("This field cannot be empty.");
						bAllValid = false;

						var sFieldName = mFieldNames[sId] || sId;
						aEmptyFields.push(sFieldName);
					} else {
						oInput.setValueState("None");
					}
				}
			});

			if (aEmptyFields.length > 0) {
				sap.m.MessageBox.error("Please fill the following fields:\n\n" + aEmptyFields.join("\n"));
			}

			return bAllValid;
		},
		// _buildFiltersForCustomerQtrFY: function(oGlobalData, oSelectedIndex) {
		// 	var filters = [];

		// 	var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");

		// 	var oSelectedTabText = oGlobalData.selectedTabText;
		// 	var oSelectedTabText3 = oGlobalData.selectedTabText3;

		// 	var aFiscalYears = oGlobalData.fiscalYears || [];
		// 	var aSelectedCustomerMasterData = oGlobalData.selectedCustomerIDs || [];
		// 	var aQuarters = oGlobalData.selectedQuarters || [];
		// 	var aQuarterYears = oGlobalData.selectedQuarterYears || [];
		// 	var aCompanyCode = oGlobalData.selectedCompanyCodeId || [];

		// 	if (oSelectedIndex === 3) { // // For Customer Due QTR/FY
		// 		// var quarterFilters = aQuarters.map(function(quarter) {
		// 		// 	return new Filter("poper", FilterOperator.EQ, quarter); // double-check spelling
		// 		// });

		// 		// ✅ If no quarter selected, default to '' filter
		// 		// var quarterFilters = (aQuarters.length > 0) ? 
		// 		//     aQuarters.map(function(quarter) {
		// 		//         return new Filter("poper", FilterOperator.EQ, quarter);
		// 		//     }) :	[new Filter("poper", FilterOperator.EQ, "")] 

		// 		var quarterFilters;

		// 		if (aQuarters.length > 0) {
		// 			// Set flag because quarters are selected
		// 			oGlobalDataModel.setProperty("/isQuarterSelected", true);

		// 			quarterFilters = aQuarters.map(function(quarter) {
		// 				return new Filter("poper", FilterOperator.EQ, quarter);
		// 			});
		// 		} else {
		// 			// No quarters selected → reset flag
		// 			oGlobalDataModel.setProperty("/isQuarterSelected", false);

		// 			quarterFilters = [new Filter("poper", FilterOperator.EQ, "")];
		// 		}

		// 		var quarterYearFilters = aQuarterYears.map(function(year) {
		// 			return new Filter("gjahr", FilterOperator.EQ, year); // double-check spelling
		// 		});

		// 		var companyCodeFilters = aCompanyCode.map(function(com) {
		// 			return new Filter("bukrs", FilterOperator.EQ, com); // double-check spelling
		// 		});

		// 		if (quarterFilters.length || quarterYearFilters.length || companyCodeFilters.length) {
		// 			filters.push(new Filter({
		// 				filters: [
		// 					new Filter({
		// 						filters: quarterFilters,
		// 						and: false
		// 					}),
		// 					new Filter({
		// 						filters: quarterYearFilters,
		// 						and: false
		// 					}),
		// 					new Filter({
		// 						filters: companyCodeFilters,
		// 						and: false
		// 					})
		// 				],
		// 				and: true
		// 			}));
		// 		}

		// 	}

		// 	// For Customer Due QTR/FY
		// 	if ((oSelectedTabText3 === "Single Customer Outstanding") && aSelectedCustomerMasterData.length > 0) {
		// 		filters.push(new Filter({
		// 			filters: aSelectedCustomerMasterData.map(function(cust) {
		// 				return new Filter("kunnr", FilterOperator.EQ, cust);
		// 			}),
		// 			and: false
		// 		}));
		// 	}

		// 	return filters;
		// },
		_buildFiltersForCustomerQtrFY: function(oGlobalData, oSelectedIndex) {
			var filters = [];

			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");

			var oSelectedTabText = oGlobalData.selectedTabText;
			var oSelectedTabText3 = oGlobalData.selectedTabText3;

			var aFiscalYears = oGlobalData.fiscalYears || [];
			var aSelectedCustomerMasterData = oGlobalData.selectedCustomerIDs || [];
			var aQuarters = oGlobalData.selectedQuarters || [];
			var aQuarterYears = oGlobalData.selectedQuarterYears || [];
			var aCompanyCode = oGlobalData.selectedCompanyCodeId || [];

			if (oSelectedIndex === 3) { // For Customer Due QTR/FY

				var quarterFilters;

				if (aQuarters.length > 0) {
					oGlobalDataModel.setProperty("/isQuarterSelected", true);

					quarterFilters = aQuarters.map(function(quarter) {
						return new sap.ui.model.Filter("poper", sap.ui.model.FilterOperator.EQ, quarter);
					});
				} else {
					oGlobalDataModel.setProperty("/isQuarterSelected", false);
					quarterFilters = [new sap.ui.model.Filter("poper", sap.ui.model.FilterOperator.EQ, "")];
				}

				var quarterYearFilters = aQuarterYears.map(function(year) {
					return new sap.ui.model.Filter("gjahr", sap.ui.model.FilterOperator.EQ, year);
				});

				var companyCodeFilters = aCompanyCode.map(function(com) {
					return new sap.ui.model.Filter("bukrs", sap.ui.model.FilterOperator.EQ, com);
				});

				if (quarterFilters.length || quarterYearFilters.length || companyCodeFilters.length) {
					var mainFilter = new sap.ui.model.Filter({
						filters: [
							new sap.ui.model.Filter({
								filters: quarterFilters,
								and: false
							}),
							new sap.ui.model.Filter({
								filters: quarterYearFilters,
								and: false
							}),
							new sap.ui.model.Filter({
								filters: companyCodeFilters,
								and: false
							})
						],
						and: true
					});

					// Add main filter group
					filters.push(mainFilter);
				}
			}

			// ✅ Add customer filter with AND logic (not OR)
			if ((oSelectedTabText3 === "Single Customer Outstanding") && aSelectedCustomerMasterData.length > 0) {
				var customerFilter = new sap.ui.model.Filter({
					filters: aSelectedCustomerMasterData.map(function(cust) {
						return new sap.ui.model.Filter("kunnr", sap.ui.model.FilterOperator.EQ, cust);
					}),
					and: false
				});

				if (filters.length > 0) {
					// Combine main filters AND customer filters
					filters = [new sap.ui.model.Filter({
						filters: [
							new sap.ui.model.Filter({
								filters: filters,
								and: true
							}),
							customerFilter
						],
						and: true // ✅ ensures AND between group and customer
					})];
				} else {
					filters.push(customerFilter);
				}
			}

			return filters;
		},

		getBackendData3: function() {
			if (!this.validateInputs3()) {
				/*sap.m.MessageBox.error("Please fill all required fields.");*/
				return;
			}
			var that = this;
			var oGlobalData = this.getOwnerComponent().getModel("globalData").getData();

			var oSelectedTabText = oGlobalData.selectedTabText3;

			if (oSelectedTabText === "Single Customer Outstanding") {
				this.getSingleCustomerData_CustomeDueQtrFY();

			} else if (oSelectedTabText === "Total Outstanding") {
				this.getTotalOutstandingData_CustomeDueQtrFY();
			}
		},

		convertAmountToCrore: function(oData) {
			if (Array.isArray(oData)) {
				oData.forEach(item => {
					if (item.amount) {
						// Divide by 1 crore = 10,000,000
						item.amount = (parseFloat(item.amount) / 10000000).toFixed(2);
					}
				});
			}
			return oData; // return updated array
		},
		sortByAmountDesc: function(aData) {
			return (aData || []).sort(function(a, b) {
				return parseFloat(b.amount || 0) - parseFloat(a.amount || 0);
			});
		},
		sortByQuarterAndYear: function(aData) {
			// Quarter order mapping
			var quarterOrder = {
				"Q1": 1,
				"Q2": 2,
				"Q3": 3,
				"Q4": 4
			};

			return aData.sort(function(a, b) {
				// Convert gjahr to number (safety)
				var yearA = parseInt(a.gjahr, 10);
				var yearB = parseInt(b.gjahr, 10);

				if (yearA !== yearB) {
					return yearA - yearB; // ascending year
				}

				// Handle quarter values like "Q1"/"1"
				var qA = a.poper.startsWith("Q") ? quarterOrder[a.poper] : parseInt(a.poper, 10);
				var qB = b.poper.startsWith("Q") ? quarterOrder[b.poper] : parseInt(b.poper, 10);

				return qA - qB; // ascending quarter
			});
		},

		// Get Backend Data For Customer Due
		getAllCustomerOutstandingData: function() {
			var that = this;

			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oNewChnageModel = oComponent.getModel("quarterlyTurnoverModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			// var oAllCustomerOutstanding = oComponent.getModel("newAllCustomerOutstanding");
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			var oDate = this.byId("DatePickerId").getDateValue();
			var sDate = this.formatDateToYYYYMMDD(oDate);

			var aSelectedCompanyCode = oGlobalData.selectedCompanyCodeId || [];
			var sBukrs = aSelectedCompanyCode[0];

			var filters = [];
			filters.push(new sap.ui.model.Filter("datum", sap.ui.model.FilterOperator.EQ, sDate));
			filters.push(new sap.ui.model.Filter("bukrs", sap.ui.model.FilterOperator.EQ, sBukrs));

			// reusable filter function 
			// var filters = this._buildFilters(oGlobalData, oSelectedIndex);

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oNewChnageModel.read("/es_outstandingset", {
				filters: filters,
				success: function(response) {

					// sorting the oData
					// var oData = that.sortByTurnOverDesc(response.results || []);
					// console.log("Sorted Data:", oData);

					// format customer data function
					// that.formatCustomerData(oData);

					// Update models based on selection
					// var isSelectedIndex = oSelectedIndex === 0;
					// var sPropertyPath = isSelectedIndex ? "/allCustlistDataFiscalYearWise" : "/allCustlistDataQuaterlyWise";
					// var sFragmentId = isSelectedIndex ? "chartFragment1" : "chartFragment2";

					// oAllCustListDataModel.setProperty(sPropertyPath, oData);

					// // Toggle visibility of chart fragments
					// oGlobalDataModel.setProperty("/isNewChartFragment1Visible", true);
					// oGlobalDataModel.setProperty("/isChartFragment2Visible", !isSelectedIndex);

					// Bind chart
					// isSelectedIndex ? that.bindChartColorRulesByFiscalYearWise(sFragmentId, oData) : that.bindChartColorRulesByQuarterlyWise(
					// 	sFragmentId, oData);

					var aData = response.results;
					console.log("Unconverted Amount Data:", aData);

					var oData = aData.map(item => {
						return {
							...item,
							customerKey: item.name1 + " (" + item.kunnr + ")"
						};
					});

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isNewChartFragment1Visible", true);

					// Convert Amount in Crore
					that.convertAmountToCrore(oData);

					// 🔹 Sort descending by amount using helper
					oData = that.sortByAmountDesc(oData);
					console.log("Converted & Sorted Data: ", oData);

					var sFragmentId = "newChartFragment1";

					var oAllCustomerOutstanding = that.getView().getModel("newAllCustomerOutstanding");
					oAllCustomerOutstanding.setData(oData);

					that.bindChartColorRulesByOutstanding(sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},
		getTop5OutstandingData: function() {
			var that = this;
			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oNewChnageModel = oComponent.getModel("quarterlyTurnoverModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			var oDate = this.byId("DatePickerId").getDateValue();
			var sDate = this.formatDateToYYYYMMDD(oDate);

			var aSelectedCompanyCode = oGlobalData.selectedCompanyCodeId || [];
			var sBukrs = aSelectedCompanyCode[0];

			var filters = [];
			filters.push(new sap.ui.model.Filter("datum", sap.ui.model.FilterOperator.EQ, sDate));
			filters.push(new sap.ui.model.Filter("bukrs", sap.ui.model.FilterOperator.EQ, sBukrs));

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oNewChnageModel.read("/es_outstandingset", {
				filters: filters,
				urlParameters: {
					"$top": 5
				},
				success: function(response) {
					var aData = response.results;
					console.log("Unconverted Amount Data:", aData);

					var oData = aData.map(item => {
						return {
							...item,
							customerKey: item.name1 + " (" + item.kunnr + ")"
						};
					});
					console.log(oData);

					// Convert Amount in Crore
					that.convertAmountToCrore(oData);
					// 🔹 Sort descending by amount using helper
					oData = that.sortByAmountDesc(oData);
					console.log("Converted & Sorted Data: ", oData);

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isNewChartFragment2Visible", true);

					var sFragmentId = "newChartFragment2";

					var oTop5Outstanding = that.getView().getModel("newTop5Outstanding");
					oTop5Outstanding.setData(oData);

					that.bindChartColorRulesByOutstanding(sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},
		getSingleCustomerOutstandingData: function() {
			var that = this;
			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oNewChnageModel = oComponent.getModel("quarterlyTurnoverModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var oSelectedTabText = oGlobalData.selectedTabText;
			var aSelectedCustomerMasterData = oGlobalData.selectedCustomerIDs || [];
			var aSelectedCompanyCode = oGlobalData.selectedCompanyCodeId || [];
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			// var aSelectedCustomerIDs = oGlobalDataModel.getProperty("/selectedCustomerIDs") || [];
			// var aSelectedCustomerNames = oGlobalDataModel.getProperty("/selectedCustomerNames") || [];

			var oDate = this.byId("DatePickerId").getDateValue();
			var sDate = this.formatDateToYYYYMMDD(oDate);

			var filters = [];

			var sKunnr = aSelectedCustomerMasterData[0];
			var sBukrs = aSelectedCompanyCode[0];

			filters.push(new sap.ui.model.Filter("datum", sap.ui.model.FilterOperator.EQ, sDate));
			filters.push(new sap.ui.model.Filter("bukrs", sap.ui.model.FilterOperator.EQ, sDate));

			// var sEntitySet = "/es_outstandingset(kunnr='1000000302',datum='20250824')";
			var sEntitySet = "/es_outstandingset(kunnr='" + sKunnr + "',datum='" + sDate + "',bukrs='" + sBukrs + "')";

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oNewChnageModel.read(sEntitySet, {
				// filters: filters,
				success: function(response) {
					var aData = [];

					if (response.results) {
						// Case: multiple records
						aData = response.results;
					} else {
						// Case: single record
						aData = [response];
					}
					console.log("Unconverted Amount Data:", aData);

					var oData = aData.map(item => {
						return {
							...item,
							customerKey: item.name1 + " (" + item.kunnr + ")"
						};
					});

					console.log("Normalized Array:", oData);

					// Convert Amount in Crore
					that.convertAmountToCrore(oData);
					// 🔹 Sort descending by amount using helper
					oData = that.sortByAmountDesc(oData);
					console.log("Converted & Sorted Data: ", oData);

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isNewChartFragment3Visible", true);
					// oGlobalDataModel.setProperty("/selectedCustomerNames", []);
					// oGlobalDataModel.setProperty("/selectedCustomerIDs", []);

					var sFragmentId = "newChartFragment3";

					var oNewSingleCustomerOutstanding = that.getView().getModel("newSingleCustomerOutstanding");
					oNewSingleCustomerOutstanding.setData(oData);

					that.bindChartColorRulesByOutstanding(sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},
		getTotalOutstandingData: function() {
			var that = this;
			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oNewChnageModel = oComponent.getModel("quarterlyTurnoverModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			var oDate = this.byId("DatePickerId").getDateValue();
			var sDate = this.formatDateToYYYYMMDD(oDate);

			var aSelectedCompanyCode = oGlobalData.selectedCompanyCodeId || [];
			var sBukrs = aSelectedCompanyCode[0];

			var filters = [];
			// 🔹 Add "datum" filter
			filters.push(new sap.ui.model.Filter("datum", sap.ui.model.FilterOperator.EQ, sDate));

			// 🔹 Add "total_outstanding" filter
			filters.push(new sap.ui.model.Filter("total_outstanding", sap.ui.model.FilterOperator.EQ, "X"));

			filters.push(new sap.ui.model.Filter("bukrs", sap.ui.model.FilterOperator.EQ, sBukrs));

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oNewChnageModel.read("/es_outstandingset", {
				filters: filters,
				success: function(response) {
					var oData = response.results;
					console.log(oData);

					// Convert Amount in Crore
					that.convertAmountToCrore(oData);
					// 🔹 Sort descending by amount using helper
					oData = that.sortByAmountDesc(oData);
					console.log("Converted & Sorted Data: ", oData);

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isNewChartFragment4Visible", true);

					var sFragmentId = "newChartFragment4";

					var oTotalOutstanding = that.getView().getModel("newTotalOutstanding");
					oTotalOutstanding.setData(oData);

					that.bindChartColorRulesByOutstanding(sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},

		// Get Backend Data For Customer Due QTR/FY
		getSingleCustomerData_CustomeDueQtrFY: function() {
			var that = this;

			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oNewChnageModel = oComponent.getModel("quarterlyTurnoverModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			// reusable filter function 
			var filters = this._buildFiltersForCustomerQtrFY(oGlobalData, oSelectedIndex);

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oNewChnageModel.read("/es_outstanding_yearset", {
				filters: filters,
				success: function(response) {
					console.log("Normalized Array:", response.results);
					var aData = response.results;

					// Convert Amount in Crore
					var oData = that.convertAmountToCrore(aData);
					// 🔹 Sort descending by amount using helper
					// that.sortByAmountDesc(oData);
					// ✅ Sort by Year + Quarter
					oData = that.sortByQuarterAndYear(oData);
					console.log("Converted & Sorted Data: ", oData);

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isCusQtrFYFragment1Visible", true);

					var sFragmentId = "cusQtrFYFragment1";

					var oNewSingleCustomerOutstandingQtrFY = that.getView().getModel("newSingleCustomerOutstandingQtrFY");
					oNewSingleCustomerOutstandingQtrFY.setData(oData);

					that.bindChartColorRulesByQuarterlyWise_Outstanding(sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},
		getTotalOutstandingData_CustomeDueQtrFY: function() {
			var that = this;

			// Retrieve models once to avoid redundant calls
			var oComponent = this.getOwnerComponent();
			var oNewChnageModel = oComponent.getModel("quarterlyTurnoverModel");
			var oGlobalDataModel = oComponent.getModel("globalData");
			var oGlobalData = oGlobalDataModel.getData();
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();

			// reusable filter function 
			var filters = this._buildFiltersForCustomerQtrFY(oGlobalData, oSelectedIndex);

			// Show busy indicator
			sap.ui.core.BusyIndicator.show();

			// OData call to fetch data
			oNewChnageModel.read("/es_outstanding_yearset", {
				filters: filters,
				success: function(response) {
					console.log("Normalized Array:", response.results);
					var aData = response.results;

					// Convert Amount in Crore
					var oData = that.convertAmountToCrore(aData);
					// 🔹 Sort descending by amount using helper
					// that.sortByAmountDesc(oData);
					// ✅ Sort by Year + Quarter
					oData = that.sortByQuarterAndYear(oData);
					console.log("Converted & Sorted Data: ", oData);

					// Toggle visibility of chart fragments
					oGlobalDataModel.setProperty("/isCusQtrFYFragment2Visible", true);

					var sFragmentId = "cusQtrFYFragment2";

					var oNewTotalOutstandingQtrFY = that.getView().getModel("new_Total_Outstanding_QtrFY");
					oNewTotalOutstandingQtrFY.setData(oData);

					that.bindChartColorRulesByQuarterlyWise_Outstanding(sFragmentId, oData);

					// Check if data is available
					sap.ui.core.BusyIndicator.hide();
					if (!oData.length) {
						sap.m.MessageBox.information("There are no data available!");
					}
				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.error(error);

					try {
						var errorObject = JSON.parse(error.responseText);
						sap.m.MessageBox.error(errorObject.error.message.value);
					} catch (e) {
						sap.m.MessageBox.error("An unexpected error occurred.");
					}
				}
			});
		},

		// Chart View For Customer Due
		bindChartColorRulesByOutstanding: function(sFragmentId, oData) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oSelectedTabText = oGlobalModel.getProperty("/selectedTabText2");
			var oVizFrame = sap.ui.core.Fragment.byId(this.createId(sFragmentId), "idVizFrame2");

			if (!oVizFrame) {
				console.warn("VizFrame not found for Fragment ID:", sFragmentId);
				return;
			}

			// this._adjustVizFrameWidth(sFragmentId, "idVizFrame2", oData);  // For VizFrame Width increase

			var {
				colorMap
			} = this.generateColorMapByOutstanding(oData, oSelectedTabText);

			var rules = [];

			if (oSelectedTabText === "Total Outstanding") {
				// No dimension, just set a single bright color globally
				oVizFrame.setVizProperties({
					plotArea: {
						colorPalette: ["hsl(200, 90%, 55%)"], // bright blue
						dataLabel: {
							visible: true
						},
						drawingEffect: "glossy"
					},
					title: {
						visible: true,
						text: "Due As on Date"
					},
				});
				// return; // exit early, no need for rules
			} else {
				rules = oData.map(item => {
					// const customerMap = `${item.name1}`;
					// const customerKey = `${item.name1} (${item.kunnr})`; // hidden unique key
					const customerKey = item.customerKey;
					return {
						dataContext: {
							// "Customer Name": item.name1
							"Customer Name": customerKey // match with dimension
						},
						properties: {
							// color: colorMap[customerMap]
							color: colorMap[customerKey]
						}
					};
				});
			}

			oVizFrame.setVizProperties({
				title: {
					visible: true,
					text: "Due As on Date"
				},
				plotArea: {
					dataPointStyle: {
						rules
					},
					dataLabel: {
						visible: true
					},
					drawingEffect: "glossy"
				},
				tooltip: {
					visible: true
				},
				interaction: {
					selectability: {
						mode: "multiple"
					}
				},
				categoryAxis: {
					label: {
						visible: true,
						allowMultiline: true,
						linesOfWrap: 4,
						overlapBehavior: "wrap",
						rotation: 0,
						angle: 0,
						maxWidth: 200,
						truncatedLabelRatio: 0.9,
						style: {
							fontSize: "11px",
							fontWeight: "bold"
						}
					}
				},
				valueAxis: {
					label: {
						visible: true
					}
				}
			});

			// Use bind to pass sFragmentId and call _onChartSelect
			oVizFrame.attachSelectData(this._onChartSelectOutstading.bind(this, sFragmentId));
		},
		generateColorMapByOutstanding: function(data, selectedTabText) {
			const colorMap = {};
			let uniqueKeys = [];

			// Choose key format based on selected tab
			if (selectedTabText === "Turnover") {
				uniqueKeys = [...new Set(data.map(item => `(${item.quater} ${item.quaterYear})`))];
			} else {
				// uniqueKeys = [...new Set(data.map(item => `${item.name1}`))];
				uniqueKeys = [...new Set(data.map(item => `${item.name1} (${item.kunnr})`))];
			}

			// Generate HSL colors based on index
			uniqueKeys.forEach((key, i) => {
				const color = `hsl(${(i * 43) % 360}, 70%, 50%)`;
				colorMap[key] = color;
			});

			return {
				colorMap
			};
		},
		_onChartSelectOutstading: function(sFragmentId, oEvent) {
			var oVizFrame = oEvent.getSource();
			var oPopover = sap.ui.core.Fragment.byId(this.createId(sFragmentId), "idPopOverOutstanding");

			if (!oPopover) {
				console.warn("Popover not found for Fragment ID:", sFragmentId)
				return;
			}

			// Get selected data from the event (it will be in the 'data' parameter of the event)
			var aSelectedData = oEvent.getParameter("data");

			if (!aSelectedData || aSelectedData.length === 0) {
				console.warn("No data selected");
				return;
			}

			// We assume single selection and access the first item in the selected data array
			var oSelectedItem = aSelectedData[0];

			// Directly get the data from the selected item
			var oDataContext = oSelectedItem.data; // Directly access the data (it may not need 'data.data')

			// 🔹 Get which tab is active
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var sSelectedTabText = oGlobalModel.getProperty("/selectedTabText2");

			var sCustomer, sAmount;

			if (sSelectedTabText === "Total Outstanding") {
				// Only one measure, no customer dimension
				sCustomer = "Total Outstanding"; // fixed label
				sAmount = oDataContext["Outstanding Amount (₹ Cr)"];
			} else {
				// Normal case with Customer Name dimension
				sCustomer = oDataContext["Customer Name"];
				sAmount = oDataContext["Outstanding Amount (₹ Cr)"];
			}

			// Assuming you are accessing Supplier Name, Fiscal Year, and Turnover
			// var sCustomer = oDataContext["Customer Name"];
			// var sAmount = oDataContext["Outstanding Amount (Cr)"];
			// var sFiscalYear = oDataContext["Fiscal Year"];
			// var sTurnover = oDataContext["Turn Over (Cr)"]; // Adjust the field name as necessary

			// Create a JSON model to hold the data for the Popover
			var oPopoverModel = new sap.ui.model.json.JSONModel({
				customer: sCustomer,
				amount: sAmount
			});

			// Set the model on the Popover
			oPopover.setModel(oPopoverModel);

			// Connect the Popover to the VizFrame
			oPopover.connect(oVizFrame.getVizUid());
		},

		// Chart View For Customer Due Qtr/FY
		generateColorMapByQuarterlyWise_Outstanding: function(data, selectedTabText) {
			var colorMap = {};
			var uniqueKeys = [];

			if (selectedTabText === "Total Outstanding") {
				uniqueKeys = [...new Set(data.map(item => `(${item.poper} ${item.gjahr})`))];
			} else {
				uniqueKeys = [...new Set(data.map(item => `${item.name1} (${item.poper} ${item.gjahr})`))];
			}

			uniqueKeys.forEach(function(key, i) {
				var color = `hsl(${(i * 37) % 360}, 65%, 55%)`;
				colorMap[key] = color;
			});

			return {
				colorMap: colorMap
			};
		},
		bindChartColorRulesByQuarterlyWise_Outstanding: function(sFragmentId, oData) {

			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var isQuarterSelected = oGlobalModel.getProperty("/isQuarterSelected");
			var chartViewText = isQuarterSelected ? "Quater And Fiscal Year Wise Outstanding Amount" : "Fiscal Year Wise Outstanding Amount";

			var oSelectedTabText = oGlobalModel.getProperty("/selectedTabText3");
			var oVizFrame = sap.ui.core.Fragment.byId(this.createId(sFragmentId), "idVizFrame3");

			if (!oVizFrame) {
				console.warn("VizFrame not found for Fragment ID:", sFragmentId);
				return;
			}

			var result = this.generateColorMapByQuarterlyWise_Outstanding(oData, oSelectedTabText);
			var colorMap = result.colorMap;
			var rules = [];

			if (oSelectedTabText === "Total Outstanding") {
				rules = oData.map(function(item) {
					var key = `(${item.poper} ${item.gjahr})`;
					return {
						dataContext: {
							"Quarter": item.poper,
							"Quarter Year": item.gjahr
						},
						properties: {
							color: colorMap[key]
						}
					};
				});
			} else {
				rules = oData.map(function(item) {
					var key = `${item.name1} (${item.poper} ${item.gjahr})`;
					return {
						dataContext: {
							"Customer Name": item.name1,
							"Quarter": item.poper,
							"Quarter Year": item.gjahr
						},
						properties: {
							color: colorMap[key]
						}
					};
				});
			}

			oVizFrame.setVizProperties({
				title: {
					visible: true,
					text: chartViewText
				},
				plotArea: {
					dataPointStyle: {
						rules: rules
					},
					dataLabel: {
						visible: true
					},
					drawingEffect: "glossy"
				},
				tooltip: {
					visible: true
				},
				interaction: {
					selectability: {
						mode: "multiple"
					}
				},
				categoryAxis: {
					label: {
						visible: true,
						allowMultiline: true,
						linesOfWrap: 4,
						overlapBehavior: "wrap",
						rotation: 0,
						angle: 0,
						maxWidth: 200,
						truncatedLabelRatio: 0.9,
						style: {
							fontSize: "10px"
						}
					}
				},
				valueAxis: {
					label: {
						visible: true
					}
				},
				xAxis: {
					sortOrder: "asc" // But again, will sort alphabetically by default
				}
			});

			// Use bind to pass sFragmentId and call _onChartSelect
			oVizFrame.attachSelectData(this._onChartSelectQuarterlyWise_Outstanding.bind(this, sFragmentId));

		},
		_onChartSelectQuarterlyWise_Outstanding: function(sFragmentId, oEvent) {

			var oVizFrame = oEvent.getSource();
			var oPopover = sap.ui.core.Fragment.byId(this.createId(sFragmentId), "idPopOverOutstanding2");

			if (!oPopover) {
				console.warn("Popover not found for Fragment ID:", sFragmentId);
				return;
			}

			// Get selected data from the event (it will be in the 'data' parameter of the event)
			var aSelectedData = oEvent.getParameter("data");

			if (!aSelectedData || aSelectedData.length === 0) {
				console.warn("No data selected");
				return;
			}

			// We assume single selection and access the first item in the selected data array
			var oSelectedItem = aSelectedData[0];

			// Directly get the data from the selected item
			var oDataContext = oSelectedItem.data; // Directly access the data (it may not need 'data.data')

			// Assuming you are accessing Supplier Name, Quarter, Quarter Year, and Turnover
			var sCustomer = oDataContext["Customer Name"];
			var sQuarter = oDataContext["Quarter"];
			var sQuarterYear = oDataContext["Quarter Year"];
			var sAmount = oDataContext["Outstanding Amount (₹ Cr)"]; // Adjust the field name as necessary

			// Create a JSON model to hold the data for the Popover
			var oPopoverModel = new sap.ui.model.json.JSONModel({
				customer: sCustomer,
				quarter: sQuarter,
				quarterYear: sQuarterYear,
				amount: sAmount
			});

			// Set the model on the Popover
			oPopover.setModel(oPopoverModel);

			// Connect the Popover to the VizFrame
			oPopover.connect(oVizFrame.getVizUid());
		},

		_adjustVizFrameWidth: function(sFragmentId, sVizFrameId, oData) {

			if (!Array.isArray(oData)) {
				console.warn("oData is not an array for chart resizing");
				return;
			}

			// var iBarWidth = 200, iMinWidth = 1000;
			//   var iNumBars = oData.length;
			//   var iChartWidth = Math.max(iNumBars * iBarWidth, iMinWidth);

			// 🔹 Dynamic bar width rules
			var iNumBars = oData.length;
			var iBarWidth;
			if (iNumBars < 6) {
				iBarWidth = 400; // fewer bars → give extra width
			} else if (iNumBars < 20) {
				iBarWidth = 250; // medium bars
			} else {
				iBarWidth = 120; // large dataset → smaller width per bar
			}

			var iMinWidth = 1000; // fallback minimum
			var iChartWidth = Math.max(iNumBars * iBarWidth, iMinWidth);

			// ✅ Access VizFrame inside fragment
			var oVizFrame = sap.ui.core.Fragment.byId(this.createId(sFragmentId), sVizFrameId);
			if (oVizFrame) {
				oVizFrame.setWidth(iChartWidth + "px");
			} else {
				console.warn("VizFrame with ID", sVizFrameId, "not found in fragment", sFragmentId);
			}
		},

	});
});