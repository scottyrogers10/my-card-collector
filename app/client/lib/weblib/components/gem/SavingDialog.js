BASE.require([
    "jQuery",
    "BASE.async.delayAsync"
], function () {

    BASE.namespace("components.gem");

    var Future = BASE.async.Future;
    var Fulfillment = BASE.async.Fulfillment;
    var delayAsync = BASE.async.delayAsync;

    var defaultOptions = {
        savingText: "Saving Items...",
        savedText: "Successfully Saved"
    };

    components.gem.SavingDialog = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $errorMessage = $(tags["error-message"]);
        var $savingMessage = $(tags["saving-message"]);
        var $savedMessage = $(tags["saved-message"]);
        var $errorButton = $(tags["error-button"]);
        var $errorContainer = $(tags["error-container"]);
        var $message = $(tags["message"]);
        var stateManager = $(tags["state-manager"]).controller();
        var window = null;
        var currentFuture = Future.fromResult();

        var fitErrorContentAsync = function () {
            window.setSize({
                width: 400,
                height: 300
            });

            return window.centerAsync();
        };

        var fitSavingMessagesAsync = function () {
            window.setSize({
                width: 300,
                height: 100
            });

            return window.centerAsync();
        };

        self.handleSavingFuture = function (future, options) {
            options = options || defaultOptions;

            $savingMessage.text(options.savingText);
            $savedMessage.text(options.savedText);

            return fitSavingMessagesAsync().chain(function () {
                return window.showAsync();
            }).chain(function () {
                return stateManager.replaceAsync("saving-message");
            }).chain(function () {
                return future;
            }).chain(function () {
                return stateManager.replaceAsync("saved-message");
            }).chain(function () {
                return delayAsync(1000);
            }).chain(function () {
                return window.closeAsync();
            }).catch(function (error) {
                $errorMessage.text(error.message || "Unknown error.");

                return stateManager.replaceAsync("error").chain(function () {
                    return fitErrorContentAsync();
                }).chain(function () {
                    var fulfillment = new Fulfillment();
                    $errorButton.one("click", function () {
                        window.closeAsync().try();
                        fulfillment.setError(error);
                    });
                    return fulfillment;
                });
            });
        };

        self.init = function (windowValue) {
            window = windowValue;
            window.setName("Saving");
            window.disableResize();
            window.hideCloseButton();
        };

    };

});