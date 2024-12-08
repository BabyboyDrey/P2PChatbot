const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      required: "Chat id is required!",
      ref: "Chat",
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: "Sender is required!",
      ref: "User",
    },
    seen: Boolean,
    text: {
      type: String,
      required: "Text is required!",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
