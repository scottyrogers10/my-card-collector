BASE.require([
		"jQuery"
], function () {
    var Future = BASE.async.Future;
    var Fulfillment = BASE.async.Fulfillment;

    BASE.namespace("components.gem.forms");

    components.gem.forms.ManyToManyHistorical = function (elem, tags, scope) {
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
        var mappingType = null;
        var mappingPropertyName = null;

        var search = function (orderByAsc, orderByDesc) {
            var search = $search.val();
            return table.setQueryableAsync(delegate.search(search, orderByAsc, orderByDesc)).try();
        };

        self.setConfigAsync = function (config) {
            var displayService = config.displayService;
            var service = displayService.service;
            var Type = config.targetType;
            var typeDisplay = displayService.getDisplayByType(Type);
            var relationship = config.relationship;
            var edm = displayService.service.getEdm();
            var keys = edm.getPrimaryKeyProperties(Type).concat(edm.getAllKeyProperties(Type));
            var entity = config.entity;
            var primaryKey = edm.getPrimaryKeyProperties(Type)[0];
            var queryable = displayService.service.asQueryable(Type);

            mappingType = config.mappingType;
            mappingPropertyName = config.mappingPropertyName;
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

            return entityArray.asQueryable().where(function (expBuilder) {
                return expBuilder.property("isExpired").isEqualTo(false);
            }).toArray().chain(function (array) {
                selectedItems.clear();

                array.forEach(function (item) {
                    selectedItems.add(item[mappingPropertyName], item);
                });

                return table.redrawItems();
            });
        };

        self.validateAsync = function () {
            return Future.fromResult();
        };

        self.saveAsync = function () {
            var keys = selectedItems.getKeys();
            var values = selectedItems.getValues();

            keys.forEach(function (key) {
                var item = selectedItems.get(key);

                if (!(item instanceof mappingType)) {

                    // check the entityArray if it has this reference already.
                    // If not create one and add it to the hash.
                    var entity = entityArray.filter(function (entity) {
                        return entity[mappingPropertyName] === key;
                    })[0];

                    if (entity == null) {
                        entity = new mappingType();
                        entity[mappingPropertyName] = key;
                        entity.startDate = new Date();
                    }

                    selectedItems.add(key, entity);
                }
            });

            values = selectedItems.getValues();

            values.forEach(function (item) {
                var index = entityArray.indexOf(item);

                if (index === -1) {
                    entityArray.push(item);
                }
            });

            entityArray.forEach(function (item) {
                var index = values.indexOf(item);

                if (index === -1) {
                    item.endDate = new Date();
                }
            });


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