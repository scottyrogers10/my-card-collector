BASE.require([
		"jQuery",
        "Date.prototype.format"
], function () {
    var Future = BASE.async.Future;

    BASE.namespace("components.gem.inputs");

    var defaultValidateAsync = function () {
        return Future.fromResult();
    };
    var defaultMap = function (value) {
        return value;
    };

    components.gem.inputs.DateTime = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $label = $(tags["label"]);
        var $input = $(tags["input"]);
        var $change = $(tags["change"]);
        var $error = $(tags["error-message"]);
        var map = defaultMap;
        var validateAsync = defaultValidateAsync;
        var value = null;
        var property = null;
        var Type = null;
        var entity = null;
        var displayService = null;
        var propertyName = null;
        var dateTimePickerFuture = null;
        var currentConfig = null;

        var getDateTimePickerModal = function () {
            if (dateTimePickerFuture == null) {
                return dateTimePickerFuture = services.get("windowService").createModalAsync({
                    componentName: "gem-date-time-picker",
                    height: 463,
                    width: 232
                });
            }

            return dateTimePickerFuture;
        };

        var setValue = function (value) {
            $error.text("");

            if (value == null) {
                $input.val("");
                return;
            }

            $input.val(value.format("mm/dd/yyyy (hh:MM TT)"));
        };

        var setLabel = function (label) {
            $label.text(label);
        };

        var showDateTimePicker = function () {
            getDateTimePickerModal().chain(function (windowManager) {
                windowManager.controller.setValue(value);

                return windowManager.window.showAsync().chain(function () {
                    return windowManager.controller.getFulfillment();
                });
            }).chain(function (newValue) {
                value = newValue;
                setValue(value);

                $error.text("");
                $elem.trigger("save-needed");
            }).try();
        };

        self.disable = function () {
            $input.prop("disabled", true);
            $change.prop("disabled", true);
        };

        self.enable = function () {
            $input.prop("disabled", false);
            $change.prop("disabled", false);
        };

        self.focus = function () {
            return $input.focus();
        };

        self.getValue = function () {
            return map(value);
        };

        self.setError = function (message) {
            $error.text(message);
        };

        self.setValue = function (newValue) {
            setValue(newValue);
        };

        self.setConfig = function (config) {
            currentConfig = config;
            entity = config.entity;
            Type = config.Type;
            displayService = config.displayService;
            propertyName = config.propertyName;
            value = config.getValue(entity);
            validateAsync = config.validateAsync || defaultValidateAsync;

            if (config.readOnly) {
                self.disable();
            } else {
                self.enable();
            }

            setValue(value);
            setLabel(config.label());
        };

        self.saveAsync = function () {
            currentConfig.setValue(entity, self.getValue());
        };

        self.validateAsync = function () {
            return validateAsync(self.getValue()).ifError(function (error) {
                self.setError(error.message);
            });
        };

        $change.on("click", function () {
            showDateTimePicker();
        });

        $input.on("mousedown", function () {
            return false;
        });

        $input.on("click", function () {
            showDateTimePicker();
            return false;
        });

    };
});