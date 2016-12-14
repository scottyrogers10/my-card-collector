var express = require("express");
var bodyParser = require("body-parser");

var userRouter = express.Router();

userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({ extended: false }));
userRouter.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

userRouter.post("/login", function (req, res) {
    console.log(req.method);
});

userRouter.post("/register", function (req, res) {
    console.log(req.method);
});

module.exports = userRouter;
