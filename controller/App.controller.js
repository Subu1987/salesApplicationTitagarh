sap.ui.define([
	"com/infocus/salesApplication/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/BusyIndicator"
], function(BaseController, MessageBox, BusyIndicator) {
	"use strict";

	return BaseController.extend("com.infocus.salesApplication.controller.App", {

		onInit: function() {
		    console.log("App Controller onInit called");
			this._loadAllModelMetadata();
		},

		_loadAllModelMetadata: function() {
			BusyIndicator.show(0); // Show immediately

			setTimeout(() => {
				// Map of model names to user-friendly labels
				const modelMap = {
					"top10CustomerModel": "Top 10 Customer",
					"singleCustomerModel": "Single Customer",
					"allCustomerModel": "All Customers",
					"quarterlyTurnoverModel": "Quarterly Turnover",
					"customerMasterModel": "Customer Master"
				};

				// Create metadata loading promises
				const modelPromises = Object.keys(modelMap).map(modelName => {
					const model = this.getOwnerComponent().getModel(modelName);
					return model.metadataLoaded()
						.then(() => ({
							status: "fulfilled",
							modelName
						}))
						.catch(() => ({
							status: "rejected",
							modelName
						}));
				});

				// Wait for all metadata loads
				Promise.all(modelPromises).then(results => {
					BusyIndicator.hide(); // Hide after everything

					const failedModels = results.filter(r => r.status === "rejected");

					if (failedModels.length > 0) {
						const failedNames = failedModels
							.map(item => `• ${modelMap[item.modelName]}`)
							.join("\n");

						const errorMessage = `The following data failed to load:\n\n${failedNames}\n\nPlease try again or contact support.`;

						MessageBox.error(errorMessage);
					} else {
						// Optional: You can log or toast if you ever want
						console.log("✅ All model metadata loaded successfully.");
					}
				});
			}, 0); // Give UI time to show BusyIndicator
		}
	});
});
