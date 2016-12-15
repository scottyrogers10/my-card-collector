BASE.require([
    "jQuery"
], function () {

    BASE.namespace("app.components.states");

    app.components.states.SettingsState = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $signOutBtn = $(tags["sign-out-btn"]);

        var appMainStateManagerController = null;

        self.init = function (parentStateManager) {
            appMainStateManagerController = parentStateManager;
        };

        $signOutBtn.on("click", function () {
            window.localStorage.removeItem("token");

            appMainStateManagerController.replaceAsync("login-state").chain(function () {
                $elem.trigger({
                    type: "changeHamburgerMenuSelected",
                    state: "home-state"
                });
            }).try();
        });

    };
});
