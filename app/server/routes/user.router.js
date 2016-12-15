var express = require("express");
var bodyParser = require("body-parser");
var passport = require("passport");
var userController = require("../controllers/user.controller");

var userRouter = express.Router();



userRouter.post("/login", function(req, res) {
    userController.loginAsync(req, res).then(function(result) {
        res.status(result.status).json({
            token: result.token
        });
    }).catch(function(err) {
        res.status(err.status).json({
            message: err.message
        });
    });
});

userRouter.post("/register", function(req, res) {
    userController.registerAsync(req, res).then(function(result) {
        res.status(result.status).json({
            token: result.token
        });
    }).catch(function(err) {
        res.status(err.status).json({
            message: err.message,
            error: err.err
        });
    });
});

module.exports = userRouter;
