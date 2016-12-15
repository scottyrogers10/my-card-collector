BASE.require([
    "jQuery",
    "BASE.web.animation.ElementAnimation",
    "BASE.web.animation.PercentageTimeline"
], function () {

    BASE.namespace("app.components.material");

    var ElementAnimation = BASE.web.animation.ElementAnimation;
    var PercentageTimeline = BASE.web.animation.PercentageTimeline;

    var createFocusLineAnimation = function (focusLineElement) {
        var focusLineAnimation = new ElementAnimation({
            target: focusLineElement,
            easing: "linear",
            properties: {
                scaleX: {
                    from: 0,
                    to: 1
                }
            }
        });

        var timeline = new PercentageTimeline(200);

        timeline.add({
            animation: focusLineAnimation,
            startAt: 0,
            endAt: 1
        });

        return timeline;
    };

    app.components.material.TextInput = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $input = $(tags["input"]);
        var $inputLabel = $(tags["input-label"]);
        var $focusedLine = $(tags["focused-line"]);

        var focusLabelColor = null;
        var focusBorderBottomColor = null;
        var focusLineAnimation = createFocusLineAnimation($focusedLine[0]);

        var init = function () {
            var config = {
                label: $elem.attr("label"),
                placeHolder: $elem.attr("place-holder"),
                focusColor: $elem.attr("focus-color")
            };

            self.setConfig(config);
        };

        self.setConfig = function (config) {
            var label = config.label || "";
            var placeHolder = config.placeHolder || "";
            focusLabelColor = config.focusColor || "#949494";
            focusBorderBottomColor = config.focusColor || "#eee";

            $inputLabel.text(label);
            $input.attr("placeHolder", placeHolder);
            $focusedLine.css("background-color", focusBorderBottomColor);
        };

        self.resetInput = function () {
            $input.val("");
        };

        self.getValue = function () {
            return $input.val();
        };

        $inputLabel.on("click", function () {
            $input.trigger("focus");
        });

        $input.on("focus", function () {
            $inputLabel.css({
                "color": focusLabelColor
            });

            focusLineAnimation.seek(0).playToEndAsync().try();
        });

        $input.on("blur", function () {
            $inputLabel.css({
                "color": "#949494"
            });

            $focusedLine.css("transform", "scaleX(0)");
        });

        init();
    };

});