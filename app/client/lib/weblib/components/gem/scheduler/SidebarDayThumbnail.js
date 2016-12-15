BASE.require([
    "jQuery"
], function () {

    BASE.namespace("components.gem.scheduler");

    components.gem.scheduler.SidebarDayThumbnail = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $dayOfTheMonth = $(tags["day-of-the-month"]);

        var currentDate = null;

        self.setDate = function (date) {
            if (!(date instanceof Date) || date == null) {
                $dayOfTheMonth.text("");
                $elem.removeClass("current-date");
                $elem.removeClass("default-date");
                $elem.removeClass("selected-date");
                $elem.css("background-color", "");
                currentDate = null;
            } else {
                $dayOfTheMonth.text(date.getDate());
                $elem.removeClass("current-date");
                $elem.removeClass("selected-date");
                $elem.addClass("default-date");
                currentDate = date;
                currentDate.setHours(0, 0, 0, 0);
            }
        };

        self.setSelectedDateStyles = function () {
            $elem.addClass("selected-date");
        };

        self.setTodayDateStyle = function () {
            $elem.addClass("current-date");
        };

        $elem.on("click", function () {
            if ((currentDate instanceof Date) || !(currentDate == null)) {
                $(this).trigger({
                    type: "selectedDate",
                    selectedDate: currentDate
                });
            }
        });

        $elem.hover(function () {
            if ((currentDate instanceof Date) || !(currentDate == null)) {
                $(this).addClass("hover-date");
            }
        }, function () {
            $(this).removeClass("hover-date");
        });

    };

});