BASE.require([
    "jQuery",
    "BASE.web.ajax",
    "Array.prototype.asQueryable",
    "BASE.async.delayAsync"
], function () {

    var cards = [{
        profileName: "Scotty Rogers",
        profileImageSrc: "img/profile.jpg",
        frontCardImageSrc: "img/nba_card_1.jpg",
        orientation: "portrait",
        playerName: "Aaron Gordon",
        set: "Panini Hoops",
        subset: "Dreams",
        year: "2014-15",
        cardNumber: "3"
    }];

    BASE.namespace("app.components.states");

    var ajax = BASE.web.ajax;
    var delayAsync = BASE.async.delayAsync;

    app.components.states.HomeState = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $addCardButton = $(tags["add-card-button"]);
        var $cardFeedCollection = $(tags["card-feed-collection"]);
        var cardFeedCollectionController = $cardFeedCollection.controller();

        var hostUri = null;

        var getUserInfoAsync = function () {
            return ajax.GET(hostUri + "/api/profile", {
                headers: {
                    "Authorization": "Bearer " + window.localStorage.token
                }
            });
        };

        self.init = function () {
            hostUri = services.get("hostUri");
        };

        self.prepareToActivateAsync = function () {
            return getUserInfoAsync().chain(function (user) {
                services.set("user", user.data);
                return cardFeedCollectionController.setQueryableAsync(cards.asQueryable());
            });
        };

        $addCardButton.on("touchend", function () {
             delayAsync(200).chain(function () {
                 $elem.trigger({
                     type: "addCardButtonClick",
                     stateName: "Add Card"
                 });
             }).try();
        });

        $elem.on("menuButtonClicked", function () {
            console.log("homeState");
        });

        // window.localStorage.removeItem("token");

    };
});
