const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const Userschema = new Schema({
    fullName: {
      type: String,
      required: [true, "First Name is Required"],
    },
  
    email: {
      type: String,
      required: [true, "email Name is Required"],
    },
    gender: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: [true, "Password is Required"],
    },
    date_registered: {
      type: Date,
      default: Date.now(),
    },
    avatar: {
      type: String,
      required: false
    },
  });

const User = mongoose.model("user", Userschema);
module.exports = User;
