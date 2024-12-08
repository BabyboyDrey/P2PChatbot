const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const usersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: "Name is required!",
    },
    phoneNumber: {
      type: String,
      required: "Phone number is required!",
    },
    email: {
      type: String,
      required: "Email is required!",
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

usersSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

module.exports = mongoose.model("Users", usersSchema);
