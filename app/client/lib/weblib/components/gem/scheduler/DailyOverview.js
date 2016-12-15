BASE.require([
    "jQuery",
    "Date.prototype.format",
    "BASE.collections.Hashmap",
    "BASE.async.Future",
    "Array.prototype.orderBy"
], function () {

    var Future = BASE.async.Future;
    var Fulfillment = BASE.async.Fulfillment;
    var Hashmap = BASE.collections.Hashmap;

    var HOUR_COLUMN_WIDTH = 100;
    var ROW_HEIGHT = 44;

    var weekdayStrings = ["Sunday", "Monday", "Tuesday", "Wednesday",
                          "Thursday", "Friday", "Saturday"];

    var isValidDate = function (date) {
        return date instanceof Date && !isNaN(date.getTime());
    };

    var TypeConfig = function (typeConfig) {
        if (typeConfig.Type == null ||
            typeConfig.displayService == null ||
            typeConfig.startPropertyName == null ||
            typeConfig.endPropertyName == null ||
            typeConfig.color == null) {
            throw new Error("typeConfig needs to have these properties: Type, displayService, startPropertyName, endPropertyName, color.");
        }

        this.Type = typeConfig.Type;
        this.color = typeConfig.color;
        this.displayService = typeConfig.displayService;
        this.startPropertyName = typeConfig.startPropertyName;
        this.endPropertyName = typeConfig.endPropertyName;
        this.service = typeConfig.displayService.service;
        this.fontColor = typeConfig.fontColor;
    };

    TypeConfig.prototype.getEventsAsync = function (startDate, endDate) {
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            throw new Error("startDate and endDate need to be valid date.");
        }

        var startPropertyName = this.startPropertyName;
        var endPropertyName = this.endPropertyName;

        return this.service.asQueryable(this.Type).where(function (expBuilder) {
            return expBuilder.or(
                expBuilder.and(
                    expBuilder.property(endPropertyName).isGreaterThanOrEqualTo(startDate),
                    expBuilder.property(endPropertyName).isLessThan(endDate)
                    ),
                expBuilder.and(
                    expBuilder.property(startPropertyName).isGreaterThanOrEqualTo(startDate),
                    expBuilder.property(endPropertyName).isLessThan(endDate)
                    ),
                expBuilder.and(
                expBuilder.property(startPropertyName).isLessThan(startDate),
                expBuilder.property(endPropertyName).isGreaterThanOrEqualTo(endDate)
                ),
                expBuilder.and(
                    expBuilder.property(startPropertyName).isGreaterThanOrEqualTo(startDate),
                    expBuilder.property(startPropertyName).isLessThan(endDate)
                )
           )
        }).toArrayAsync();
    };

    BASE.namespace("components.gem.scheduler");

    components.gem.scheduler.DailyOverview = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $displayMonthAndYear = $(tags["display-month-and-year"]);
        var $displayWeekday = $(tags["display-weekday"]);
        var $displayDate = $(tags["display-date"]);
        var $previousDay = $(tags["previous-day"]);
        var $nextDay = $(tags["next-day"]);
        var $eventsContainer = $(tags["events-container"]);
        var $timesContainer = $(tags["times-container"]);
        var $slotContainer = $(tags["slot-container"]);

        var dayOfWeek = null;
        var selectedDate = new Date();
        var year = selectedDate.getFullYear();
        var month = selectedDate.getMonth();
        var day = selectedDate.getDate();
        var typeConfigByType = new Hashmap();
        var hiddenTypes = [];
        var hourElements = [];
        var slotTracker = [];
        var tallestRowIndex = 0;

        var getControllerForHourElement = function (hour) {
            return hourElements[hour].controller();
        };

        var addRowToSlotTracker = function () {
            var row = [];

            for (var i = 0; i < 192; i++) {
                row[i] = "inactive";
            }

            slotTracker.push(row);
        };

        var clearSlotTracker = function () {
            slotTracker = [];
        };

        var activateSlot = function (rowIndex, slotIndex) {
            slotTracker[rowIndex][slotIndex] = "active";
        };

        var isSlotActive = function (rowIndex, slotIndex) {
            return slotTracker[rowIndex][slotIndex] === "active";
        };

        var slotTrackerHasRowIndex = function (rowIndex) {
            return slotTracker[rowIndex];
        };

        var clearEvents = function () {
            for (var i = 0; i < 24; i++) {
                var hourThumbnailController = getControllerForHourElement(i);
                hourThumbnailController.clearEvents();
            }

            tallestRowIndex = 0;
        };

        var getSlotIndex = function (hour, minutes) {
            var quarter = Math.floor(minutes / 15);
            var index = ((hour + 1) * 4) - (4 - quarter);

            return index;
        };

        var addEventToHourThumbnails = function (event) {
            var startDate = new Date(event.startDate);
            var startHour = startDate.getHours();
            var startMinutes = startDate.getMinutes();

            var endDate = new Date(event.endDate);
            var endHour = endDate.getHours();
            var endMinutes = endDate.getMinutes();

            var tempStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            var tempEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            var selectedDate = new Date(year, month, day);

            if (tempStartDate.getTime() !== selectedDate.getTime()) {
                startHour = 0;
                startMinutes = 0;
            }

            if (tempEndDate.getTime() !== selectedDate.getTime()) {
                endHour = 24;
                endMinutes = 0;
            }

            if (startHour === endHour && startMinutes === endMinutes) {
                startHour = 0;
                startMinutes = 0;
                endHour = 24;
                endMinutes = 0;
            }

            var startSlotIndex = getSlotIndex(startHour, startMinutes);
            var endSlotIndex = getSlotIndex(endHour, endMinutes) - 1;

            var eventSpan = ((endSlotIndex - startSlotIndex) + 1);

            if (eventSpan < 4) {
                eventSpan = 4;
            }

            var traverseSlots = function (rowIndex, callBack) {
                var recursive = false;

                for (var i = 0; i < eventSpan; i++) {
                    var slotIndex = (startSlotIndex + i);
                    var continueLoop = callBack(rowIndex, slotIndex);

                    if (!continueLoop) {
                        recursive = true;
                        break;
                    }
                }

                if (recursive) {
                    var increasedRowIndex = rowIndex + 1;
                    return traverseSlots(increasedRowIndex, checkIfSlotsAreInactive);
                }

                return rowIndex;
            };

            var checkIfSlotsAreInactive = function (rowIndex, slotIndex) {
                if (!slotTrackerHasRowIndex(rowIndex)) {
                    addRowToSlotTracker();
                }

                if (isSlotActive(rowIndex, slotIndex)) {
                    return false;
                }

                return true;
            };

            var activateSlotsAndDrawEvent = function (rowIndex, slotIndex) {
                activateSlot(rowIndex, slotIndex);

                if (slotIndex === startSlotIndex) {
                    if (rowIndex > tallestRowIndex) {
                        tallestRowIndex = rowIndex;
                        $slotContainer.css("height", "100%");
                        
                        if ($slotContainer.height() < (tallestRowIndex + 1) * ROW_HEIGHT) {
                            $slotContainer.css("height", (tallestRowIndex + 1) * ROW_HEIGHT);
                        }
                    }

                    var hourThumbnailController = getControllerForHourElement(startHour);
                    hourThumbnailController.addEvent(event, eventSpan, rowIndex);
                }

                return true;
            };

            var slotIndex = traverseSlots(0, checkIfSlotsAreInactive);

            traverseSlots(slotIndex, activateSlotsAndDrawEvent);
        };

        var redrawDailyView = function (year, month, day) {
            var date = new Date();
            date.setFullYear(year);
            date.setHours(0, 0, 0, 0);
            date.setMonth(month);
            date.setDate(day);
            dayOfWeek = date.getDay();

            year = date.getFullYear();
            month = date.getMonth()
            day = date.getDate();

            $displayMonthAndYear.text(date.format("mmmm yyyy"));
            $displayWeekday.text(weekdayStrings[dayOfWeek]);
            $displayDate.text(day);

            setDateThumbnailValue(date);

            var startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            var endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            var results = typeConfigByType.getValues().filter(function (config) {
                return hiddenTypes.indexOf(config.Type) === -1;
            }).map(function (config) {
                return config.getEventsAsync(startDate, endDate).chain(function (results) {
                    return {
                        config: config,
                        results: results
                    };
                });
            });

            Future.all(results).chain(function (allEventTypes) {
                var events = allEventTypes.reduce(function (accumulator, typeData) {
                    var results = typeData.results;
                    var config = typeData.config;

                    return accumulator.concat(results.map(function (entity) {
                        return {
                            Type: config.Type,
                            entity: entity,
                            startDate: entity[config.startPropertyName],
                            endDate: entity[config.endPropertyName],
                            displayService: config.displayService,
                            color: config.color,
                            fontColor: config.fontColor
                        }
                    }));
                }, []).orderBy(function (event) {
                    return event.startDate.getTime() + (event.startDate.getTime() - event.endDate.getTime());
                });

                clearSlotTracker();
                clearEvents();

                events.forEach(function (event) {
                    addEventToHourThumbnails(event);
                });
            }).try();

        };

        var getHourThumbnailElements = function () {
            var elements = [];

            for (var i = 0; i < 24; i++) {
                elements.push($(tags[i]));
            }

            return elements;
        };

        var setHourThumbnailValue = function () {
            var hour = 0;

            Object.keys(hourElements).forEach(function (key) {
                var controller = hourElements[key].controller();
                controller.setHour(hour);
                hour++;
            });
        };

        var setDateThumbnailValue = function (date) {
            Object.keys(hourElements).forEach(function (key) {
                var controller = hourElements[key].controller();
                controller.setDate(date);
            });
        };

        var setLiveScrollPosition = function () {
            var liveTime = new Date();
            var liveHour = liveTime.getHours();
            var scrollPosition = liveHour * HOUR_COLUMN_WIDTH;

            $eventsContainer.scrollLeft(scrollPosition);
        };

        var setHourTimeHeaderClickEvents = function () {
            var $elements = [];

            for (var i = 0; i < 24; i++) {
                $elements.push($(tags[i + "-time-header"]));
            }

            $elements.forEach(function ($element, index) {
                $element.on("click", function () {
                    var hourThumbnailController = getControllerForHourElement(index);
                    hourThumbnailController.createNewEvent();
                });
            });
        };

        self.init = function () {
            hourElements = getHourThumbnailElements();
            setHourThumbnailValue();
            setHourTimeHeaderClickEvents();
        };

        self.prepareToActivateAsync = function () {
            self.redraw();
            setLiveScrollPosition();
        };

        self.setYear = function (value) {
            year = value;
            redrawDailyView(value, month, day);
        };

        self.setMonth = function (value) {
            month = value;
            redrawDailyView(year, value, day);
        };

        self.setDay = function (value) {
            day = value;
            redrawDailyView(year, month, value);
        };

        self.setCurrentDate = function (date) {
            selectedDate = date;
            year = selectedDate.getFullYear();
            month = selectedDate.getMonth();
            day = selectedDate.getDate();

            redrawDailyView(year, month, day);
        };

        self.registerType = function (typeConfig) {
            var config = new TypeConfig(typeConfig);
            typeConfigByType.add(typeConfig.Type, config);

            redrawDailyView(year, month, day);
        };

        self.hideType = function (Type) {
            if (typeConfigByType.hasKey(Type)) {
                hiddenTypes.push(Type);
            }
        };

        self.showType = function (Type) {
            if (typeConfigByType.hasKey(Type)) {
                var index = hiddenTypes.indexOf(Type);
                if (index >= 0) {
                    hiddenTypes.splice(index, 1);
                }
            }
        };

        self.redraw = function () {
            redrawDailyView(year, month, day);
        };

        $elem.on("selectedDate", function (options) {
            self.setCurrentDate(options.selectedDate);
        });

        $previousDay.on("click", function () {
            self.setDay(day - 1);

            $elem.trigger({
                type: "selectedDate",
                selectedDate: new Date(year, month, day)
            });
        });

        $nextDay.on("click", function () {
            self.setDay(day + 1);

            $elem.trigger({
                type: "selectedDate",
                selectedDate: new Date(year, month, day)
            });
        });

        $eventsContainer.on("scroll", function (e) {
            var scrollPosition = $(this).scrollLeft();
            $timesContainer.scrollLeft(scrollPosition);
        });

        $elem.on("eventChange", function () {
            redrawDailyView(year, month, day);
            return false;
        });

        $(window).on("resize", function () {
            self.redraw();
        });

    };

});