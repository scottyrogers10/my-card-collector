var express = require("express");
var mongoose = require("mongoose");
var userRouter = require("../routes/user");

var app = express();
var environment = null;

var environments = {
    dev: require("./environment/dev")
};

var setMongoDB = function (environment) {
    mongoose.Promise = global.Promise;
    mongoose.connect("mongodb://" + environment.database.username + ":" + environment.database.password + "@" + environment.database.uri);

    //Note: Console Logs for Development
    mongoose.connection.on("connected", function() {
      console.log("Mongoose connected.");
    });

    //Note: Console Logs for Development
    mongoose.connection.on("error", function(err) {
        console.log("Mongoose connection error: " + err);
    });

    //Note: Console Logs for Development
    mongoose.connection.on("disconnected", function() {
        console.log("Mongoose disconnected.");
    });
};

var setRoutes = function () {
    app.use("/user", userRouter);
};

module.exports.init = function (mode) {
    if (environments[mode]) {
        environment = environments[mode];
    } else {
        throw new Error("The mode (" + mode + ") is not supported.");
    }

    setMongoDB(environment);
    setRoutes();
};

module.exports.start = function () {
    app.listen(3000, function () {
        //Note: Console Logs for Development
        console.log("Server is running on port 3000");
    });
};
