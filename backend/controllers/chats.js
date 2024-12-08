const { default: mongoose } = require("mongoose");
const asyncErrCatcher = require("../middlewares/asyncErrCatcher");
const userAuth = require("../middlewares/userAuth.js");
const chat = require("../models/chat");
const router = require("express").Router();

router.post(
  "/create-chat",
  userAuth,
  asyncErrCatcher(async (req, res, next) => {
    try {
      const { firstUserId, secondUserId } = req.body;

      const chatExists = await chat.findOne({
        members: {
          $all: [firstUserId, secondUserId],
        },
      });
      if (chatExists) {
        return res.json(chat);
      }

      const newChat = await chat.create({
        members: [firstUserId, secondUserId],
      });
      res.json(newChat);
    } catch (err) {
      console.error(err);
      next(err.emssage);
    }
  })
);
router.get(
  "/find-user-chat/:userId",
  userAuth,
  asyncErrCatcher(async (req, res, next) => {
    try {
      const { userId } = req.params;
      if (!userId)
        return res.status(400).json({
          message: "Provide user id",
        });
      const userChats = await chat.findOne({
        members: {
          $in: [userId],
        },
      });

      res.json(userChats);
    } catch (err) {
      console.error(err);
      next(err.emssage);
    }
  })
);
router.get(
  "/find-chat/:firstUserId/:secondUserId",
  userAuth,
  asyncErrCatcher(async (req, res, next) => {
    try {
      const { firstUserId, secondUserId } = req.params;
      console.log("firstUserId, secondUserId :", firstUserId, secondUserId);
      if (
        !mongoose.Types.ObjectId.isValid(firstUserId) ||
        !mongoose.Types.ObjectId.isValid(secondUserId)
      )
        return res.status(400).json({
          message: "Provide valid ids!",
        });

      const userChats = await chat.findOne({
        members: {
          $all: [firstUserId, secondUserId],
        },
      });

      res.json(userChats);
    } catch (err) {
      console.error(err);
      next(err.emssage);
    }
  })
);

module.exports = router;
