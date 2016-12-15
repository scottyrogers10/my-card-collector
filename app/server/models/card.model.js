var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var cardSchema = new Schema({
    playerName: String,
    cardSet: String,
    cardSubset: String,
    cardYear: String,
    cardNumber: Number,
    createdDate: Date
});

var Card = mongoose.model("Card", cardSchema);

module.exports = Card;
