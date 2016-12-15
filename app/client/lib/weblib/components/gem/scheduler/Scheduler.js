BASE.require([
    "jQuery",
    "Date.prototype.format",
    "BASE.web.animation.ElementAnimation",
    "BASE.web.animation.PercentageTimeline"
], function () {
    var Fulfillment = BASE.async.Fulfillment;
    var ElementAnimation = BASE.web.animation.ElementAnimation;
    var PercentageTimeline = BASE.web.animation.PercentageTimeline;
    var Future = BASE.async.Future;

    var createHideDateAnimation = function (dateElement, eventElement) {

        var dateElementAnimation = new ElementAnimation({
            target: dateElement,
            properties: {
                height: {
                    from: "300px",
                    to: "0px"
                }
            },
            easing: "easeOutExpo"
        });

        var eventElementAnimation = new ElementAnimation({
            target: eventElement,
            properties: {
                top: {
                    from: "300px",
                    to: "0px"
                }
            },
            easing: "easeOutExpo"
        });

        var timeline = new PercentageTimeline(500);

        timeline.add({
            animation: dateElementAnimation,
            startAt: 0,
            endAt: 1
        }, {
            animation: eventElementAnimation,
            startAt: 0,
            endAt: 1
        });

        return timeline;
    };

    var createShowDateAnimation = function (dateElement, eventElement) {

        var dateElementAnimation = new ElementAnimation({
            target: dateElement,
            properties: {
                height: {
                    from: "0px",
                    to: "300px"
                }
            },
            easing: "easeOutExpo"
        });

        var eventElementAnimation = new ElementAnimation({
            target: eventElement,
            properties: {
                top: {
                    from: "0px",
                    to: "300px"
                }
            },
            easing: "easeOutExpo"
        });

        var timeline = new PercentageTimeline(500);

        timeline.add({
            animation: dateElementAnimation,
            startAt: 0,
            endAt: 1
        }, {
            animation: eventElementAnimation,
            startAt: 0,
            endAt: 1
        });

        return timeline;
    };

    BASE.namespace("components.gem.scheduler");

    components.gem.scheduler.Scheduler = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $dayButton = $(tags["day-button"]);
        var $events = $(tags["events"]);
        var $monthButton = $(tags["month-button"]);
        var monthOverview = $(tags["month-overview"]).controller();
        var dailyOverview = $(tags["daily-overview"]).controller();
        var overviewStateManager = $(tags["overview-state-manager"]).controller();
        var sidebarCalendarController = $(tags["sidebar-calendar"]).controller();
        var eventSelector = $(tags["event-selector"]).controller();
        var hideDateAnimation = createHideDateAnimation(tags["sidebar-calendar"], tags["event-selector"]);
        var showDateAnimation = createShowDateAnimation(tags["sidebar-calendar"], tags["event-selector"]);
        var currentState = monthOverview;
        var types = [];

        var createTypeElementAsync = function (typeConfig) {
            var typeDisplay = typeConfig.displayService.getDisplayByType(typeConfig.Type);
            var label = typeDisplay.labelInstance();
            var color = typeConfig.color;

            var $div = $("<div></div>");
            $div.attr({
                "component": "gem-scheduler-checkbox",
                "label": label,
                "color": color
            });

            return BASE.web.components.loadAsync($div[0]);
        };

        var makeTypeCheckbox = function (typeConfig) {
            createTypeElementAsync(typeConfig).then(function (checkbox) {
                var $checkbox = $(checkbox);
                var checkboxController = $checkbox.controller();
                var $div = $("<div></div>");

                $div.append($checkbox);
                $events.append($div);

                $checkbox.on("click", function () {
                    if (checkboxController.isChecked()) {
                        monthOverview.showType(typeConfig.Type);
                        dailyOverview.showType(typeConfig.Type);
                    } else {
                        monthOverview.hideType(typeConfig.Type);
                        dailyOverview.hideType(typeConfig.Type);
                    }

                    monthOverview.redraw();
                    dailyOverview.redraw();

                    return false;
                });
            }).try();
        };

        self.setYear = function (value) {
            currentState.setYear(value);
        };

        self.setMonth = function (value) {
            currentState.setMonth(value);
        };

        self.registerType = function (typeConfig) {
            types.push(typeConfig.Type);
            makeTypeCheckbox(typeConfig);

            monthOverview.registerType(typeConfig);
            dailyOverview.registerType(typeConfig);
        };

        self.goToMonthOverviewAsync = function () {
            $dayButton.removeClass("selected secondary-background");
            $monthButton.addClass("selected secondary-background");

            if (currentState == dailyOverview) {
                currentState = monthOverview;

                return Future.all([
                    overviewStateManager.replaceAsync("month-overview"),
                    hideDateAnimation.seek(0).playToEndAsync()
                ]);
            } else {
                return Future.fromResult();
            }
        };

        self.goToDailyOverviewAsync = function () {
            $dayButton.addClass("selected secondary-background");
            $monthButton.removeClass("selected secondary-background");

            if (currentState == monthOverview) {
                currentState = dailyOverview;

                return Future.all([
                    overviewStateManager.replaceAsync("daily-overview"),
                    showDateAnimation.seek(0).playToEndAsync()
                ]);
            } else {
                return Future.fromResult();
            }
            
        };

        self.redraw = function () {
            currentState.redraw();
        };

        overviewStateManager.pushAsync("month-overview").try();

        $dayButton.on("click", function () {
            self.goToDailyOverviewAsync().try()
        });

        $monthButton.on("click", function () {
            self.goToMonthOverviewAsync().try()
        });

        $elem.on("selectedDate", function (options) {
            dailyOverview.setCurrentDate(options.selectedDate);
            sidebarCalendarController.redraw(options);
        });

        $elem.on("viewMoreEventsClick", function (e) {
            dailyOverview.setCurrentDate(e.currentDate);
            self.goToDailyOverviewAsync().try();
        });

        window.scheduler = this;

    };

});