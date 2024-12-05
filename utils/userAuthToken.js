const asyncErrCatcher = require("../middlewares/asyncErrCatcher");
const jwt = require("jsonwebtoken");
const users = require("../models/users");

const userAuthToken = (user, res, statusCode) => {
  const user_token = user.getJwtToken();
  console.log("token:", user_token);
  const JWT_EXPIRES_MS = 8 * 60 * 60 * 1000;

  const options = {
    maxAge: JWT_EXPIRES_MS,
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  res.status(statusCode).cookie("au_t", user_token, options).json({
    success: true,
    user,
  });
};

module.exports = userAuthToken;
