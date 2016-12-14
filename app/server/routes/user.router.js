var express = require("express");
var bodyParser = require("body-parser");
var passport = require("passport");
var userController = require("../controllers/user.controller");

var userRouter = express.Router();

userRouter.use(passport.initialize());
userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({ extended: false }));
userRouter.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

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
            message: err.message
        });
    });
});

module.exports = userRouter;
