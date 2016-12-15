BASE.require([
    "jQuery"
], function () {

    BASE.namespace("app.components.layouts");

    app.components.layouts.CardFeedListItem = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $profileImage = $(tags["profile-image"]);
        var $profileName = $(tags["profile-name"]);
        var $cardImage = $(tags["card-image"]);
        var $cardPictureHeight = $(tags["card-picture-height"]);
        var $setName = $(tags["set-name"]);
        var $playerName = $(tags["player-name"]);

        self.getItemHeight = function (item) {
            if (item.orientation === "landscape") {
                return 411;
            } else {
                return 676;
            }
        };

        self.prepareToActivate = function (item) {
            if (item.orientation === "landscape") {
                $cardPictureHeight.css({
                    "height": "245px"
                });
            } else {
                $cardPictureHeight.css({
                    "height": "510px"
                });
            }

            $profileImage.css({
                "background-image": "url(" + item.profileImageSrc + ")"
            });

            $profileName.text(item.profileName);
            $cardImage.attr("src", item.frontCardImageSrc);
            $setName.text(item.year + " " + item.set + " " + item.subset);
            $playerName.text(item.playerName);
        };
    };
});