BASE.require([
    "jQuery",
    "Date.prototype.format",
    "BASE.collections.Hashmap",
    "Array.prototype.orderBy"
], function () {
    var Fulfillment = BASE.async.Fulfillment;
    var Hashmap = BASE.collections.Hashmap;
    var Future = BASE.async.Future;

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
                     expBuilder.property(startPropertyName).isLessThan(endDate),
                     expBuilder.property(startPropertyName).isGreaterThanOrEqualTo(startDate),
                     expBuilder.property(endPropertyName).isGreaterThanOrEqualTo(endDate)
                     ),
                 expBuilder.and(
                     expBuilder.property(startPropertyName).isLessThanOrEqualTo(startDate),
                     expBuilder.property(endPropertyName).isGreaterThanOrEqualTo(startDate),
                     expBuilder.property(endPropertyName).isLessThan(endDate)
                     ),
                 expBuilder.and(
                     expBuilder.property(startPropertyName).isGreaterThanOrEqualTo(startDate),
                     expBuilder.property(endPropertyName).isLessThan(endDate)
                     ),
                 expBuilder.and(
                     expBuilder.property(startPropertyName).isLessThanOrEqualTo(startDate),
                     expBuilder.property(endPropertyName).isGreaterThanOrEqualTo(endDate)
                     )
            )
        }).toArrayAsync();
    };

    BASE.namespace("components.gem.scheduler");

    components.gem.scheduler.MonthOverview = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var dates = [];
        var $displayDate = $(tags["display-date"]);
        var $select = $(tags["select"]);
        var $dates = $(tags["dates"]);
        var $previousMonth = $(tags["previous-month"]);
        var $nextMonth = $(tags["next-month"]);
        var $lastSelect = $();
        var todaysDate = new Date();
        var offset = 0;
        var year = todaysDate.getFullYear();
        var month = todaysDate.getMonth();
        var entityViewsByType = new Hashmap();
        var typeConfigByType = new Hashmap();
        var hiddenTypes = [];
        var slotTracker = [];

        services.set("typeConfigByType", typeConfigByType);

        var getEntityViewFuture = function (Type, viewComponent) {
            var entityViewFuture = Hashmap.get(Type);
            if (entityViewFuture == null) {
                entityViewFuture = services.get("windowService").createModalAsync({
                    componentName: viewComponent.name,
                    height: viewComponent.size && viewComponent.size.height || 500,
                    width: viewComponent.size && viewComponent.size.width || 800
                });
                entityViewsByType.add(Type, entityViewFuture);
            }
            return entityViewFuture;
        };

        var addRowToSlotTracker = function () {
            var row = [];

            for (var i = 0; i < 42; i++) {
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

        var getSlotIndex = function (dayOfTheMonth) {
            return (offset + dayOfTheMonth) - 1;
        };

        var getControllerForDate = function (dayOfTheMonth) {
            return dates[offset + dayOfTheMonth - 1].controller();
        };

        var getControllerByIndex = function (index) {
            return dates[index].controller();
        };

        var clearEvents = function () {
            for (var i = 0; i < 42; i++) {
                var dayThumbnailController = getControllerByIndex(i);
                dayThumbnailController.clearEvents();
            }
        };

        var clearDates = function () {
            Object.keys(dates).forEach(function (key) {
                getControllerByIndex(key).setDate(null);
            });
        };

        var getFirstDateOfMonth = function () {
            var firstDateOfMonth = new Date();
            firstDateOfMonth.setFullYear(year);
            firstDateOfMonth.setHours(0, 0, 0, 0);
            firstDateOfMonth.setMonth(month);
            firstDateOfMonth.setDate(1);

            return firstDateOfMonth;
        };

        var getLastDateOfMonth = function (firstDayOfMonth) {
            var lastDateOfMonth = new Date(year, month + 1, 0);

            return lastDateOfMonth;
        };

        var addEventToDayThumbnails = function (event) {
            var firstDayOfMonth = getFirstDateOfMonth();
            var lastDayOfMonth = getLastDateOfMonth();

            var startDate = new Date(event.startDate);
            var endDate = new Date(event.endDate);

            if (startDate < firstDayOfMonth) {
                startDate = firstDayOfMonth;
            }

            if (endDate > lastDayOfMonth) {
                endDate = lastDayOfMonth;
            }

            var startSlotIndex = getSlotIndex(startDate.getDate());
            var endSlotIndex = getSlotIndex(endDate.getDate());
            var totalEventLength = ((endSlotIndex - startSlotIndex) + 1);

            var traverseSlots = function (rowIndex, callBack) {
                var recursive = false;

                for (var i = 0; i < totalEventLength; i++) {
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
                var dayThumbnailController = getControllerForDate(startDate.getDate());
                activateSlot(rowIndex, slotIndex);

                if (slotIndex === startSlotIndex && rowIndex > 2) {
                    dayThumbnailController.addViewMoreEvents(rowIndex);
                } else if (slotIndex === startSlotIndex && rowIndex <= 2) {
                    var modifiedEventLength = totalEventLength;
                    var eventWeekStartDate = startDate;

                    while (modifiedEventLength !== 0) {
                        var eventCurrentWeekLength = null;
                        var weekRemainingLength = 7 - eventWeekStartDate.getDay();

                        if (weekRemainingLength < modifiedEventLength) {
                            eventCurrentWeekLength = weekRemainingLength;
                        } else {
                            eventCurrentWeekLength = modifiedEventLength;
                        }

                        dayThumbnailController.addEvent(event, eventCurrentWeekLength, rowIndex);
                        modifiedEventLength -= eventCurrentWeekLength;
                        eventWeekStartDate.setDate(eventWeekStartDate.getDate() + eventCurrentWeekLength);
                        dayThumbnailController = getControllerForDate(eventWeekStartDate.getDate());
                    }
                }

                return true;
            };

            var slotIndex = traverseSlots(0, checkIfSlotsAreInactive);

            traverseSlots(slotIndex, activateSlotsAndDrawEvent);
        };

        var redrawCalendar = function (year, month) {
            var date = new Date();
            date.setFullYear(year);
            date.setHours(0, 0, 0, 0);
            date.setMonth(month);
            date.setDate(1);

            clearDates();
            clearEvents();

            var startDate = new Date(date);

            month = date.getMonth();
            year = date.getFullYear();

            $displayDate.text(date.format("mmmm yyyy"));

            offset = date.getDay();

            var currentDate;

            do {
                currentDate = date.getDate();
                getControllerForDate(currentDate).setDate(new Date(date));
                date.setDate(currentDate + 1);
            } while (date.getDate() !== 1)

            var endDate = new Date(date);
            endDate.setMonth(endDate.getMonth());

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

                clearEvents();
                clearSlotTracker();

                events.forEach(function (event) {
                    addEventToDayThumbnails(event);
                });

            }).try();
        };

        var redrawCalendarByDate = function (date) {
            date.setFullYear(date.getFullYear());
            date.setMonth(date.getMonth());
            redrawCalendar(year, month);
        };

        var getDateThumbnailElements = function () {
            var elements = [];

            for (var x = 0; x < 42; x++) {
                elements.push($(tags[x]));
            }

            return elements;
        }

        self.init = function () {
            dates = getDateThumbnailElements();
        };

        self.prepareToActivateAsync = function () {
            self.redraw();
        };

        self.setYear = function (value) {
            year = value;
            redrawCalendar(value, month);
        };

        self.setMonth = function (value) {
            month = value;
            redrawCalendar(year, value);
        };

        self.registerType = function (typeConfig) {
            var config = new TypeConfig(typeConfig);
            typeConfigByType.add(typeConfig.Type, config);

            redrawCalendar(year, month);
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
            redrawCalendar(year, month);
        };

        $previousMonth.on("click", function () {
            self.setMonth(month - 1);
        });

        $nextMonth.on("click", function () {
            self.setMonth(month + 1);
        });

        $elem.on("eventChange", function () {
            redrawCalendar(year, month);
            return false;
        });

        $(window).on("resize", function () {
            self.redraw();
        });

    };

});