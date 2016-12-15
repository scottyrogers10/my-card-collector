BASE.require([
    "jQuery",
    "BASE.data.DataContext",
    "BASE.collections.Hashmap"
], function () {

    var DataContext = BASE.data.DataContext;
    var Hashmap = BASE.collections.Hashmap;
    var SLOT_WIDTH = 25;
    var ROW_HEIGHT = 44;

    BASE.namespace("components.gem.scheduler");

    components.gem.scheduler.HourThumbnail = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);

        var hour = null;
        var currentDate = null;
        var eventSelectorFuture = null;
        var editWindowsByType = new Hashmap();

        var getEventSelectorWindowByTypeAsync = function () {
            if (eventSelectorFuture == null) {
                return eventSelectorFuture = services.get("windowService").createModalAsync({
                    componentName: "gem-scheduler-event-type-selector",
                    height: 300,
                    width: 200
                });
            }

            return eventSelectorFuture;
        };

        var getEditWindowByTypeAsync = function (Type) {
            var entityFormFuture = editWindowsByType.get(Type);

            if (entityFormFuture == null) {
                return entityFormFuture = services.get("windowService").createModalAsync({
                    componentName: "gem-independent-entity-form",
                    height: 500,
                    width: 800
                });

                editWindowsByType.add(Type, entityFormFuture);
            }

            return entityFormFuture;
        };

        var getStartEventPosition = function (startDate, endDate, eventSpan) {
            var startHour = startDate.getHours();
            var endHour = new Date(endDate).getHours();
            var endMinute = endDate.getMinutes();

            if (endMinute === 0) {
                endHour -= 1;
            }

            if (eventSpan <= 4 && startHour === endHour) {
                return 0;
            } else {
                var minutes = startDate.getMinutes();
                var quarter = Math.floor(minutes / 15);

                return quarter * SLOT_WIDTH;
            }
        };

        var getEventWidth = function (eventSpan) {
            if (eventSpan <= 4) {
                return 99;
            } else {
                return (eventSpan * SLOT_WIDTH) - 1;
            }
        };

        var showEventHover = function () {
            this.addClass("hover-event");
        };

        var removeEventHover = function () {
            this.removeClass("hover-event");
        };

        var showDeleteButton = function ($deleteButton) {
            $deleteButton.removeClass("hide");
        };

        var hideDeleteButton = function ($deleteButton) {
            $deleteButton.addClass("hide");
        };

        self.addEvent = function (event, eventSpan, rowIndex) {
            var $eventContainer = $("<div></div>");
            var $event = $("<div></div>");
            var $eventHover = $("<div></div>");
            var $deleteButton = $("<div></div>");
            var $deleteIcon = $("<div>&#xE5CD;</div>");

            var rowTopPosition = rowIndex * ROW_HEIGHT;
            $eventContainer.addClass("event-container");
            $eventContainer.css({
                "top": rowTopPosition,
                "width": getEventWidth(eventSpan),
                "left": getStartEventPosition(event.startDate, event.endDate, eventSpan),
            });

            $event.addClass("event ellipsis");
            $event.css({
                "background-color": event.color,
                "color": event.fontColor || "rgb(255,255,255)"
            });

            $deleteButton.addClass("delete-button hide");
            $deleteIcon.addClass("material-icons");

            $eventContainer.append($event);
            $elem.append($eventContainer);
            $deleteButton.append($deleteIcon);
            $event.append($eventHover);
            $event.append($deleteButton);

            $deleteButton.on("click", function (e) {
                var typeDisplay = event.displayService.getDisplayByType(event.Type);
                var dataContext = new DataContext(event.displayService.service);
                var entity = dataContext.loadEntity(event.entity);

                e.stopPropagation();
                dataContext.removeEntity(entity);
                dataContext.saveChangesAsync().chain(function () {
                    $elem.trigger("eventChange");
                }).try();
            });

            var typeDisplay = event.displayService.getDisplayByType(event.Type);
            $eventHover.text(typeDisplay.displayInstance(event.entity));

            $eventHover.css({
                "width": "100%",
                "height": "100%",
                "position": "absolute",
                "left": 0,
                "top": 0
            });

            $event.on("mouseenter", function (e) {
                showEventHover.call($eventHover);
                showDeleteButton($deleteButton);
                e.stopPropagation();
            });

            $event.on("mouseleave", function () {
                removeEventHover.call($eventHover);
                hideDeleteButton($deleteButton);
            });

            $event.on("click", function (e) {
                var typeDisplay = event.displayService.getDisplayByType(event.Type);
                var dataContext = new DataContext(event.displayService.service);
                var entity = dataContext.loadEntity(event.entity);
                var window;

                e.stopPropagation();

                return getEditWindowByTypeAsync(event.Type).chain(function (windowManager) {
                    var controller = windowManager.controller;

                    window = windowManager.window;
                    windowManager.window.setName("Edit " + typeDisplay.labelInstance());

                    var future = controller.setConfigAsync({
                        entity: entity,
                        displayService: event.displayService
                    });

                    windowManager.window.showAsync().try();

                    return future;
                }).chain(function () {
                    return dataContext.saveChangesAsync();
                }).chain(function () {
                    $elem.trigger("eventChange");
                }).catch(function () {
                    console.log("ERROR");
                }).finally(function () {
                    dataContext.dispose();
                    window.closeAsync().try();
                }).try();

            });
        };

        self.setHour = function (value) {
            hour = value;
        };

        self.setDate = function (value) {
            currentDate = value;
        };

        self.clearEvents = function () {
            $elem.empty();
        };

        self.createNewEvent = function () {
            getEventSelectorWindowByTypeAsync().chain(function (windowManager) {
                var controller = windowManager.controller;
                var future = controller.setTypeConfigAsync(services.get("typeConfigByType"));

                windowManager.window.showAsync().try();

                return future;
            }).chain(function (typeConfig) {
                var entity = new typeConfig.Type();
                var typeDisplay = typeConfig.displayService.getDisplayByType(typeConfig.Type);
                var dataContext = new DataContext(typeConfig.displayService.service);
                dataContext.addEntity(entity);
                var window;

                var startDate = new Date(currentDate);
                startDate = startDate.setHours(hour, 0, 0, 0);
                startDate = new Date(startDate);

                var endDate = new Date(currentDate);
                endDate = endDate.setHours(hour, 0, 0, 0);
                endDate = new Date(endDate);

                entity[typeConfig.startPropertyName] = startDate;
                entity[typeConfig.endPropertyName] = endDate;

                return getEditWindowByTypeAsync(typeConfig.Type).chain(function (windowManager) {
                    var controller = windowManager.controller;

                    window = windowManager.window;
                    windowManager.window.setName("Edit " + typeDisplay.labelInstance());

                    var future = controller.setConfigAsync({
                        entity: entity,
                        displayService: typeConfig.displayService
                    });

                    windowManager.window.showAsync().try();

                    return future;
                }).chain(function () {
                    if (entity[typeConfig.startPropertyName].getTime() === entity[typeConfig.endPropertyName].getTime()) {
                        entity[typeConfig.startPropertyName].setHours(0, 0, 0, 0);
                        entity[typeConfig.endPropertyName].setHours(0, 0, 0, 0);
                    }
                    return dataContext.saveChangesAsync();
                }).chain(function () {
                    $elem.trigger("eventChange");
                }).catch(function () {
                    console.log("ERROR");
                }).finally(function () {
                    dataContext.dispose();
                    window.closeAsync().try();
                })
            }).try();
        };

        $elem.on("click", function () {
            self.createNewEvent();
        });

    };

});