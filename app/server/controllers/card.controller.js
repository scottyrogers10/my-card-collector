var passport = require("passport");
var mongoose = require("mongoose");
var Card = require("../models/card.model");

var addCardAsync = function (req, res) {
    return new Promise(function (resolve, reject) {
        if (!req.body.playerName) {
            reject({
                status: 400,
                message: "Player name field is required."
            });
        } else {
            var card = new Card();
            var cardSet = req.body.cardSet || null;
            var cardSubset = req.body.cardSet || null;
            var cardYear = req.body.cardYear || null;
            var cardNumber = req.body.cardNumber || null;
            
            card.playerName = req.body.playerName;
            card.cardSet = cardSet;
            card.cardSubset = cardSubset;
            card.cardYear = cardYear;
            card.cardNumber = cardNumber;
            card.createdDate = new Date();

            card.save().then(function() {
                resolve({
                    status: 200,
                    message: "Card was saved successfully"
                });
            }).catch(function(err) {
                reject({
                    status: 500,
                    message: "Server ERROR while trying to save to the database.",
                    err: err
                });
            });
        }
        
    });
};

module.exports = {
    addCardAsync: addCardAsync
};
