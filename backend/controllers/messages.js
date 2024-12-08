const asyncErrCatcher = require("../middlewares/asyncErrCatcher");
const userAuth = require("../middlewares/userAuth");
const messages = require("../models/messages");
const router = require("express").Router();

router.post(
  "/create-message",
  userAuth,
  asyncErrCatcher(async (req, res, next) => {
    try {
      const { text, chatId } = req.body;
      console.log("req.user.id:", req.user.id);
      const newMessage = await messages.create({
        senderId: req.user.id,
        text,
        chatId,
      });
      res.json({
        newMessage,
      });
    } catch (err) {
      console.error(err);
      next(err.message);
    }
  })
);

router.get(
  "/get-messages/:chatId",
  userAuth,
  asyncErrCatcher(async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const allMessages = await messages.find({
        chatId,
      });

      res.json({
        allMessages,
      });
    } catch (err) {
      console.error(err);
      next(err.message);
    }
  })
);

module.exports = router;
