BASE.require([
		"jQuery",
        "BASE.collections.Hashmap",
        "components.material.animations.createFadeInAnimation",
        "components.material.animations.createFadeOutAnimation",
        "jQuery.fn.region",
        "Array.prototype.orderBy"
], function () {
    var Hashmap = BASE.collections.Hashmap;
    var Future = BASE.async.Future;
    var createFadeInAnimation = components.material.animations.createFadeInAnimation;
    var createFadeOutAnimation = components.material.animations.createFadeOutAnimation;
    var $body = $(document.body);

    BASE.namespace("components.gem.forms");

    components.gem.forms.CheckboxTable = function (elem, tags, scope) {
        var self = this;
        var $elem = $(elem);
        var $headers = $(tags["header"]);
        var $veil = $(tags["veil"]);
        var $headerContainer = $(tags["header-container"]);
        var $list = $(tags["list"]);
        var list = $list.controller();
        var layout = list.getLayout();
        var selectedItems = new Hashmap();
        var queryable = null;
        var delegate = null;
        var columns = null;
        var listItemConfig = null;
        var primaryKeys = ["id"];
        var propertiesArray = {};
        var propertiesHash = {};
        var headers = {};
        var columnWidths = {};

        var veilFadeInAnimation = createFadeInAnimation($veil[0], 200);
        var veilFadeOutAnimation = createFadeOutAnimation($veil[0], 200);

        var currentVeilAnimationFuture = Future.fromResult();
        var lastQueryableFuture = Future.fromResult();

        var createResizeHandle = function (headerName) {
            var startPosition = {
                x: 0,
                y: 0
            };

            var delta = {
                x: 0,
                y: 0
            };

            var handleStartRight = -12;

            var mouseMove = function (event) {
                delta.x = event.pageX - startPosition.x;
                delta.y = event.pageY - startPosition.y;

                $resizeHandle.css({
                    top: 0,
                    right: handleStartRight - delta.x
                });

                return false;
            };

            var mouseUp = function (event) {
                var $header = headers[headerName];
                var region = $header.region();
                var newWidth = region.width + delta.x;

                newWidth = newWidth > 50 ? newWidth : 50;

                propertiesHash[headerName].width = newWidth;
                updateColumns();
                updateHeaders();

                $body.off("mousemove", mouseMove);
                $body.off("mouseup", mouseUp);
                $body.off("mouseleave", mouseUp);

                $resizeBar.addClass("hide");
                $resizeHandle.css("right", "-12px")

                return false;
            };

            var mouseDown = function (event) {
                handleStartRight = parseInt($resizeHandle.css("right"), 10);

                startPosition.x = event.pageX;
                startPosition.y = event.pageY;
                delta.x = 0;
                delta.y = 0;

                $body.on("mousemove", mouseMove);
                $body.on("mouseup", mouseUp);
                $body.on("mouseleave", mouseUp);

                $resizeBar.removeClass("hide");

                return false;
            };

            var $resizeBar = $("<div></div>").css({
                width: "8px",
                position: "absolute",
                top: 0,
                left: "8px",
                height: "100%",
                backgroundColor: "#000",
                opacity: 0.3
            }).addClass("hide");

            var $resizeHandle = $("<div></div>").css({
                position: "absolute",
                top: 0,
                right: "-12px",
                width: "25px",
                height: "100%",
                zIndex: 1,
                cursor: "ew-resize"
            }).on("mousedown", mouseDown).append($resizeBar).on("click", function () {
                return false;
            });

            return $resizeHandle;
        };

        var createHeader = function (property, isSortable, isResizable) {
            var name = property.name;
            var label = property.label();
            var left = property.left;
            var width = property.width;

            var $header = $("<div></div>");
            var $label = $("<div></div>").text(label).css({
                paddingLeft: "10px"
            }).addClass("ellipsis").appendTo($header);

            var $icon = $("<i></i>").addClass("material-icons");
            $label.append($icon);

            if (isResizable) {
                var $resizeHandle = createResizeHandle(name);
                $header.append($resizeHandle);
            }

            $header.addClass("gem-column-headers");
            $header.css({
                boxSizing: "border-box",
                height: "40px",
                fontSize: "16px",
                lineHeight: "40px",
                width: width + "px",
                textAlign: "left",
                position: "absolute",
                top: "0",
                left: left + "px",
            });

            if (isSortable) {
                $header.on("click", function () {
                    var orderBy = $header.attr("order-by");
                    $headers.children().removeAttr("order-by");

                    if (orderBy === "asc") {
                        $header.attr("order-by", "desc");
                    } else {
                        $header.attr("order-by", "asc");
                    }

                    delegate.orderBy(self.getOrderAscendingColumns(), self.getOrderDescendingColumns());
                });

                if (typeof property.defaultOrderBy === "string") {
                    $header.attr("order-by", property.defaultOrderBy);
                }
            }

            return $header;
        };

        var createHeaders = function () {
            $headers.empty();
            return headers = propertiesArray.filter(function (property) {
                return !property.isHidden;
            }).reduce(function (headers, property) {
                var $header;
                var isCheckbox = property.name === "__checkbox__";

                $header = createHeader(property, !isCheckbox, !isCheckbox);
                headers[property.name] = $header;
                $headers.append($header);

                return headers;
            }, {});
        };

        var updateColumns = function () {
            var currentWidth = 0;

            propertiesArray.filter(function (property) {
                return !property.isHidden;
            }).forEach(function (property) {
                property.left = currentWidth;
                currentWidth += property.width;
            });

            list.getLayout().setWidth(currentWidth);
            $headers.css("width", currentWidth + "px");

            listItemConfig.isUpdated = true;
        };

        var showVeilAsync = function () {
            currentVeilAnimationFuture.cancel();
            return currentVeilAnimationFuture = veilFadeInAnimation.seek(0).playToEndAsync().chain(function () {
                $veil.removeClass("hide");
            });
        };

        var hideVeilAsync = function () {
            currentVeilAnimationFuture.cancel();
            return currentVeilAnimationFuture = veilFadeOutAnimation.seek(0).playToEndAsync().chain(function () {
                $veil.addClass("hide");
            });
        };

        var buildColumns = function () {
            updateColumns();
            createHeaders();
        };

        var updateHeaders = function () {
            propertiesArray.filter(function (property) {
                return !property.isHidden;
            }).forEach(function (column) {
                var $header = headers[column.name];
                $header.css({
                    left: column.left + "px",
                    width: column.width + "px"
                });
            });

            list.redrawItems(queryable);
        };

        var getPrimaryKeyProperties = function (propertiesArray) {
            return propertiesArray.filter(function (property) {
                return property.isPrimaryKey;
            }).map(function (property) {
                return property.name;
            });
        };

        var getKey = function (entity, keys) {
            var hasKeys = keys.every(function (key) {
                return entity[key] != null;
            });

            if (hasKeys) {
                return keys.map(function (key) {
                    return entity[key];
                }).join("|");
            }

            return null;
        };

        self.setDelegate = function (value) {
            delegate = value;

            propertiesArray = delegate.getProperties().orderBy(function (property) {
                return typeof property.sortOrder === "number" ? property.sortOrder : Infinity;
            });

            propertiesArray.unshift({
                name: "__checkbox__",
                label: function () {
                    return "";
                },
                search: function (queryable) {
                    return queryable;
                },
                width: 40
            });

            propertiesHash = propertiesArray.reduce(function (propertiesHash, property) {
                propertiesHash[property.name] = property;
                return propertiesHash;
            }, {});

            listItemConfig = {
                propertiesArray: propertiesArray,
                propertiesHash: propertiesHash,
                isUpdated: false
            };

            buildColumns();
            primaryKeys = getPrimaryKeyProperties(delegate.getProperties());

        };

        self.setFutureArrayAsync = function (futureArray) {

            lastQueryableFuture.cancel();

            if (typeof delegate.onSearch === "function") {
                delegate.onSearch();
            }

            return showVeilAsync().chain(function () {
                return futureArray.chain(function (results) {
                    return queryable = results.asQueryable();
                });
            }).chain(function (queryable) {
                return list.setQueryableAsync(queryable);
            }).chain(function () {
                return hideVeilAsync();
            });
        };

        self.setQueryableAsync = function (value) {
            queryable = value;

            lastQueryableFuture.cancel();

            if (typeof delegate.onSearch === "function") {
                delegate.onSearch();
            }

            return lastQueryableFuture = showVeilAsync().chain(function () {
                return list.setQueryableAsync(queryable);
            }).chain(function () {
                return hideVeilAsync();
            });
        };

        self.redrawItems = function () {
            return list.redrawItems();
        };

        self.getSelectedItems = function () {
            return selectedItems;
        };

        self.getOrderAscendingColumns = function () {
            var ascending = Object.keys(headers).filter(function (key) {
                $column = headers[key];
                return $column.attr("order-by") === "asc";
            });

            if (ascending.length > 1) {
                return [ascending[0]];
            }

            return ascending;
        };

        self.getOrderDescendingColumns = function () {
            var descending = Object.keys(headers).filter(function (key) {
                $column = headers[key];
                return $column.attr("order-by") === "desc";
            });

            if (descending.length > 1) {
                return [descending[0]];
            }

            return descending;
        };

        self.updateItemAtIndex = function (entity, index) {
            list.updateItemAtIndex(entity, index);
        };

        layout.prepareElement = function (element, item, index) {
            var controller = $(element).controller();

            controller.setConfig(listItemConfig);
            controller.setEntity(item, index);

            if (selectedItems.hasKey(getKey(item, primaryKeys)) || selectedItems.hasKey(item)) {
                controller.select();
            } else {
                controller.deselect();
            }
        };

        $elem.on("itemSelected", function (event) {
            var key = getKey(event.entity, primaryKeys);

            if (key == null) {
                selectedItems.add(event.entity, event.entity);
            } else {
                selectedItems.add(key, event.entity);
            }

            $elem.trigger({
                type: "selectionChange",
                selectedItems: selectedItems
            });

            $elem.trigger({
                type: "save-needed"
            });

            list.redrawItems();

            return false;
        });

        $elem.on("itemDeselected", function (event) {
            var key = getKey(event.entity, primaryKeys);

            if (key == null) {
                selectedItems.remove(event.entity);
            } else {
                selectedItems.remove(key);
            }

            $elem.trigger({
                type: "selectionChange",
                selectedItems: selectedItems
            });

            $elem.trigger({
                type: "save-needed"
            });

            list.redrawItems();

            return false;
        });

        $list.on("scroll", function () {
            $headerContainer.scrollLeft($list.scrollLeft());
        });

    };
});

