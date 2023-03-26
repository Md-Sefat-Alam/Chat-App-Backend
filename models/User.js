const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  full_name: String,
  email: String,
  contact: String,
  password: String,
}, {timestamps: true});

const User = mongoose.model("User", userSchema);
module.exports = User;
