BASE.require([
		"jQuery",
        "BASE.async.delayAsync"
], function () {
    var Future = BASE.async.Future;
    var delayAsync = BASE.async.delayAsync;

    BASE.namespace("components.gem.forms");

    components.gem.forms.TableListItem = function (elem, tags, scope) {
        var self = this;
        var $elem = $(elem);
        var currentMappings = null;
        var currentConfig = null;
        var columns = {};
        var item = null;
        var index = null;
        var propertiesArray = [];
        var propertiesHash = {};
        var selectionFuture = Future.fromResult();

        var selectedState = function (isMultiselect) {
            state = deselectedState;
            $elem.removeClass("selected");
            $elem.trigger({
                type: "itemDeselected",
                entity: item,
                index: index,
                isMultiselect: isMultiselect
            });
        };

        var deselectedState = function (isMultiselect) {
            state = selectedState;
            $elem.addClass("selected");
            $elem.trigger({
                type: "itemSelected",
                entity: item,
                index: index,
                isMultiselect: isMultiselect
            });
        };

        var state = deselectedState;

        var createColumn = function (property) {
            var name = property.name;
            var width = property.width;
            var left = property.left;

            var $column = $("<div></div>");
            $column.css({
                boxSizing: "border-box",
                height: "40px",
                fontSize: "14px",
                lineHeight: "40px",
                width: width + "px",
                paddingLeft: "10px",
                position: "absolute",
                top: "0",
                left: left + "px"
            });

            $column.attr("name", name);
            $column.addClass("ellipsis");

            return $column;
        };

        self.setLoading = function () {
            Object.keys(columns).forEach(function (columnName) {
                columns[columnName].text("Loading...");
            });
        };

        self.setEntity = function (entity, newIndex) {
            item = entity;
            index = newIndex;

            Object.keys(columns).forEach(function (columnName) {
                var property = propertiesHash[columnName];
                var value = property.getValue(entity);
                var display = property.display(value);

                display = display.length > 100 ? display.substr(0, 100) : display;
                columns[columnName].text(display);
            });
        };

        self.setConfig = function (config) {
            if (currentConfig !== config || config.isUpdated) {
                currentConfig = config;
                propertiesArray = config.propertiesArray;
                propertiesHash = config.propertiesHash;

                $elem.empty();
                columns = config.propertiesArray.filter(function (property) {
                    return !property.isHidden;
                }).reduce(function (columns, property) {
                    var $column = createColumn(property);

                    columns[property.name] = $column;
                    $elem.append($column);

                    return columns;
                }, columns);
            }
        };

        self.select = function () {
            state = selectedState;
            $elem.addClass("selected");
        };

        self.deselect = function () {
            state = deselectedState;
            $elem.removeClass("selected");
        };

        $elem.on("click", function (event) {
            if ($elem.prop("clicked")) {

                selectionFuture.cancel();

                $elem.trigger({
                    type: "itemDoubleClicked",
                    entity: item,
                    index: index
                });

                $elem.prop("clicked", false);

                if (state === deselectedState) {
                    state(false);
                }

            } else {

                $elem.prop("clicked", true);
                selectionFuture = delayAsync(400).chain(function () {
                    $elem.prop("clicked", false);
                }).try();

                state(event.ctrlKey);

            }

            return false;
        });
    };
});