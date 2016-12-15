BASE.require([
    "jQuery",
    "BASE.web.animation.ElementAnimation",
    "BASE.web.animation.PercentageTimeline",
    "jQuery.fn.region"
], function () {

    BASE.namespace("app.components.material");

    var ElementAnimation = BASE.web.animation.ElementAnimation;
    var PercentageTimeline = BASE.web.animation.PercentageTimeline;

    var createRippleAnimation = function (ripple) {
        var rippleAnimation = new ElementAnimation({
            target: ripple,
            easing: "linear",
            properties: {
                "scaleX": {
                    from: 0,
                    to: 2
                },
                "scaleY": {
                    from: 0,
                    to: 2
                }
            }
        });

        var fadeOutAnimation = new ElementAnimation({
            target: ripple,
            easing: "linear",
            properties: {
                "opacity": {
                    from: .25,
                    to: 0
                }
            }
        });

        var timeline = new PercentageTimeline(450);

        timeline.add({
            animation: rippleAnimation,
            startAt: 0,
            endAt: .40
        })

        timeline.add({
            animation: fadeOutAnimation,
            startAt: .40,
            endAt: 1
        });

        return timeline;
    };

    app.components.material.FloatingActionButton = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $materialIcon = $(tags["material-icon"]);
        var $container = $(tags["container"]);
        var $ripple = null;

        var size = null;
        var rippleColor = null;
        var rippleAnimation = null;

        var createRippleElement = function () {
            $ripple = $("<div></div>");
            $ripple.css({
                "position": "absolute",
                "top": 0,
                "transform": "scale(0, 0)",
                "opacity": .25,
                "border-radius": "50%",
                "width": size + "px",
                "height": size + "px",
                "background-color": rippleColor,
                "z-index": 0
            });

            $container.append($ripple);
            rippleAnimation = createRippleAnimation($ripple[0]);
        };

        var init = function () {
            var config = {
                icon: $elem.attr("icon"),
                size: $elem.attr("size"),
                bgColor: $elem.attr("bg-color"),
                fontColor: $elem.attr("font-color"),
                rippleColor: $elem.attr("ripple-color")
            };

            self.setConfig(config);
        };

        self.setConfig = function (config) {
            var bgColor = config.bgColor || "#d23f31";
            var fontColor = config.fontColor || "#fff";
            size = config.size || 56;
            rippleColor = config.rippleColor || "#fff";

            $elem.css({
                "width": size + "px",
                "height": size + "px",
                "line-height": size + "px",
                "background-color": bgColor,
                "color": fontColor,
                "font-size": Math.floor(size / 2.15) + "px"
            });

            $materialIcon.html(config.icon);
        };

        $elem.on("touchstart mousedown", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            if (!$ripple) {
                createRippleElement();
            }

            var region = $elem.region();
            var pageX = evt.pageX || evt.originalEvent.touches[0].pageX;
            var pageY = evt.pageY || evt.originalEvent.touches[0].pageY;
            var x = pageX - region.left;
            var y = pageY - region.top;

            $ripple.css({
                top: (y - (size / 2)) + "px",
                left: (x - (size / 2)) + "px"
            });

            rippleAnimation.seek(0).playToPercentageAsync(45).try();
        });

        $elem.on("touchend mouseup mouseleave", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            if ($ripple) {
                rippleAnimation.playToEndAsync().chain(function () {
                    $ripple.css({
                        "opacity": .25,
                        "transform": "scale(0, 0)"
                    });
                }).try();
            }
        });

        init();
    };

});
