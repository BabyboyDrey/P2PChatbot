const router = require("express").Router();
const asyncErrCatcher = require("../middlewares/asyncErrCatcher.js");
const users = require("../models/users.js");
const bcrypt = require("bcryptjs");
const userAuthToken = require("../utils/userAuthToken.js");

router.post(
  "/sign-up",
  asyncErrCatcher(async (req, res, next) => {
    try {
      console.log("route hit!");
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Please provide all required paramters",
        });
      }
      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          message: "please provide valid types!",
        });
      }

      const existingUser = await users.findOne({
        email,
      });
      if (existingUser) {
        return res.status(409).json({
          message: "User already exists!",
        });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPass = await bcrypt.hash(password, salt);

      const newUser = await users.create({
        name,
        email,
        password: hashedPass,
      });
      console.log("newUser:", newUser);
      userAuthToken(newUser, res, 200);
    } catch (err) {
      console.error(err);
      next(err.message);
    }
  })
);

module.exports = router;
