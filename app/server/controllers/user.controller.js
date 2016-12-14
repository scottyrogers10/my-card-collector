var passport = require("passport");
var mongoose = require("mongoose");
var User = require("../models/user.model");

var loginAsync = function(req, res) {
    return new Promise(function(resolve, reject) {
        if (!req.body.username || !req.body.password) {
            reject({
                status: 400,
                message: "All fields are required."
            });
        } else {
            passport.authenticate("local", function(err, user, info) {
                if (err) {
                    reject(err)
                } else if (user) {
                    var token = user.generateJwt();

                    resolve({
                        status: 200,
                        token: token
                    });
                }
            })(req, res);
        }
    });
};

var registerAsync = function(req, res) {
    return new Promise(function(resolve, reject) {
        if (!req.body.email || !req.body.username || !req.body.password) {
            reject({
                status: 400,
                message: "All fields required."
            });
        } else {
            var user = new User();
            user.email = req.body.email;
            user.username = req.body.username;
            user.setPassword(req.body.password);
            user.createdDate = new Date();
            user.lastSignInDate = new Date();
            user.firstName = null;
            user.lastName = null;
            user.offersOptIn = true;

            user.save().then(function() {
                var token = user.generateJwt();

                resolve({
                    status: 200,
                    token: token
                });
            }).catch(function() {
                reject({
                    status: 500,
                    message: "Server ERROR while trying to save to the database."
                });
            });
        }
    });
};

module.exports = {
    loginAsync: loginAsync,
    registerAsync: registerAsync
};
