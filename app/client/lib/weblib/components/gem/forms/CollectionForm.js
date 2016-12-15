BASE.require([
		"jQuery",
        "String.prototype.trim"
], function () {
    var Future = BASE.async.Future;

    var delegateInterface = [
        "search",
        "getProperties"
    ];

    var actionInterface = [
        "isActionable",
        "label",
        "callback"
    ];

    var implementsInterface = function (methodNames, obj) {
        return methodNames.every(function (methodName) {
            return typeof obj[methodName] === "function";
        });
    };

    BASE.namespace("components.gem.forms");

    components.gem.forms.CollectionForm = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $search = $(tags["search"]);
        var $searchArea = $(tags["search-area"]);
        var $actions = $(tags["actions"]);
        var $edit = $(tags["edit"]);
        var $add = $(tags["add"]);
        var $delete = $(tags["delete"]);
        var $table = $(tags["table"]);
        var table = $table.controller();
        var delegate = null;
        var orderBy = null;
        var actions = [];
        var buttonsByActionName = {};
        var entityViewFuture = null;

        var handleActionButtons = function (selectedItems) {
            var itemData = selectedItems.getValues();

            var items = itemData.map(function (itemData) {
                return itemData.entity;
            });

            actions.forEach(function (action) {
                if (action.isSeperator) {
                    return;
                }

                if (action.isActionable(items)) {
                    buttonsByActionName[action.label()].removeAttr("disabled");
                } else {
                    buttonsByActionName[action.label()].attr("disabled", "disabled");
                }
            });
        };

        var onSearch = function () {
            handleActionButtons(table.getSelectedItems());
        };

        var createActionButton = function (action) {
            var $button = $("<button></button>");
            $button.text(action.label());
            $button.addClass("gem-button");

            if (!action.isPrimary) {
                $button.addClass("secondary");
            }

            if (typeof action.callback === "function") {
                $button.on("click", function () {
                    var itemData = table.getSelectedItems().getValues();

                    var items = itemData.map(function (itemData) {
                        return itemData.entity;
                    });

                    action.callback(items, itemData, self);
                });
            }

            return $button;
        };

        var buildAndPlaceActionButtons = function (actions) {
            $actions.empty();
            buttonsByActionName = {};

            if (actions.length === 0) {
                $table.addClass("search-only")
                $searchArea.addClass("search-only")
            } else {
                $table.removeClass("search-only")
                $searchArea.removeClass("search-only")

                actions.forEach(function (action) {
                    if (action.isSeperator) {
                        var $p = $("<div class='gem-button-seperator'></div>");
                        $actions.append($p);
                    } else {
                        var isValidAction = implementsInterface(actionInterface, action);

                        if (!isValidAction) {
                            throw new Error("Invalid action it needs to implement all these methods." + actionInterface.join(", "));
                        }

                        var $button = createActionButton(action);
                        buttonsByActionName[action.label()] = $button;

                        var $p = $("<p></p>");
                        $p.append($button);
                        $actions.append($p);
                    }
                });
            }

        };

        self.setDelegate = function (value) {
            delegate = value;

            var isValidDelegate = implementsInterface(delegateInterface, value);

            if (!isValidDelegate) {
                throw new Error("Invalid delegate it needs to implement all these methods." + delegateInterface.join(", "));
            }

            actions = Array.isArray(delegate.actions) ? delegate.actions : [];
            delegate.onSearch = onSearch;

            delegate.orderBy = function (orderByAsc, orderByDesc) {
                self.searchAsync(undefined, orderByAsc, orderByDesc).try();
            };

            table.setDelegate(delegate);
            buildAndPlaceActionButtons(actions);

            self.searchAsync().try();
        };

        self.clearSelectedItems = function () {
            var selectedItems = table.getSelectedItems();
            selectedItems.clear();
            handleActionButtons(selectedItems);
            return table.redrawItems();
        };

        self.searchAsync = function (text, orderByAscending, orderByDescending) {
            if (typeof text !== "string") {
                text = $search.val();
            } else {
                $search.val(text);
            }

            orderByAscending = orderByAscending || table.getOrderAscendingColumns();
            orderByDescending = orderByDescending || table.getOrderDescendingColumns();

            if (typeof delegate.searchAsync === "function") {
                var futureArray = delegate.searchAsync(text, orderByAscending, orderByDescending);
                return table.setFutureArrayAsync(futureArray);
            } else {
                return table.setQueryableAsync(delegate.search(text, orderByAscending, orderByDescending));
            }

        };

        self.removeActions = function (actionNames) {
            var actions = this.actions.filter(function (action) {
                return actionNames.indexOf(actionName) === -1;
            });

            buildAndPlaceActionButtons(actions);
        };

        self.focusSearch = function () {
            $search.focus();
        };

        self.reloadItemAtIndex = function (index) {
            table.reloadItemAtIndex(index);
        };

        self.updateItemAtIndex = function (index, entity) {
            table.updateItemAtIndex(index, entity);
        };

        $elem.on("selectionChange", function (event) {
            var selectedItems = event.selectedItems;
            handleActionButtons(selectedItems);
        });

        $elem.on("itemDoubleClicked", function (event) {
            var item = event.entity;
            var listIndex = event.index;

            if (typeof delegate.select === "function") {
                delegate.select(item, listIndex);
            }

            return false;
        });

        $search.on("keyup", function () {
            self.searchAsync().try();
        });

    };
});