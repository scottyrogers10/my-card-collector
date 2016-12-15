BASE.require([
    "jQuery"
], function () {
    var Fulfillment = BASE.async.Fulfillment;

    BASE.namespace("components.gem");

    components.gem.DateTimePicker = function (elem, tags, services) {
        var self = this;
        var dates = [];
        var $hour = $(tags["hour"]);
        var $minute = $(tags["minute"]);
        var $timePeriod = $(tags["time-period"]);
        var $year = $(tags["year"]);
        var $month = $(tags["month"]);
        var $select = $(tags["select"]);
        var $dates = $(tags["dates"]);
        var $lastSelect = $();
        var date = null;
        var fulfillment = null;
        var window = null;
        var offset = 0;

        //Save all the date slots into an array.
        for (var x = 0; x <= 42; x++) {
            dates.push($(tags[x]));
        }

        var clearDates = function () {
            dates.forEach(function ($elem) {
                $elem.text(" ");
            });
        };

        //Months are zero indexed.
        var setDisplay = function (year, month) {
            var date = new Date(year, month);

            clearDates();

            offset = date.getDay();
            var currentDate = 1;
            var $elem = dates[offset];

            $elem.text(currentDate);
            date.setDate(currentDate + 1);

            while (date.getDate() !== 1) {
                currentDate = date.getDate();
                $elem = dates[offset + currentDate - 1];
                $elem.text(currentDate);
                date.setDate(currentDate + 1);
            }
        };

        var setDisplayByInputData = function () {
            var year = parseInt($year.val(), 10);
            var month = parseInt($month.val(), 10);
            var hour = parseInt($hour.val(), 10);
            var minute = parseInt($minute.val(), 10);
            var timePeriod = $timePeriod.val();

            date.setFullYear(year);
            date.setMonth(month);
            setDisplay(year, month);
            setDate(date.getDate());
            setTime(hour, minute, timePeriod);
        };

        var setYear = function (value) {
            $year.val(value);
        };

        var setMonth = function (value) {
            $month.val(value);
        };

        var setDate = function (value) {
            if (typeof value !== "number") {
                throw new Error("Date must be a number.");
            }

            date.setDate(value);

            $lastSelect.removeClass("selected");
            $lastSelect = dates[value + offset - 1].addClass("selected");
        };

        var setHourAndTimePeriod = function (value) {
            var hour = null;
            var timePeriod = null;

            if (value < 12) {
                hour = value;
                timePeriod = "AM";
            } else {
                hour = value % 12;
                timePeriod = "PM";
            }

            $hour.val(hour);
            $timePeriod.val(timePeriod);
        };

        var setMinute = function (value) {
            var minute = value;
            var offset = value % 15;

            $minute.val(minute - offset);
        };

        var setTime = function (hour, minute, timePeriod) {
            var militaryHour = null;

            if (timePeriod === "PM") {
                militaryHour = (hour + 12);
                militaryHour === 24 ? militaryHour = 0 : militaryHour = militaryHour;
            } else {
                militaryHour = hour;
            }

            date.setHours(militaryHour);
            date.setMinutes(minute);
        };

        self.setValue = function (value) {
            date = value == null ? new Date() : new Date(value);

            setYear(date.getFullYear());
            setMonth(date.getMonth());
            setDate(date.getDate());
            setHourAndTimePeriod(date.getHours());
            setMinute(date.getMinutes());

            setDisplayByInputData();
        };

        self.getValue = function () {
            return date;
        };

        self.prepareToActivateAsync = function () {
            fulfillment = new Fulfillment();
        };

        self.getFulfillment = function () {
            return fulfillment;
        };

        self.init = function (value) {
            window = value;
            window.setName("Choose a Date");
            window.disableResize();
        };

        self.prepareToDeactivateAsync = function () {
            fulfillment.cancel();
        };

        self.activated = function () {
            $month.focus();
        };

        $month.on("change", function () {
            setDisplayByInputData();
        });

        $year.on("keyup", function () {
            if ($year.val() !== "") {
                setDisplayByInputData();
            }
        });

        $year.on("keydown", function (event) {
            if (event.which === 13) {
                setDisplayByInputData();
                return false;
            }
        });

        $year.val(new Date().getFullYear());

        $select.on("click", function () {
            fulfillment.setValue(date);
            window.closeAsync().try();
        });

        $dates.find(".calendar-square").on("click", function () {
            var number = parseInt($(this).text(), 10);
            if (!isNaN(number)) {
                setDate(number);
            }
        });

        $hour.on("change", function () {
            setDisplayByInputData();
        });

        $minute.on("change", function () {
            setDisplayByInputData();
        });

        $timePeriod.on("change", function () {
            setDisplayByInputData();
        });

    };

});