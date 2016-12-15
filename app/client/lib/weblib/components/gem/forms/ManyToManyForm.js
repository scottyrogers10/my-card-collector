BASE.require([
		"jQuery",
        "Array.prototype.indexOfByFunction",
        "Array.prototype.empty"
], function () {
    var Future = BASE.async.Future;
    var Fulfillment = BASE.async.Fulfillment;

    BASE.namespace("components.gem.forms");

    components.gem.forms.ManyToManyForm = function (elem, tags, scope) {
        var self = this;
        var $elem = $(elem);
        var $cancel = $(tags["cancel"]);
        var $table = $(tags["table"]);
        var $search = $(tags["search"]);
        var table = $table.controller();
        var window = null;
        var fulfillment = null;
        var selectedItems = null;
        var delegate = null;
        var lastOrderBy = null;
        var entityArray = null;
        var entity = null;
        var primaryKeys = [];
        var parentPrimaryKey = "id";

        var search = function (orderByAsc, orderByDesc) {
            var search = $search.val();
            return table.setQueryableAsync(delegate.search(search, orderByAsc, orderByDesc)).try();
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

        self.setConfigAsync = function (config) {
            var displayService = config.displayService;
            var service = displayService.service;
            var Type = config.relationship.ofType;
            var typeDisplay = displayService.getDisplayByType(Type);
            var relationship = config.relationship;
            var edm = displayService.service.getEdm();
            var keys = edm.getPrimaryKeyProperties(Type).concat(edm.getAllKeyProperties(Type));

            entity = config.entity;
            primaryKeys = edm.getPrimaryKeyProperties(Type);
            parentPrimaryKey = edm.getPrimaryKeyProperties(entity.constructor)[0];

            var queryable = displayService.service.asQueryable(Type);

            entityArray = entity[relationship.hasMany];

            delegate = {};
            delegate.actions = [];

            delegate.getProperties = function () {
                return BASE.clone(typeDisplay.listProperties, true);
            };

            delegate.search = function (text, orderByAsc, orderByDesc) {
                return typeDisplay.search(queryable, text, orderByAsc, orderByDesc);
            };

            delegate.orderBy = function (orderByAsc, orderByDesc) {
                self.searchAsync(undefined, orderByAsc, orderByDesc).try();
            };

            if (typeof typeDisplay.searchAsync === "function") {
                delegate.searchAsync = function () {
                    return typeDisplay.searchAsync.apply(typeDisplay, arguments);
                };
            }

            table.setDelegate(delegate);
            self.searchAsync().try();

            return entityArray.asQueryable().toArray().chain(function (array) {
                selectedItems.clear();

                array.forEach(function (item) {
                    var id = getKey(item, primaryKeys);

                    selectedItems.add(id, item);
                });

                return table.redrawItems();
            });
        };

        self.validateAsync = function () {
            return Future.fromResult();
        };

        self.saveAsync = function () {
            var values = selectedItems.getValues();
            var id;

            if (entity[parentPrimaryKey] == null) {

                entityArray.empty();
                values.forEach(function (item) {
                    entityArray.push(item);
                });

            } else {
                values.forEach(function (item) {
                    var index = entityArray.indexOfByFunction(function (entity) {
                        return getKey(item, primaryKeys) === getKey(entity, primaryKeys);
                    });

                    if (index === -1) {
                        entityArray.push(item);
                    }
                });


                for (var x = 0 ; x < entityArray.length ; x++) {
                    id = getKey(entityArray[x], primaryKeys);

                    if (!selectedItems.hasKey(id)) {
                        entityArray.splice(x, 1);
                        x--;
                    };
                }
            }

            return Future.fromResult();
        };


        self.searchAsync = function (text) {
            if (!text) {
                text = $search.val();
            } else {
                $search.val(text);
            }

            return table.setQueryableAsync(delegate.search(text, table.getOrderAscendingColumns(), table.getOrderDescendingColumns()));
        };

        $search.on("keyup", function () {
            search(table.getOrderAscendingColumns(), table.getOrderDescendingColumns());
        });

        $search.on("keydown", function (event) {
            if (event.which === 13) {
                return false;
            }
        });

        selectedItems = table.getSelectedItems();
    };
});