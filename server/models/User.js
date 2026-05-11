const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name:String,
    email:String,
    passwordHash:String,
    profilePicture:String
})

const UserModel = mongoose.model("users", UserSchema)

module.exports = UserModel