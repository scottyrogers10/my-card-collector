var express = require("express");
var mongoose = require("mongoose");
var env = require("./environment/env");
var userRouter = require("../routes/user.router");

var app = express();

var setMongoDB = function () {
    mongoose.Promise = global.Promise;
    mongoose.connect("mongodb://" + env.database.username + ":" + env.database.password + "@" + env.database.uri);

    //Note: Console Logs for Development
    mongoose.connection.on("connected", function () {
        console.log("Mongoose connected.");
    });

    //Note: Console Logs for Development
    mongoose.connection.on("error", function (err) {
        console.log("Mongoose connection error: " + err);
    });

    //Note: Console Logs for Development
    mongoose.connection.on("disconnected", function () {
        console.log("Mongoose disconnected.");
    });
};

var setRoutes = function () {
    require("./passport.config");
    app.use("/user", userRouter);
};

module.exports.init = function () {
    setMongoDB();
    setRoutes();
};

module.exports.start = function () {
    app.listen(3000, function () {
        //Note: Console Logs for Development
        console.log("Server is running on port 3000");
    });
};
