BASE.require([
    "jQuery"
], function () {

    BASE.namespace("app.components.material");

    app.components.material.Header = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $menuButton = $(tags["menu-button"]);

        $menuButton.on("click", function () {
            $elem.trigger("menuButtonClick");
        });

    };

});
