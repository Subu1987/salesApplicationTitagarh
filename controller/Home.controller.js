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

		},
		_initializeAppData: function() {
			this.getCustomerMasterParametersData();
			this.getMaterialMasterParametersData();
		},
		_updateGlobalDataModel: function() {
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			if (oGlobalDataModel) {
				oGlobalDataModel.setProperty("/selectedTabText", "All Customer Quarterly Wise");
				oGlobalDataModel.setProperty("/selectedDomesticExport", "D");
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
		validateInputs: function() {
			var oComponent = this.getOwnerComponent();
			var oGlobalData = oComponent.getModel("globalData").getData();
			var oSelectedIndex = this.byId("radioBtnlist").getSelectedIndex();
			var oSelectedTabText = oGlobalData.selectedTabText;
			var oView = this.getView();

			// Map input IDs to friendly field names
			var mFieldNames = {
				"_materialInputId": "Material",
				"_customerInputId": "Customer",
				"_financialYearInputId": "Fiscal Year",
				"_quarterInputId": "Quarter",
				"_quarterInputYearId": "Quarter Year"
			};

			var getInputIdsToValidate = function() {
				var isSingleCustomer = oSelectedTabText === "Single Customer Quarterly Wise";

				if (isSingleCustomer) {
					return oSelectedIndex === 0 ? ["_customerInputId", "_financialYearInputId"] : ["_customerInputId", "_quarterInputId",
						"_quarterInputYearId"
					];
				} else {
					return oSelectedIndex === 0 ? ["_financialYearInputId"] : ["_quarterInputId", "_quarterInputYearId"];
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
			var oCustomerMasterModel = this.getOwnerComponent().getModel("customerMasterModel");
			var pUrl = "/ZCUST_MASTER";

			sap.ui.core.BusyIndicator.show();
			oCustomerMasterModel.read(pUrl, {
				success: function(response) {
					var pData = response.results;
					console.log(pData);

					// Sort the data based on the Customer number (Customer field)
					pData.sort(function(a, b) {
						// Convert customer number to integers for correct numerical sorting
						return parseInt(a.Customer) - parseInt(b.Customer);
					});
					sap.ui.core.BusyIndicator.hide();

					// set the Customer data 
					var oCustomerMasterData = that.getOwnerComponent().getModel("customerMasterData");
					oCustomerMasterData.setData(pData);

				},
				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					console.log(error);
					var errorObject = JSON.parse(error.responseText);
					sap.m.MessageBox.error(errorObject.error.message.value);
				}
			});

		},
		getMaterialMasterParametersData: function() {
			var that = this;
			var oMaterialMasterModel = this.getOwnerComponent().getModel("materialMasterModel");
			var pUrl = "/Z_INF_Mat_Grp_Mast";

			sap.ui.core.BusyIndicator.show();
			oMaterialMasterModel.read(pUrl, {
				success: function(response) {
					var pData = response.results;
					console.log(pData);

					// Sort the data based on the Material Name
					/*pData.sort(function(a, b) {
						// Convert Material number to integers for correct numerical sorting
						return parseInt(a.wgbez) - parseInt(b.wgbez);
					});*/
					sap.ui.core.BusyIndicator.hide();

					// set the Customer data 
					var oMaterialMasterData = that.getOwnerComponent().getModel("materialMasterData");
					oMaterialMasterData.setData(pData);

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

		/*handleValueCustomerMaster: function(oEvent) {
			this._customerInputId = oEvent.getSource().getId();
			var that = this;

			if (!this._oCustomerMasterDialog) {
				Fragment.load({
					id: that.getView().getId(),
					name: "com.infocus.salesApplication.view.dialogComponent.DialogCustomerMaster",
					controller: that
				}).then(function(oDialog) {
					that._oCustomerMasterDialog = oDialog;
					that.getView().addDependent(oDialog);
					oDialog.open();
				}).catch(function(oError) {
					console.error("Error loading Customer Master Dialog:", oError);
				});
			} else {
				this._oCustomerMasterDialog.open();
			}
		},*/
		handleValueMaterialMaster: function(oEvent) {
			this._materialInputId = oEvent.getSource().getId();
			var that = this;

			if (!this._oMaterialMasterDialog) {
				this._oMaterialMasterDialog = sap.ui.xmlfragment(
					that.getView().getId() + "MaterialMasterDialog",
					"com.infocus.salesApplication.view.dialogComponent.DialogMaterialMaster",
					that // controller reference
				);

				that.getView().addDependent(this._oMaterialMasterDialog);
			}

			this._oMaterialMasterDialog.open();
		},
		handleValueCustomerMaster: function(oEvent) {
			this._customerInputId = oEvent.getSource().getId();
			var that = this;

			if (!this._oCustomerMasterDialog) {
				this._oCustomerMasterDialog = sap.ui.xmlfragment(
					that.getView().getId() + "CustomerMasterDialog",
					"com.infocus.salesApplication.view.dialogComponent.DialogCustomerMaster",
					that // controller
				);

				that.getView().addDependent(this._oCustomerMasterDialog);
			}

			this._oCustomerMasterDialog.open();
		},
		/*handleValueMaterialMaster: function(oEvent) {
			this._materialInputId = oEvent.getSource().getId();
			var that = this;

			if (!this._oMaterialMasterDialog) {
				Fragment.load({
					id: that.getView().getId(),
					name: "com.infocus.salesApplication.view.dialogComponent.DialogMaterialMaster",
					controller: that
				}).then(function(oDialog) {
					that._oMaterialMasterDialog = oDialog;
					that.getView().addDependent(oDialog);
					oDialog.open();
				}).catch(function(oError) {
					console.error("Error loading Material Master Dialog:", oError);
				});
			} else {
				this._oMaterialMasterDialog.open();
			}
		},*/
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

		/*************** search value within fragment *****************/

		onSearchCustomerMaster: function(oEvent) {
			var sQuery = oEvent.getParameter("newValue");

			// Get the correct fragment ID
			var sFragmentId = this.getView().getId() + "CustomerMasterDialog";

			var oList = Fragment.byId(sFragmentId, "idCustomerMasterList");
			if (!oList) return;

			var oBinding = oList.getBinding("items");
			if (!oBinding) return;

			var aFilters = [];
			if (sQuery) {
				var oFilter1 = new sap.ui.model.Filter("Customer", sap.ui.model.FilterOperator.Contains, sQuery);
				var oFilter2 = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(new sap.ui.model.Filter({
					filters: [oFilter1, oFilter2],
					and: false
				}));
			}

			oBinding.filter(aFilters);
		},
		onSearchMaterialMaster: function(oEvent) {
			var sQuery = oEvent.getParameter("newValue");

			// Get the correct fragment ID
			var sFragmentId = this.getView().getId() + "MaterialMasterDialog";

			var oList = Fragment.byId(sFragmentId, "idMaterialMasterList");
			if (!oList) return;

			var oBinding = oList.getBinding("items");
			if (!oBinding) return;

			var aFilters = [];
			if (sQuery) {
				var oFilter1 = new sap.ui.model.Filter("matkl", sap.ui.model.FilterOperator.Contains, sQuery);
				var oFilter2 = new sap.ui.model.Filter("wgbez", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(new sap.ui.model.Filter({
					filters: [oFilter1, oFilter2],
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
			var oInput = this.byId(this._customerInputId);
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");

			// Values are already being maintained correctly in the model
			var aSelectedNamesDisplay = oGlobalModel.getProperty("/selectedCustomerNamesDisplay") || "";
			var aSelectedNames = oGlobalModel.getProperty("/selectedCustomerNames") || [];
			var aSelectedIDs = oGlobalModel.getProperty("/selectedCustomerIDs") || [];

			// You can now directly use these for any processing or display
			console.log("Confirmed selected IDs:", aSelectedIDs);
			console.log("Confirmed selected Names:", aSelectedNames);
			console.log("Confirmed selected Display Names:", aSelectedNamesDisplay);

			// Set to Input field
			if (oInput) {
				oInput.setValueState("None");
			}

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
			// Get the correct fragment ID
			var sFragmentId = this.getView().getId() + "CustomerMasterDialog";

			var oList = Fragment.byId(sFragmentId, "idCustomerMasterList");
			var oSearchField = Fragment.byId(sFragmentId, "idCustomerSearchField");

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

		onSelectAllMaterialMaster: function(oEvent) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var aSelectedMaterialIDs = oGlobalModel.getProperty("/selectedMaterialIDs") || [];
			var aSelectedMaterialNames = oGlobalModel.getProperty("/selectedMaterialNames") || [];

			var oButton = oEvent.getSource();
			// Get the correct fragment ID
			var sFragmentId = this.getView().getId() + "MaterialMasterDialog";

			var oList = Fragment.byId(sFragmentId, "idMaterialMasterList");
			if (!oList) return;

			var aItems = oList.getItems();

			var bAllSelected = aItems.every(function(oItem) {
				return oItem.getSelected();
			});

			// Toggle selection
			aItems.forEach(function(oItem) {
				oItem.setSelected(!bAllSelected);
				if (!bAllSelected) {
					var sID = oItem.getTitle();
					var sName = oItem.getDescription();
					aSelectedMaterialIDs.push(sID);
					aSelectedMaterialNames.push(sName);
				}
			});

			// Update global model
			if (bAllSelected) {
				// Deselecting all: clear the global model
				oGlobalModel.setProperty("/selectedMaterialIDs", []);
				oGlobalModel.setProperty("/selectedMaterialNames", []);
				oGlobalModel.setProperty("/selectedMaterialNamesDisplay", "");
			} else {
				// Selecting all: store data in the global model
				oGlobalModel.setProperty("/selectedMaterialIDs", aSelectedMaterialIDs);
				oGlobalModel.setProperty("/selectedMaterialNames", aSelectedMaterialNames);
				oGlobalModel.setProperty("/selectedMaterialNamesDisplay", aSelectedMaterialNames.join(", "));
			}

			// Toggle button text
			oButton.setText(bAllSelected ? "Select All" : "Deselect All");
		},
		onSelectionChangeMaterialMaster: function(oEvent) {
			var oList = oEvent.getSource();
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var aSelectedMaterialIDs = oGlobalModel.getProperty("/selectedMaterialIDs") || [];
			var aSelectedMaterialNames = oGlobalModel.getProperty("/selectedMaterialNames") || [];

			var aAllItems = oList.getItems();
			aAllItems.forEach(function(oItem) {
				var sID = oItem.getTitle();
				var sName = oItem.getDescription();

				// If item is selected
				if (oItem.getSelected()) {
					if (!aSelectedMaterialIDs.includes(sID)) {
						aSelectedMaterialIDs.push(sID);
						aSelectedMaterialNames.push(sName);
					}
				} else {
					// If item is unselected
					var index = aSelectedMaterialIDs.indexOf(sID);
					if (index !== -1) {
						aSelectedMaterialIDs.splice(index, 1);
						aSelectedMaterialNames.splice(index, 1);
					}
				}
			});

			oGlobalModel.setProperty("/selectedMaterialNames", aSelectedMaterialNames);
			oGlobalModel.setProperty("/selectedMaterialIDs", aSelectedMaterialIDs);
			oGlobalModel.setProperty("/selectedMaterialNamesDisplay", aSelectedMaterialNames.join(", "));
		},
		onConfirmMaterialMaster: function() {
			var oInput = this.byId(this._materialInputId);
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");

			// Values are already being maintained correctly in the model
			var aSelectedNamesDisplay = oGlobalModel.getProperty("/selectedMaterialNamesDisplay") || "";
			var aSelectedNames = oGlobalModel.getProperty("/selectedMaterialNames") || [];
			var aSelectedIDs = oGlobalModel.getProperty("/selectedMaterialIDs") || [];

			// You can now directly use these for any processing or display
			console.log("Confirmed selected IDs:", aSelectedIDs);
			console.log("Confirmed selected Names:", aSelectedNames);
			console.log("Confirmed selected Display Names:", aSelectedNamesDisplay);

			// Set to Input field
			if (oInput) {
				oInput.setValueState("None");
			}

			oGlobalModel.refresh(true);

			this._resetMaterialMasterDialog();
			this._oMaterialMasterDialog.close();
		},
		onCloseMaterialMaster: function() {
			// Clear global model selections
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			oGlobalModel.setProperty("/selectedMaterialIDs", []);
			oGlobalModel.setProperty("/selectedMaterialNames", []);
			oGlobalModel.setProperty("/selectedMaterialNamesDisplay", "");

			this._resetMaterialMasterDialog();
			this._oMaterialMasterDialog.close();
		},
		_resetMaterialMasterDialog: function() {
			// Get the correct fragment ID
			var sFragmentId = this.getView().getId() + "MaterialMasterDialog";

			var oList = Fragment.byId(sFragmentId, "idMaterialMasterList");
			var oSearchField = Fragment.byId(sFragmentId, "idMaterialSearchField");

			// Clear Search
			if (oSearchField) {
				oSearchField.setValue("");

				// Manually trigger the liveChange event handler with empty value
				this.onSearchMaterialMaster({
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

		_handleFiscalYearConfirm: function(oEvent) {
			var aSelectedItems = oEvent.getParameter("selectedItems"); // Get selected items (multiSelect enabled)
			var aSelectedYears = [];

			if (aSelectedItems && aSelectedItems.length > 0) {
				aSelectedItems.forEach(function(oItem) {
					aSelectedYears.push(oItem.getTitle()); // Collect selected years
				});

				var oFiscalYearInput = this.byId(this._financialYearInputId); // Ensure input ID is correct
				if (oFiscalYearInput) {
					oFiscalYearInput.setValue(aSelectedYears.join(", ")); // Display selected values in input
					oFiscalYearInput.setValueState("None"); // Reset error state

				}

				// Store selected fiscal years in the global model
				var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
				if (oGlobalDataModel) {
					oGlobalDataModel.setProperty("/fiscalYears", aSelectedYears);
				}
			}

			// Reset visibility of All items
			oEvent.getSource().getItems().forEach(function(oItem) {
				oItem.setVisible(true);
			});
		},
		_handleFiscalYearCancel: function(oEvent) {
			// Clear global model
			var oGlobalData = this.getOwnerComponent().getModel("globalData");
			if (oGlobalData) {
				oGlobalData.setProperty("/fiscalYears", []);
			}

			// Reset item visibility
			oEvent.getSource().getItems().forEach(function(oItem) {
				oItem.setVisible(true);
			});
		},
		_handleQuarterConfirm: function(oEvent) {
			var aSelectedItems = oEvent.getParameter("selectedItems"); // Get selected items for multiSelect
			var aSelectedQuarters = [];

			if (aSelectedItems && aSelectedItems.length > 0) {
				aSelectedItems.forEach(function(oItem) {
					aSelectedQuarters.push(oItem.getTitle()); // Collect selected quarters
				});

				var oQuarterInput = this.byId(this._quarterInputId); // Ensure input ID is correct
				if (oQuarterInput) {
					oQuarterInput.setValue(aSelectedQuarters.join(", ")); // Display selected values
					oQuarterInput.setValueState("None"); // Reset error state

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
		_handleQuarterCancel: function(oEvent) {
			// Clear global model
			var oGlobalData = this.getOwnerComponent().getModel("globalData");
			if (oGlobalData) {
				oGlobalData.setProperty("/selectedQuarters", []);
			}

			// Reset item visibility
			oEvent.getSource().getItems().forEach(function(oItem) {
				oItem.setVisible(true);
			});
		},
		_handleQuarterYearConfirm: function(oEvent) {
			var aSelectedItems = oEvent.getParameter("selectedItems"); // Get selected items for multiSelect
			var aSelectedYears = [];

			if (aSelectedItems && aSelectedItems.length > 0) {
				aSelectedItems.forEach(function(oItem) {
					aSelectedYears.push(oItem.getTitle()); // Collect selected years
				});

				var oQuarterYearInput = this.byId(this._quarterInputYearId); // Ensure input ID is correct
				if (oQuarterYearInput) {
					oQuarterYearInput.setValue(aSelectedYears.join(", ")); // Display selected values
					oQuarterYearInput.setValueState("None"); // ✅ Reset error state

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
		_handleQuarterYearCancel: function(oEvent) {
			// Clear global model
			var oGlobalData = this.getOwnerComponent().getModel("globalData");
			if (oGlobalData) {
				oGlobalData.setProperty("/selectedQuarterYears", []);
			}

			// Reset item visibility
			oEvent.getSource().getItems().forEach(function(oItem) {
				oItem.setVisible(true);
			});
		},

		/*************** radio Button & drop down selection  *****************/

		onRadioButtonSelectList: function(oEvent) {
			var sSelectedKey = oEvent.getSource().getSelectedIndex();

			// Get the containers (HBox elements)
			var oFiscalYearBox = this.getView().byId("fiscalYearBox");
			var oQuarterBox = this.getView().byId("quarterBox");
			var oQuarterYearBox = this.getView().byId("quarterYearBox");
			var oButtonBox = this.getView().byId("buttonBox");

			if (sSelectedKey === 0) { // Fiscal Year Wise selected
				oFiscalYearBox.setVisible(true);
				oQuarterBox.setVisible(false);
				oQuarterYearBox.setVisible(false);
				oButtonBox.setVisible(true);
			} else if (sSelectedKey === 1) { // Quarterly Wise selected
				oFiscalYearBox.setVisible(false);
				oQuarterBox.setVisible(true);
				oQuarterYearBox.setVisible(true);
				oButtonBox.setVisible(true);
			}
		},
		onRadioButtonSelectDomesticExport: function(oEvent) {
			var oRadioGroup = oEvent.getSource();
			var iSelectedIndex = oRadioGroup.getSelectedIndex(); // Get selected index
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");

			if (iSelectedIndex === 0) { // Domestic
				oGlobalDataModel.setProperty("/selectedDomesticExport", "D");
			} else if (iSelectedIndex === 1) { // Export
				oGlobalDataModel.setProperty("/selectedDomesticExport", "E");
			} else if (iSelectedIndex === 2) { // Total
				oGlobalDataModel.setProperty("/selectedDomesticExport", "T");
			}
		},

		/*************** get the Icontabfilter select updated in global model  *****************/

		onTabSelect: function(oEvent) {
			var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
			var oCustomerMasterBox = this.getView().byId("customerMasterBox");
			var oTotalRadioButton = this.getView().byId("total");
			var oRadioGroup = this.getView().byId("radioBtnlistNew");

			// Get the selected tab key
			var sSelectedKey = oEvent.getParameter("selectedKey");

			// Define the mapping of keys to text values
			var oTextMapping = {
				"scenario1": "All Customer Quarterly Wise",
				"scenario2": "Top 10 Customer Quarterly Wise",
				"scenario3": "Single Customer Quarterly Wise",
				"scenario4": "Sales Turnover"
			};

			// visible non-visible on customer box
			if (oTextMapping[sSelectedKey] === "Single Customer Quarterly Wise") {
				oCustomerMasterBox.setVisible(true);
			} else {
				oCustomerMasterBox.setVisible(false);
			}

			// Sales Turnover in Total radiobutton
			if (oTextMapping[sSelectedKey] === "Sales Turnover") {
				oTotalRadioButton.setVisible(true);
			} else {
				oTotalRadioButton.setVisible(false);
				oRadioGroup.setSelectedIndex(0); // Reset to Domestic
				// Also update global model
				oGlobalDataModel.setProperty("/selectedDomesticExport", "D");
			}

			// Update the global model with the corresponding text
			if (oGlobalDataModel) {
				oGlobalDataModel.setProperty("/selectedTabText", oTextMapping[sSelectedKey] || "");
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

		getBackendData: function() {

			if (!this.validateInputs()) {
				/*sap.m.MessageBox.error("Please fill all required fields.");*/
				return;
			}

			var oGlobalData = this.getOwnerComponent().getModel("globalData").getData();
			var oSelectedTabText = oGlobalData.selectedTabText;

			if (oSelectedTabText === "All Customer Quarterly Wise") {
				this.getAllCustomerData();

			} else if (oSelectedTabText === "Top 10 Customer Quarterly Wise") {
				this.getTop10CustomerData();

			} else if (oSelectedTabText === "Single Customer Quarterly Wise") {
				this.getSingleCustomerData();

			} else {
				this.getQuarterlyData();

			}

		},
		_buildFilters: function(oGlobalData, oSelectedIndex) {
			var filters = [];

			var oSelectedTabText = oGlobalData.selectedTabText;
			var aSelectedCustomerMasterData = oGlobalData.selectedCustomerIDs || [];
			var aSelectedMaterialMasterData = oGlobalData.selectedMaterialIDs || [];
			var aSelectedDomesticExport = oGlobalData.selectedDomesticExport || [];
			var aFiscalYears = oGlobalData.fiscalYears || [];
			var aQuarters = oGlobalData.selectedQuarters || [];
			var aQuarterYears = oGlobalData.selectedQuarterYears || [];

			// Fiscal Year filters (Tab 0)
			if (oSelectedIndex === 0 && aFiscalYears.length > 0) {
				var fiscalFilter = (aFiscalYears.length === 1) ? new Filter("fiscalYear", FilterOperator.EQ, aFiscalYears[0]) : new Filter({
					filters: aFiscalYears.map(function(year) {
						return new Filter("fiscalYear", FilterOperator.EQ, year);
					}),
					and: false
				});

				filters.push(fiscalFilter);
			}

			// Quarter and QuarterYear filters (Tab != 0)
			if (oSelectedIndex !== 0) {
				var quarterFilters = aQuarters.map(function(quarter) {
					return new Filter("fiscalQuater", FilterOperator.EQ, quarter);
				});

				var quarterYearFilters = aQuarterYears.map(function(year) {
					return new Filter("quater_Year", FilterOperator.EQ, year);
				});

				var finalQuarterFilter = null;
				var finalQuarterYearFilter = null;

				if (quarterFilters.length === 1) {
					finalQuarterFilter = quarterFilters[0];
				} else if (quarterFilters.length > 1) {
					finalQuarterFilter = new Filter({
						filters: quarterFilters,
						and: false
					});
				}

				if (quarterYearFilters.length === 1) {
					finalQuarterYearFilter = quarterYearFilters[0];
				} else if (quarterYearFilters.length > 1) {
					finalQuarterYearFilter = new Filter({
						filters: quarterYearFilters,
						and: false
					});
				}

				if (finalQuarterFilter && finalQuarterYearFilter) {
					filters.push(new Filter({
						filters: [finalQuarterFilter, finalQuarterYearFilter],
						and: true
					}));
				} else if (finalQuarterFilter) {
					filters.push(finalQuarterFilter);
				} else if (finalQuarterYearFilter) {
					filters.push(finalQuarterYearFilter);
				}
			}

			// Customer Master filter (for specific tab)
			if (oSelectedTabText === "Single Customer Quarterly Wise" && aSelectedCustomerMasterData.length > 0) {
				var customerFilter = (aSelectedCustomerMasterData.length === 1) ? new Filter("customer", FilterOperator.EQ,
					aSelectedCustomerMasterData[0]) : new Filter({
					filters: aSelectedCustomerMasterData.map(function(cust) {
						return new Filter("customer", FilterOperator.EQ, cust);
					}),
					and: false
				});

				filters.push(customerFilter);
			}

			// Material Group filter
			if (aSelectedMaterialMasterData.length > 0) {
				var materialFilter = (aSelectedMaterialMasterData.length === 1) ? new Filter("materialGroup", FilterOperator.EQ,
					aSelectedMaterialMasterData[0]) : new Filter({
					filters: aSelectedMaterialMasterData.map(function(mat) {
						return new Filter("materialGroup", FilterOperator.EQ, mat);
					}),
					and: false
				});

				filters.push(materialFilter);
			}

			// Domestic Export filter (always single)
			if (aSelectedDomesticExport.length > 0) {
				filters.push(new Filter("domesticExport", FilterOperator.EQ, aSelectedDomesticExport[0]));
			}

			return filters;
		},
		_checkMaterialColumnVisibility: function(aData) {
			if (!Array.isArray(aData) || !aData.length) {
				return false;
			}
			return aData.some(item => !!item.materialGrpDesc);
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
					var oData = response.results || [];
					console.log("Raw Response Data:", oData);

					// format customer data function
					that.formatCustomerData(oData);

					// ✅ Use helper to check if material column should be shown
					var showMaterialColumn = that._checkMaterialColumnVisibility(oData);

					// ✅ Set in global model
					oGlobalDataModel.setProperty("/showMaterialColumn", showMaterialColumn);

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
					var oData = response.results || [];
					console.log(oData);

					// format customer data function
					that.formatCustomerData(oData);

					// ✅ Use helper to check if material column should be shown
					var showMaterialColumn = that._checkMaterialColumnVisibility(oData);

					// ✅ Set in global model
					oGlobalDataModel.setProperty("/showMaterialColumn", showMaterialColumn);

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
					var oData = response.results || [];
					console.log(oData);

					// format customer data function
					that.formatCustomerData(oData);

					// ✅ Use helper to check if material column should be shown
					var showMaterialColumn = that._checkMaterialColumnVisibility(oData);

					// ✅ Set in global model
					oGlobalDataModel.setProperty("/showMaterialColumn", showMaterialColumn);

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
					var oData = response.results || [];
					console.log(oData);

					// format customer data function
					that.formatCustomerData(oData);

					// ✅ Use helper to check if material column should be shown
					var showMaterialColumn = that._checkMaterialColumnVisibility(oData);

					// ✅ Set in global model
					oGlobalDataModel.setProperty("/showMaterialColumn", showMaterialColumn);

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
		formatCustomerData: function(oData) {
			var oGlobalModel = this.getOwnerComponent().getModel("globalData");
			var oSelectedTabText = oGlobalModel.getProperty("/selectedTabText");
			oData.forEach(item => {
				this.convertTurnoverToCrore(item);
				/*if (oSelectedTabText !== "Quarterly Wise Turnover") {
					this.generateCustomerNameShort(item);
				}*/

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
							"_materialInputId",
							"_customerInputId",
							"_financialYearInputId",
							"_quarterInputId",
							"_quarterInputYearId"
						];
						aInputIds.forEach((sId) => {
							const oInput = that.byId(sId);
							if (oInput) oInput.setValue("");
						});

						// Clear the values bound to the input fields
						oGlobalDataModel.setProperty("/selectedCustomerNamesDisplay", "");
						oGlobalDataModel.setProperty("/selectedCustomerNames", "");
						oGlobalDataModel.setProperty("/selectedCustomerIDs", "");
						oGlobalDataModel.setProperty("/selectedMaterialNamesDisplay", "");
						oGlobalDataModel.setProperty("/selectedMaterialNames", "");
						oGlobalDataModel.setProperty("/selectedMaterialIDs", "");
						oGlobalDataModel.setProperty("/fiscalYears", "");
						oGlobalDataModel.setProperty("/selectedQuarters", "");
						oGlobalDataModel.setProperty("/selectedQuarterYears", "");

						// Reset RadioButtonGroup to default
						const oRadioGroup1 = that.byId("radioBtnlist");
						if (oRadioGroup1) {
							oRadioGroup1.setSelectedIndex(0); // 0 = Fiscal Year Wise
							that.onRadioButtonSelectList({
								getSource: () => oRadioGroup1
							});
						}

						const oRadioGroup2 = that.byId("radioBtnlistNew");
						if (oRadioGroup2) {
							oRadioGroup2.setSelectedIndex(0); // 0 = Domestic
							that.onRadioButtonSelectList({
								getSource: () => oRadioGroup2
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
					}
				}
			});
		},

		/*************** chart function & plotting the chart data  *****************/

		generateColorMapByFiscalYearWise: function(data, selectedTabText) {
			const colorMap = {};
			let uniqueKeys = [];

			// Choose key format based on selected tab
			if (selectedTabText === "Sales Turnover") {
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

			if (oSelectedTabText === "Sales Turnover") {
				rules = oData.map(item => ({
					dataContext: {
						"Fiscal Year": item.fiscalYear
					},
					properties: {
						color: colorMap[item.fiscalYear],
						// Add border for better visibility
						border: {
							color: "#ffffff",
							width: 1
						}
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
							color: colorMap[customerYear],
							// Add border for better visibility
							border: {
								color: "#ffffff",
								width: 1
							}
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
						linesOfWrap: 3,
						overlapBehavior: "wrap",
						rotation: 0,
						angle: 0,
						maxWidth: 200,
						truncatedLabelRatio: 0.9,
						style: {
							fontSize: "8px"
						}
					}
				},
				valueAxis: {
					label: {
						visible: true
					}
				}

			});

			console.log("After setting properties", oVizFrame.getVizProperties());

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
			var oDataContext = oSelectedItem.data;

			// Populate Popover with enriched data
			var oPopoverModel = new sap.ui.model.json.JSONModel({
				Customer: oDataContext["Customer Name"],
				Currency: oDataContext["Currency"],
				MaterialGroup: oDataContext["Material Group Description"],
				FiscalYear: oDataContext["Fiscal Year"],
				Turnover: oDataContext["Turn Over"],
				Quantity: oDataContext["Quantity"]
			});

			// Set the model on the Popover
			oPopover.setModel(oPopoverModel);

			// Connect the Popover to the VizFrame
			oPopover.connect(oVizFrame.getVizUid());
		},

		generateColorMapByQuarterlyWise: function(data, selectedTabText) {
			var colorMap = {};
			var uniqueKeys = [];

			if (selectedTabText === "Sales Turnover") {
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

			if (oSelectedTabText === "Sales Turnover") {
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
					text: "Quarterly Wise Turnover"
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
						linesOfWrap: 3,
						overlapBehavior: "wrap",
						rotation: 0,
						angle: 0,
						maxWidth: 200,
						truncatedLabelRatio: 0.9,
						style: {
							fontSize: "8px"
						}
					}
				},
				valueAxis: {
					label: {
						visible: true
					}
				}
			});
			
			console.log("After setting properties", oVizFrame.getVizProperties());

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
			var oDataContext = oSelectedItem.data;

			// Populate Popover with enriched data
			var oPopoverModel = new sap.ui.model.json.JSONModel({
				Customer: oDataContext["Customer Name"],
				Currency: oDataContext["Currency"],
				MaterialGroup: oDataContext["Material Group Description"],
				Quarter: oDataContext["Quarter"],
				QuarterYear: oDataContext["Quarter Year"],
				Turnover: oDataContext["Turn Over"],
				Quantity: oDataContext["Quantity"]
			});

			// Set the model on the Popover
			oPopover.setModel(oPopoverModel);

			// Connect the Popover to the VizFrame
			oPopover.connect(oVizFrame.getVizUid());
		}
	});
});