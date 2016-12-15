BASE.require([
    "jQuery",
    "BASE.web.animation.PercentageTimeline",
    "BASE.web.animation.ElementAnimation"
], function () {

    BASE.namespace("components.gem.scheduler");

    var PercentageTimeline = BASE.web.animation.PercentageTimeline;
    var ElementAnimation = BASE.web.animation.ElementAnimation;

    var createScaleAnimation = function (element) {
        var scaleAnimation = new ElementAnimation({
            target: element,
            properties: {
                scaleX: {
                    from: "0",
                    to: "1"
                },
                scaleY: {
                    from: "0",
                    to: "1"
                }
            },
            easing: "easeOutQuad"
        });

        var timeline = new PercentageTimeline(100);

        timeline.add({
            animation: scaleAnimation,
            startAt: 0,
            endAt: 1
        });

        return timeline;
    };

    var createFadeOutAnimation = function (element) {
        var fadeOutAnimation = new ElementAnimation({
            target: element,
            properties: {
                opacity: {
                    from: "1",
                    to: "0"
                }
            },
            easing: "easeOutQuad"
        });

        var timeline = new PercentageTimeline(90);

        timeline.add({
            animation: fadeOutAnimation,
            startAt: 0,
            endAt: 1
        });

        return timeline;
    };

    components.gem.scheduler.Checkbox = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $label = $(tags["label"]);
        var $checkedIcon = $(tags["checked-icon"]);
        var $uncheckedIcon = $(tags["unchecked-icon"]);

        var changeState = null;
        var scaleAnimation = createScaleAnimation($checkedIcon[0]);
        var fadeOutAnimation = createFadeOutAnimation($checkedIcon[0]);

        var checkboxStateMachine = {
            checked: function () {
                $checkedIcon.removeClass("scale-zero");
                scaleAnimation.seek(0).playToEndAsync().try();
                changeState = "unchecked";
            },
            unchecked: function () {
                $checkedIcon.removeClass("full-opaque");
                fadeOutAnimation.seek(0).playToEndAsync().chain(function () {
                    $checkedIcon.addClass("scale-zero full-opaque");
                }).try();
                changeState = "checked"
            }
        };

        var init = function () {
            var config = {
                label: $elem.attr("label"),
                color: $elem.attr("color")
            };

            self.setConfig(config);
            changeState = "unchecked";
        };

        self.setConfig = function (config) {
            var label = config.label || "";
            var color = config.color || "#424242";

            $label.text(label);
            $checkedIcon.css("color", color);
            $uncheckedIcon.css("color", color);
        };

        self.isChecked = function () {
            return changeState === "unchecked" ? true : false;
        };

        $elem.on("click", function () {
            checkboxStateMachine[changeState]();
        });

        init();
    };
});