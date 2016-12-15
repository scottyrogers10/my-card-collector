BASE.require([
    "jQuery",
    "BASE.web.animation.PercentageTimeline",
    "BASE.web.animation.ElementAnimation"
], function () {

    BASE.namespace("app.components.animations");

    var PercentageTimeline = BASE.web.animation.PercentageTimeline;
    var ElementAnimation = BASE.web.animation.ElementAnimation;

    app.components.animations.FadeOutElement = function () {
        var self = this;

        self.createAnimation = function (element, duration) {
            var animation = new ElementAnimation({
                target: element,
                easing: "linear",
                properties: {
                    opacity: {
                        from: 1,
                        to: 0
                    }
                }
            });

            var timeline = new PercentageTimeline(duration);

            timeline.add({
                animation: animation,
                startAt: 0,
                endAt: 1
            });

            return timeline;
        };

    };

});
