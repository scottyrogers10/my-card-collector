BASE.require([
    "jQuery",
    "jQuery.fn.region",
    "BASE.collections.Hashmap",
    "BASE.data.DataContext"
], function () {

    var Hashmap = BASE.collections.Hashmap;
    var DataContext = BASE.data.DataContext;
    var Future = BASE.async.Future;

    BASE.namespace("components.gem.scheduler");

    components.gem.scheduler.DayThumbnail = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);

        var currentDate = null;
        var editWindowsByType = new Hashmap();
        var eventSelectorFuture = null;
        var typeConfigByType = null;

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

        self.setDate = function (date) {
            var $dayOfTheMonth = $("<div></div>");

            $dayOfTheMonth.addClass("thumbnail-date");
            $elem.append($dayOfTheMonth);

            if (!(date instanceof Date) || date == null) {
                $dayOfTheMonth.text("");
                $elem.css("background-color", "#f9f9f9");
                currentDate = null;
            } else {
                $dayOfTheMonth.text(date.getDate());
                $elem.css({
                    "background-color": "",
                    "cursor": "pointer"
                });
                currentDate = date;
                currentDate.setHours(0, 0, 0, 0);
            }
        };

        self.addEvent = function (event, lengthOfEvent, rowIndex) {
            var $eventContainer = $("<div></div>");
            var $event = $("<div></div>");
            var $eventHover = $("<div></div>");
            var $deleteButton = $("<div></div>");
            var $deleteIcon = $("<div>&#xE5CD;</div>");

            var rowHeight = ($elem.height() - 25) / 3;
            var rowTopPosition = (rowIndex * rowHeight) + 25;
            var widthOfThumbnail = $elem.width();

            $eventContainer.attr("tag-index", currentDate.getDate() + "-" + rowIndex);
            $eventContainer.addClass("event-container ellipsis");
            $eventContainer.css({
                "height": rowHeight + "px",
                "line-height": ((rowHeight) - ((rowHeight / 7) * 2)) + "px",
                "padding-top": (rowHeight / 7) + "px",
                "padding-bottom": (rowHeight / 7) + "px",
                "top": rowTopPosition + "px",
                "left": "3px",
                "width": ((lengthOfEvent * widthOfThumbnail) - 3) + "px"
            });

            $event.addClass("event ellipsis");
            $event.css({
                "font-size": (rowHeight / 2.5) + "px",
                "background-color": event.color,
                "color": event.fontColor || "rgb(255,255,255)"
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

            $deleteIcon.addClass("material-icons");
            $deleteButton.addClass("delete-button hide");
            $deleteButton.css({
                "font-size": (rowHeight / 2.5) + "px"
            });

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

        self.addViewMoreEvents = function (rowIndex) {
            var $dropDown = $("<i class='material-icons'>&#xE5C5;</i>")
            var day = currentDate.getDate();
            var leftPosition = day < 10 ? 14 : 22;

            $dropDown.attr("title", "View All");
            $dropDown.addClass("tertiary-font");

            $dropDown.css({
                "font-size": "33px",
                "position": "absolute",
                "left": leftPosition + "px"
            });

            $elem.append($dropDown);

            $dropDown.on("click", function (e) {
                e.stopPropagation();

                $elem.trigger({
                    type: "viewMoreEventsClick",
                    currentDate: currentDate
                });
            });
        };

        self.clearEvents = function () {
            $elem.empty();
            self.setDate(currentDate);
        };

        $elem.on("click", function () {
            if ((currentDate instanceof Date) || currentDate !== null) {
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

                    entity[typeConfig.startPropertyName] = new Date(currentDate);
                    entity[typeConfig.endPropertyName] = new Date(currentDate);

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
            }
        });
    };

});