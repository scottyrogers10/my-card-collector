var express = require("express");
var cardController = require("../controllers/card.controller");

var cardRouter = express.Router();

cardRouter.post("/add", function(req, res) {
    cardController.addCardAsync(req, res).then(function(result) {
        res.status(result.status).json({
            message: result.message
        });
    }).catch(function(err) {
        res.status(err.status).json({
            message: err.message
        });
    });
});

module.exports = cardRouter;
