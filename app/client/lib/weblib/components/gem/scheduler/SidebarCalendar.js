BASE.require([
    "jQuery",
], function () {
    var Fulfillment = BASE.async.Fulfillment;

    BASE.namespace("components.gem.scheduler");

    components.gem.scheduler.SidebarCalendar = function (elem, tags, services) {
        var self = this;
        var $elem = $(elem);
        var $displayMonthAndYear = $(tags["display-month-and-year"]);
        var $dates = $(tags["dates"]);
        var $previousMonth = $(tags["previous-month"]);
        var $nextMonth = $(tags["next-month"]);

        var dates = [];
        var offset = null;
        var selectedDate = new Date();
        var year = selectedDate.getFullYear();
        var month = selectedDate.getMonth();

        //Save all the date slots into an array.
        for (var x = 0; x < 42; x++) {
            dates.push($(tags[x]));
        }

        var getControllerForDate = function (dayOfTheMonth) {
            return dates[offset + dayOfTheMonth - 1].controller();
        };

        var getControllerByIndex = function (index) {
            return dates[index].controller();
        };

        var clearDates = function () {
            Object.keys(dates).forEach(function (key) {
                getControllerByIndex(key).setDate(null);
            });
        };

        var redrawCalendar = function (year, month) {
            var date = new Date();
            date.setFullYear(year);
            date.setHours(0, 0, 0, 0);
            date.setMonth(month);
            date.setDate(1);

            var todayDate = new Date();

            clearDates();

            month = date.getMonth();
            year = date.getFullYear();

            $displayMonthAndYear.text(date.format("mmmm yyyy"));

            offset = date.getDay();

            var currentDate;

            do {
                currentDate = date.getDate();
                getControllerForDate(currentDate).setDate(new Date(date));
                date.setDate(currentDate + 1);
            } while (date.getDate() !== 1)

            if (selectedDate.getMonth() == month && selectedDate.getFullYear() == year) {
                getControllerForDate(selectedDate.getDate()).setSelectedDateStyles();
            }

            if (todayDate.getMonth() === month) {
                getControllerForDate(todayDate.getDate()).setTodayDateStyle();
            }

        };

        self.setYear = function (value) {
            year = value;
            redrawCalendar(value, month);
        };

        self.setMonth = function (value) {
            month = value;
            redrawCalendar(year, value);
        };

        self.redraw = function (options) {
            selectedDate = options.selectedDate;
            self.setMonth(options.selectedDate.getMonth());
            self.setYear(options.selectedDate.getFullYear());
            redrawCalendar(year, month);
        };

        $elem.on("selectedDate", function (options) {
            selectedDate = options.selectedDate;
            redrawCalendar(year, month);
        });

        $previousMonth.on("click", function () {
            self.setMonth(month - 1);
        });

        $nextMonth.on("click", function () {
            self.setMonth(month + 1);
        });

        redrawCalendar(year, month);

    };

});