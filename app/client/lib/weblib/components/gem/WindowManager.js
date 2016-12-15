BASE.require([
		"jQuery",
        "BASE.util.invokeMethodIfExistsAsync",
        "BASE.util.invokeMethodIfExists"
], function () {
    var invokeMethodIfExistsAsync = BASE.util.invokeMethodIfExistsAsync;
    var invokeMethodIfExists = BASE.util.invokeMethodIfExists;
    var Future = BASE.async.Future;

    BASE.namespace("components.gem");

    components.gem.WindowManager = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $veil = $(tags["veil"]);
        var $windowContainer = $(tags["window-container"]);
        var allWindows = [];
        var zIndex = 1;

        var getSize = function (width, height) {
            return {
                width: Math.min(width, $windowContainer.width()),
                height: Math.min(height, $windowContainer.height())
            };
        };

        var createWindowAsync = function (config) {
            var componentName = config.componentName;
            var content = config.content;
            var attributes = config.attributes || {};
            var width = config.width || 400;
            var height = config.height || 400;

            var $component = $("<div></div>");
            attributes.component = componentName;
            $component.attr(attributes);
            $content = $(content).appendTo($component);

            return BASE.web.components.createComponentAsync("gem-window", $component).chain(function (element) {
                var $window = $(element);
                var windowController = $window.controller();
                var componentElement = windowController.getComponent();
                var $componentElement = $(componentElement);
                var controller = $componentElement.controller() || {};
                var size = getSize(width, height);

                $componentElement.addClass("absolute-fill-parent");

                $window.css({
                    position: "absolute",
                    top: parseInt(($windowContainer.height() / 2) - (size.height / 2), 10),
                    left: parseInt(($windowContainer.width() / 2) - (size.width / 2), 10)
                }).addClass("hide").appendTo($windowContainer);


                if (config.isModal) {
                    $window.attr("isModal", "true");
                }

                var placeVeil = function () {
                    var elementArray = $windowContainer.children("[isModal]:not(.hide)").toArray()

                    if (elementArray.length === 0) {
                        $veil.addClass("hide");
                    } else {
                        $veil.removeClass("hide");
                        var elementInfo = elementArray.map(function (element) {
                            var $elem = $(element);
                            return {
                                $element: $elem,
                                zIndex: parseInt($elem.css("z-index"), 10)
                            };
                        }).reduce(function (elementInfo, next) {
                            if (elementInfo.zIndex > next.zIndex) {
                                return elementInfo;
                            } else {
                                return next;
                            }
                        });

                        $veil.css("zIndex", elementInfo.zIndex);
                    }
                };

                var delegate = {
                    closeAsync: function () {
                        var future = invokeMethodIfExistsAsync(controller, "prepareToDeactivateAsync");

                        return future.chain(function () {
                            $window.css("z-index", 0).addClass("hide");
                            placeVeil();
                            invokeMethodIfExists(controller, "deactivated");
                        });

                    },
                    maximize: function () {

                        $window.css({
                            top: "0px",
                            left: "0px",
                            width: $windowContainer.width() + "px",
                            height: $windowContainer.height() + "px"
                        });

                    },
                    centerAsync: function () {
                        var top = ($windowContainer.height() / 2) - ($window.height() / 2);
                        var left = ($windowContainer.width() / 2) - ($window.width() / 2);

                        $window.offset({
                            left: left,
                            top: top
                        });

                        return Future.fromResult();
                    },
                    showAsync: function () {
                        var future = invokeMethodIfExistsAsync(controller, "prepareToActivateAsync");
                        var self = this;

                        return future.chain(function () {
                            $window.removeClass("hide");
                            zIndex++;
                            $window.css("z-index", zIndex);

                            placeVeil();

                            delegate.centerAsync().try();

                            invokeMethodIfExists(controller, "activated");

                        });


                    },
                    disposeAsync: function () {
                        var future = invokeMethodIfExistsAsync(controller, "prepareToDisposeAsync");

                        return future.chain(function () {
                            placeVeil();
                            $window.removeClass("hide");
                            invokeMethodIfExists(controller, "disposed");
                            $window.remove();
                        });

                    },
                    setSize: function (size) {
                        var size = getSize(size.width, size.height);

                        $window.css({
                            width: size.width + "px",
                            height: size.height + "px"
                        });
                    },
                    focus: function () {
                        if (!config.isModal) {
                            zIndex++;
                            $window.css("z-index", zIndex);
                        }

                        placeVeil();
                    }
                };

                windowController.setDelegate(delegate);
                windowController.setSize(size);
                windowController.setConfig(config);

                invokeMethodIfExists(controller, "init", [windowController]);

                return {
                    element: componentElement,
                    controller: controller,
                    window: windowController
                };
            });
        };

        self.saveAsync = function () { };

        self.validateAsync = function () { };

        self.createModalAsync = function (config) {
            config.isModal = true;
            return createWindowAsync(config);
        };

        self.createWindowAsync = function (config) {
            return createWindowAsync(config);
        };

        services.set("windowService", self);
    };
});