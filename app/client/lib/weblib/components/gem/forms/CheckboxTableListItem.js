BASE.require([
		"jQuery",
        "BASE.async.delayAsync"
], function () {
    var Future = BASE.async.Future;
    var delayAsync = BASE.async.delayAsync;

    BASE.namespace("components.gem.forms");

    components.gem.forms.CheckboxTableListItem = function (elem, tags, scope) {
        var self = this;
        var $elem = $(elem);
        var currentMappings = null;
        var currentConfig = null;
        var columns = {};
        var item = null;
        var propertiesArray = [];
        var propertiesHash = {};
        var selectionFuture = Future.fromResult();

        var selectedState = function () {
            state = deselectedState;
            $checkbox.prop("checked", false);
            $elem.trigger({
                type: "itemDeselected",
                entity: item
            });
        };

        var deselectedState = function () {
            state = selectedState;
            $checkbox.prop("checked", true);
            $elem.trigger({
                type: "itemSelected",
                entity: item
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

        var createCheckbox = function (property) {
            var name = property.name;
            var width = property.width;
            var left = property.left;

            var $column = $("<div></div>");
            $checkbox = $("<input/>");
            $checkbox.attr("type", "checkbox");
            $checkbox.addClass("gem-input");
            $checkbox.appendTo($column);

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

            return $column
        };

        self.setLoading = function () {
            Object.keys(columns).forEach(function (columnName) {
                columns[columnName].text("Loading...");
            });
        };

        self.setEntity = function (entity, index) {
            item = entity;

            Object.keys(columns).forEach(function (columnName) {
                var property = propertiesHash[columnName];
                var value = property.getValue(entity);
                var display = property.display(value);

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
                    if (property.name === "__checkbox__") {
                        $elem.append(createCheckbox(property));
                        return columns;
                    }

                    var $column = createColumn(property);

                    columns[property.name] = $column;
                    $elem.append($column);

                    return columns;
                }, columns);
            }
        };

        self.select = function () {
            state = selectedState;
            $checkbox.prop("checked", true);
            $elem.addClass("selected");
        };

        self.deselect = function () {
            state = deselectedState;
            $checkbox.prop("checked", false);
            $elem.removeClass("selected");
        };

        $elem.on("click", function () {
            state();
        });
    };
});
