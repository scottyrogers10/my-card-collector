BASE.require([
    "jQuery",
    "BASE.async.Future"
], function () {

    BASE.namespace("app.components");

    var Future = BASE.async.Future;

    app.components.AppMain = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var twoColumnLeftOverlayController = $(tags["two-column-left-overlay"]).controller();
        var hamburgerMenuController = $(tags["hamburger-menu"]).controller();
        var appMainStateManagerController = $(tags["app-main-state-manager"]).controller();

        var init = function () {
            if (!window.localStorage.token) {
                appMainStateManagerController.pushAsync("login-state").try();
            } else {
                appMainStateManagerController.pushAsync("home-state").chain(function () {
                    hamburgerMenuController.setHamburgerMenuSelectedState("home-state");
                }).try();
            }
        };

        var showHamburgerMenu = function () {
            twoColumnLeftOverlayController.showLeftColumn();
        };

        var hideHamburgerMenu = function () {
            twoColumnLeftOverlayController.hideLeftColumn();
        };

        $elem.on("homeButtonClick", function () {
            hideHamburgerMenu();
            appMainStateManagerController.replaceAsync("home-state").chain(function () {
                hamburgerMenuController.setHamburgerMenuSelectedState("home-state");
            }).try();
        });

        $elem.on("settingsButtonClick", function () {
            hideHamburgerMenu();
            appMainStateManagerController.replaceAsync("settings-state").chain(function () {
                hamburgerMenuController.setHamburgerMenuSelectedState("settings-state");
            }).try();
        });

        $elem.on("changeHamburgerMenuSelected", function (evt) {
            hamburgerMenuController.setHamburgerMenuSelectedState(evt.state);
        })

        $elem.on("menuButtonClick", showHamburgerMenu);

        $elem.on("closeMenuClick", hideHamburgerMenu);

        init();
    };
});
