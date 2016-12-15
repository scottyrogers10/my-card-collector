BASE.require([
    "jQuery"
], function () {

    BASE.namespace("app.components.layouts");

    app.components.layouts.HamburgerMenu = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $homeButton = $(tags["home-button"]);
        var $myAlbumsButton = $(tags["my-albums-button"]);
        var $profileButton = $(tags["profile-button"]);
        var $settingsButton = $(tags["settings-button"]);
        var $closeMenuButton = $(tags["menu-close-button"]);

        var $selectedButton = $homeButton;

        var highlightSelectedButton = function ($highlightElement) {
            $selectedButton.removeClass("selected-state");
            $highlightElement.addClass("selected-state");
            $selectedButton = $highlightElement;
        };

        self.setHamburgerMenuSelectedState = function (state) {
            var stateElements = {
                "home-state": $homeButton,
                "settings-state": $settingsButton
            };

            highlightSelectedButton(stateElements[state]);
        };

        $homeButton.on("click", function (event) {
            event.stopPropagation();
            $elem.trigger("homeButtonClick");
        });

        $myAlbumsButton.on("click", function (event) {
            event.stopPropagation();
            $elem.trigger("myAlbumsButtonClick");
        });

        $profileButton.on("click", function (event) {
            event.stopPropagation();
            $elem.trigger("profileButtonClick");
        });

        $settingsButton.on("click", function (event) {
            event.stopPropagation();
            $elem.trigger("settingsButtonClick");
        });

        $closeMenuButton.on("click", function (event) {
            event.stopPropagation();
            $elem.trigger("closeMenuClick");
        });


    };
});
