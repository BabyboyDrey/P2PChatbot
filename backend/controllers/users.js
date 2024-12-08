const router = require("express").Router();
const asyncErrCatcher = require("../middlewares/asyncErrCatcher.js");
const users = require("../models/users.js");
const bcrypt = require("bcryptjs");
const userAuthToken = require("../utils/userAuthToken.js");
const userAuth = require("../middlewares/userAuth.js");

router.post(
  "/register",
  asyncErrCatcher(async (req, res, next) => {
    try {
      console.log("route hit!");
      const { name, email, phoneNumber } = req.body;
      console.log("name, email, phoneNumber :", name, email, phoneNumber);
      if (!name || !email || !phoneNumber) {
        return res.status(400).json({
          message: "Please provide all required paramters",
        });
      }
      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof phoneNumber !== "string"
      ) {
        return res.status(400).json({
          message: "please provide valid types!",
        });
      }

      const existingUser = await users.findOne({
        email,
      });
      if (existingUser) {
        return userAuthToken(existingUser, res, 200);
        // return res.status(409).json({
        //   message: "User already exists with this email!",
        // });
      }

      const newUser = await users.create({
        name,
        email,
        phoneNumber,
      });
      console.log("newUser:", newUser);
      return userAuthToken(newUser, res, 200);
    } catch (err) {
      console.error(err);
      next(err.message);
    }
  })
);

router.get(
  "/get-all-users",
  userAuth,
  asyncErrCatcher(async (req, res, next) => {
    try {
      const currentUserId = req.user.id;
      const usersList = await users
        .find({ _id: { $ne: currentUserId } })
        .sort({ createdAt: -1 });

      res.status(200).json({
        message: "Users fetched successfully",
        users: usersList,
      });
    } catch (err) {
      console.error(err);
      next(err);
    }
  })
);

module.exports = router;
