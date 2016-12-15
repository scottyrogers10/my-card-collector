var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var mongoose = require("mongoose");
var env = require("../configs/environment/env");

var Schema = mongoose.Schema;

var userSchema = new Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    salt: String,
    firstName: String,
    lastName: String,
    offersOptIn: Boolean,
    createdDate: Date,
    lastSignInDate: Date
});

userSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString("hex");
    this.password = crypto.pbkdf2Sync(password, this.salt, 1000, 64, "sha512").toString("hex");
};

userSchema.methods.isPasswordValid = function (password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, "sha512").toString("hex");
    return this.password === hash;
};

userSchema.methods.generateJwt = function () {
    var expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    return jwt.sign({
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000)
    }, env.jwt.secret);
};

var User = mongoose.model("User", userSchema);

module.exports = User;
