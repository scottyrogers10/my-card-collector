var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var mongoose = require("mongoose");
var User = require("../models/user.model");

passport.use(new LocalStrategy(function (username, password, done) {
    User.findOne({
        $or: [{
            username: username
        }, {
            email: username
        }]
    }).exec().then(function (user) {
        if (!user) {
            return done({
                status: 400,
                message: "We could not find an account associated with " + username
            });
        } else if (!user.isPasswordValid(password)) {
            return done({
                status: 401,
                message: "Oops that's not the correct password."
            });
        } else {
            return done(null, user);
        }
    });
}));
