BASE.require([
    "jQuery",
    "BASE.web.ajax",
    "app.components.animations.FadeInElement",
    "app.components.animations.FadeOutElement"
], function() {

    BASE.namespace("app.components.states");

    var ajax = BASE.web.ajax;
    var fadeInElement = new app.components.animations.FadeInElement();
    var fadeOutElement = new app.components.animations.FadeOutElement();

    app.components.states.LoginState = function(elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $usernameInput = $(tags["username-input"]);
        var $passwordInput = $(tags["password-input"]);
        var $loginBtn = $(tags["login-btn"]);
        var $createAccountBtn = $(tags["create-account-btn"]);

        var hostUri = null;
        var appMainStateManagerController = null;
        var fadeInElementAnimation = fadeInElement.createAnimation($elem[0], 300);
        var fadeOutElementAnimation = fadeOutElement.createAnimation($elem[0], 300);

        var getUserCredentials = function () {
            return {
                username: $usernameInput.val(),
                password: $passwordInput.val()
            };
        };

        var resetFields = function () {
            $usernameInput.val("");
            $passwordInput.val("");
        };

        self.init = function(parentStateManager) {
            hostUri = services.get("hostUri");
            appMainStateManagerController = parentStateManager;
        };

        self.activated = function () {
            fadeInElementAnimation.playToEndAsync(0).try();
        };

        $loginBtn.on("click", function () {
            var credentials = getUserCredentials();

            return ajax.POST(hostUri + "/user/login", {
                data: JSON.stringify(credentials)
            }).chain(function (result) {
                window.localStorage.token = result.data.token;
                return appMainStateManagerController.replaceAsync("home-state");
            }).catch(function (error) {
                console.log(error);
            }).finally(function () {
                resetFields();
            }).try();
        });

        $createAccountBtn.on("click", function () {
            appMainStateManagerController.replaceAsync("register-state").try();
        });

    };

});
