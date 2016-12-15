BASE.require([
    "jQuery",
    "jQuery.fn.region",
    "BASE.util.invokeMethodIfExistsAsync",
    "BASE.util.invokeMethodIfExists"
], function () {
    var invokeMethodIfExistsAsync = BASE.util.invokeMethodIfExistsAsync;
    var invokeMethodIfExists = BASE.util.invokeMethodIfExists;
    var Future = BASE.async.Future;
    var fulfilledFuture = Future.fromResult();
    var $body = $(document.body);

    BASE.namespace("components.gem");

    components.gem.Window = function (elem, tags, scope) {
        var self = this;
        var $elem = $(elem);
        var $container = $(tags["container"]);
        var $resize = $(tags["resize"]);
        var $resizeBox = $(tags["resize-box"]);
        var $handle = $(tags["handle"]);
        var $close = $(tags["close"]);
        var $maximize = $(tags["maximize"]);
        var $restore = $(tags["restore"]);
        var $name = $(tags["name"]);
        var regionConstraint = null;
        var windowMouseStartXY = null;
        var windowStartXY = null;
        var resizeMouseStartXY = null;
        var windowRegion = null;
        var lastCoords = {};
        var delegate = {};
        var minSize = {
            width: 400,
            height: 400
        };
        var maxSize = null;
        var previousSize = null;
        var config = null;

        self.getComponent = function () {
            return $container.children()[0];
        };

        self.setRegionContraint = function (region) {
            regionConstraint = region;
        };

        self.centerAsync = function () {
            if (delegate && typeof delegate.centerAsync === "function") {
                return delegate.centerAsync();
            }
            return fulfilledFuture;
        };

        self.closeAsync = function () {
            var closeFuture = fulfilledFuture;
            if (delegate && typeof delegate.closeAsync === "function") {
                closeFuture = delegate.closeAsync();
            }

            return closeFuture.chain(function () {
                self.setSize(previousSize);
            });;
        };

        self.showAsync = function () {
            if (delegate && typeof delegate.showAsync === "function") {
                return delegate.showAsync();
            }
            return fulfilledFuture;
        };

        self.disposeAsync = function () {
            if (delegate && typeof delegate.disposeAsync === "function") {
                return delegate.disposeAsync();
            }
            return fulfilledFuture;
        };

        self.setDelegate = function (value) {
            delegate = value;
        };

        self.setName = function (name) {
            $name.text(name);
        };

        self.setConfig = function (value) {
            config = value;
        };

        self.maximize = function () {
            if (delegate && typeof delegate.maximize === "function") {
                $restore.removeClass("hide");
                $maximize.addClass("hide");
                self.disableResize();
                self.disableMove();
                return delegate.maximize();
            }
        };

        self.restore = function () {
            $restore.addClass("hide");
            $maximize.removeClass("hide");
            self.enableResize();
            self.enableMove();
            self.setSize(previousSize);
            self.centerAsync().try();
        };

        self.hideCloseButton = function () {
            $close.addClass("hide");
        };

        self.showCloseButton = function () {
            $close.removeClass("hide");
        };

        self.hideMaximizeButton = function () {
            $maximize.addClass("hide");
        };

        self.showMaximizeButton = function () {
            $maximize.removeClass("hide");
        };

        self.setMinSize = function (size) {
            if (typeof size.width !== "number" || typeof size.height !== "number" || size.width <= 0 || size.height <= 0) {
                throw new Error("Width and height need to be set to a number greater than 0.");
            }

            minSize = size;
        };

        self.setMaxSize = function (size) {
            if (typeof size.width !== "number" || typeof size.height !== "number" || size.width <= 0 || size.height <= 0) {
                throw new Error("Width and height need to be set to a number greater than 0.");
            }

            maxSize = size;
        };

        self.setSize = function (size) {
            if (typeof size.width !== "number" || typeof size.height !== "number" || size.width <= 0 || size.height <= 0) {
                throw new Error("Width and height need to be set to a number greater than 0.");
            }

            previousSize = size;
            delegate.setSize(size);
        };

        self.disableResize = function () {
            if ($resize.attr("enabled") != null) {
                $resize.off("mousedown", resizeMouseDown);
                $resize.removeAttr("enabled");
                $resize.addClass("hide");
            }

            self.hideMaximizeButton();
        };

        self.enableResize = function () {
            if ($resize.attr("enabled") == null) {
                $resize.on("mousedown", resizeMouseDown);
                $resize.attr("enabled", "enabled");
                $resize.removeClass("hide");
            }
            self.showMaximizeButton();
        };

        self.disableMove = function () {
            $handle.off("mousedown", mousedown);
        };

        self.enableMove = function () {
            // Ensure no double binding.
            $handle.off("mousedown", mousedown);
            $handle.on("mousedown", mousedown);
        };

        self.setColor = function (cssColor) {
            $handle.css("background-color", cssColor);
        };

        var mousemove = function (event) {
            var cursorDeltaX = event.pageX - windowMouseStartXY.x;
            var cursorDeltaY = event.pageY - windowMouseStartXY.y;

            lastCoords.left = cursorDeltaX + windowStartXY.x;
            lastCoords.top = cursorDeltaY + windowStartXY.y;

            $resizeBox.offset({
                top: lastCoords.top,
                left: lastCoords.left
            });
        };

        var mouseup = function (event) {
            $elem.css({
                top: lastCoords.top + "px",
                left: lastCoords.left + "px"
            });

            $resizeBox.addClass("hide");

            $resizeBox.css({
                top: 0,
                left: 0
            });

            $body.off("mousemove", mousemove);
            $body.off("mouseup", mouseup);
            $body.off("mouseleave", mouseup);

        };

        var mousedown = function (event) {
            $resizeBox.removeClass("hide");

            invokeMethodIfExists(delegate, "focus");

            windowMouseStartXY = {
                x: event.pageX,
                y: event.pageY
            };

            windowStartXY = $elem.region();

            lastCoords.left = windowStartXY.left;
            lastCoords.top = windowStartXY.top;

            $body.on("mousemove", mousemove);
            $body.on("mouseup", mouseup);
            $body.on("mouseleave", mouseup);
            return false;
        };

        $handle.on("mousedown", mousedown);

        var resizeMouseDown = function (event) {
            windowRegion = $elem.region();

            resizeMouseStartXY = {
                x: event.pageX,
                y: event.pageY
            };

            $resizeBox.css({
                "width": windowRegion.width + "px",
                "height": windowRegion.height + "px"
            });

            $body.on("mousemove", resizeMouseMove).
                on("mouseup", resizeMouseUp).
                on("mouseleave", resizeMouseUp);

            return false;

        };

        var resizeMouseMove = function (event) {
            var deltaX = event.pageX - resizeMouseStartXY.x;
            var deltaY = event.pageY - resizeMouseStartXY.y;

            var currentWidth = windowRegion.width + deltaX;
            var currentHeight = windowRegion.height + deltaY;

            currentWidth = currentWidth >= minSize.width ? currentWidth : minSize.width;
            currentHeight = currentHeight >= minSize.height ? currentHeight : minSize.height;

            $resizeBox.removeClass("hide");
            $resizeBox.css({
                "width": currentWidth + "px",
                "height": currentHeight + "px"
            });

            return false;
        };

        var resizeMouseUp = function () {
            $(document.body).off("mousemove", resizeMouseMove).
                off("mouseup", resizeMouseUp).
                off("mouseleave", resizeMouseUp);

            var resizeRegion = $resizeBox.region();

            self.setSize(resizeRegion);

            $resizeBox.addClass("hide");
            $resizeBox.css({
                width: "100%",
                height: "100%"
            });

            var controller = $(self.getComponent()).controller();
            if (controller) {
                invokeMethodIfExists(controller, "windowResize");
            }

            return false;
        };

        $close.on("mousedown", function () {
            invokeMethodIfExists(delegate, "focus");
            return false;
        });

        $close.on("click", function () {
            self.closeAsync().try();
        });

        $restore.on("mousedown", function () {
            invokeMethodIfExists(delegate, "focus");
            return false;
        });

        $restore.on("click", function () {
            self.restore();
        });

        $maximize.on("mousedown", function () {
            invokeMethodIfExists(delegate, "focus");
            return false;
        });

        $maximize.on("click", function () {
            self.maximize();
        });

        $elem.on("mousedown", function () {
            invokeMethodIfExists(delegate, "focus");
        });

        $resize.on("mousedown", resizeMouseDown);
    };
});