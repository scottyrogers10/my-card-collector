BASE.require([
    "jQuery",
    "BASE.web.ajax",
    "app.components.animations.FadeInElement",
    "app.components.animations.FadeOutElement"
], function () {

    BASE.namespace("app.components.states");

    var ajax = BASE.web.ajax;
    var fadeInElement = new app.components.animations.FadeInElement();
    var fadeOutElement = new app.components.animations.FadeOutElement();

    app.components.states.RegisterState = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $usernameInput = $(tags["username-input"]);
        var $emailInput = $(tags["email-input"]);
        var $passwordInput = $(tags["password-input"]);
        var $signUpBtn = $(tags["sign-up-btn"]);
        var $loginAccountBtn = $(tags["login-account-btn"]);

        var hostUri = null;
        var appMainStateManagerController = null;
        var fadeInElementAnimation = fadeInElement.createAnimation($elem[0], 300);
        var fadeOutElementAnimation = fadeOutElement.createAnimation($elem[0], 300);

        var getCreatedUserCredentials = function () {
            return {
                username: $usernameInput.val(),
                email: $emailInput.val(),
                password: $passwordInput.val()
            };
        };

        self.init = function (parentStateManager) {
            hostUri = services.get("hostUri");
            appMainStateManagerController = parentStateManager;
        };

        self.activated = function () {
            fadeInElementAnimation.playToEndAsync(0).try();
        };

        $signUpBtn.on("click", function () {
            var credentials = getCreatedUserCredentials();
            return ajax.POST(hostUri + "/user/register", {
                data: JSON.stringify(credentials)
            }).chain(function (result) {
                window.localStorage.token = result.data.token;
                return appMainStateManagerController.replaceAsync("home-state");
            }).catch(function (error) {
                console.log(error);
            }).try();
        });

        $loginAccountBtn.on("click", function () {
            appMainStateManagerController.replaceAsync("login-state").try();
        });

    };

});
