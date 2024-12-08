const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDb = require("./db/database");
const path = require("path");
const userRoutes = require("./controllers/users");
const chatRoutes = require("./controllers/chats");
const messageRoutes = require("./controllers/messages");
const morgan = require("morgan");
const app = express();
const users = require("./models/users");
const redis = require("redis");
const { Server } = require("socket.io");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    path: ".env",
  });
}

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

app.use(cookieParser());

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);

connectDb();

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/user/chat", chatRoutes);
app.use("/api/v1/user/message", messageRoutes);

process.on("uncaughtException", (err) => {
  console.log(`Uncaught Exception Err: ${err}`);
  console.log("Shutting down server for uncaught exception");
});

process.on("unhandledRejection", (err) => {
  console.log(`Unhandled Rejection Err: ${err}`);
  console.log("Shutting down server for unhandled rejection");
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing server");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing server");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("warning", (warning) => {
  console.warn(
    `Warning: ${warning.name} - ${warning.message}\n${warning.stack}`
  );
});

process.on("rejectionHandled", (promise) => {
  console.log("Promise rejection handled:", promise);
});

process.on("beforeExit", (code) => {
  console.log("Process before Exit event with code:", code);
});

app.get("/", (req, res) => {
  console.log("code:", req.query.code);
  res.send(req.user ? req.user : "Login pls");
});

app.get("/dice", (req, res) => {
  res.send("Url of ngrok functional");
});

const PORT = process.env.SERVER_PORT || 5010;
console.log("Port:", PORT);
const server = app.listen(PORT, () => {
  console.log(`Server listening on Port ${PORT}`);
  console.log(`worker pid: ${process.pid}`);
});

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    credentials: true,
  },
});

const redisClient = redis.createClient();

// Redis setup
redisClient
  .connect()
  .then(() => {
    console.log("Connected to Redis!");
  })
  .catch((err) => {
    console.error("Failed to connect to Redis", err);
  });

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);
  socket.on("connect_error", (err) => {
    console.error("Connection Error:", err);
  });
  // Event to add users
  socket.on("addUsers", async (userId) => {
    if (!userId) {
      console.log("No userId received!");
      return;
    }

    // Save userId and socketId in Redis
    await redisClient.hSet(`user:${userId}`, "socketId", socket.id);

    // Retrieve all users from Redis
    const onlineUsers = await redisClient.keys("user:*");

    // Emit the updated online users list
    io.emit("getOnlineUsers", onlineUsers);
  });

  // Event to refresh online users
  socket.on("refreshOnlineUsers", async () => {
    const onlineUsers = await redisClient.keys("user:*");
    io.emit("getOnlineUsers", onlineUsers);
  });

  // Event to handle message sending
  socket.on("sendMessage", async (message) => {
    try {
      const recipientKey = `user:${message.currentContactId}`;
      const recipientSocketId = await redisClient.hGet(
        recipientKey,
        "socketId"
      );

      if (recipientSocketId) {
        // The recipient is online, send the message
        io.to(recipientSocketId).emit(
          "getMessage",
          message,
          (ackFromClient) => {
            console.log("Acknowledgment from client:", ackFromClient);

            // Handle the acknowledgment
            if (ackFromClient && ackFromClient.status === "received") {
              console.log("Message successfully received by the client.");
            }

            // Optionally send an acknowledgment back to the sender
            socket.emit("messageDelivered", { status: "delivered" });
          }
        );

        console.log(
          `Message sent to user ${
            message.currentContactId
          } at socket ${recipientSocketId}, message:${JSON.stringify(message)}`
        );
      } else {
        // The recipient is offline, handle appropriately
        console.log(
          `User ${message.currentContactId} is offline. Message cannot be delivered in real-time.`
        );
        // Optional: Store the message in a database for later delivery
        // await saveMessageToDatabase(message);
      }
    } catch (error) {
      console.error("Error checking online status or sending message:", error);
    }
  });

  // Event for disconnect
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    const userKeys = await redisClient.keys("user:*");

    for (const key of userKeys) {
      const storedSocketId = await redisClient.hGet(key, "socketId");

      if (storedSocketId === socket.id) {
        console.log(
          `Found user with socketId: ${socket.id}, removing from Redis: ${key}`
        );
        await redisClient.del(key);
        console.log(`User removed: ${key}`);
        break;
      }
    }

    const updatedUsers = await redisClient.keys("user:*");
    console.log("Updated users after disconnect:", updatedUsers);

    io.emit("getOnlineUsers", updatedUsers);
  });
});

const n = "Emit online users periodically";

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("addUsers", async (userId) => {
    if (!userId) {
      console.log("No userId received!");
      return;
    }

    await redisClient.hSet(`user:${userId}`, "socketId", socket.id);
    const onlineUsers = await redisClient.keys("user:*");
    io.emit("getOnlineUsers", onlineUsers);
  });

  // socket.on("sendMessage", async (message) => {
  //   try {
  //     const recipientKey = `user:${message.currentContactId}`;
  //     const recipientSocketId = await redisClient.hGet(
  //       recipientKey,
  //       "socketId"
  //     );

  //     if (recipientSocketId) {
  //       // The recipient is online, send the message
  //       io.to(recipientSocketId).emit("getMessage", message, (ack) => {
  //         // Log the acknowledgment or perform any action
  //         console.log("Acknowledgment received:", ack);
  //       });
  //       console.log(
  //         `Message sent to user ${message.currentContactId} at socket ${recipientSocketId}, message:`,
  //         message
  //       );
  //     } else {
  //       console.log(`User ${message.currentContactId} is offline.`);
  //     }
  //   } catch (error) {
  //     console.error("Error checking online status or sending message:", error);
  //   }
  // });

  socket.on("sendMessage", async (message, ack) => {
    try {
      ack({ status: "delivered" });
      console.log("ack is:", ack);
      const recipientKey = `user:${message.currentContactId}`;
      const recipientSocketId = await redisClient.hGet(
        recipientKey,
        "socketId"
      );

      if (recipientSocketId) {
        console.log("recipientSocketId:", recipientSocketId);
        // The recipient is online, send the message
        io.to(recipientSocketId).emit("getMessage", message, (ack) => {
          console.log(
            "Acknowledgment from frontend:",
            ack || "No acknowledgment"
          );
          // Acknowledge message delivery
          console.log("message1:", message);
          console.log("Acknowledgment received:", ack);
          // Optionally, emit the acknowledgment back to the sender
          socket.emit("messageDelivered", { status: "delivered" });
          socket.emit("getMessage", message);
        });
        console.log(
          `Message sent to user ${message.currentContactId} at socket ${recipientSocketId}, message:`,
          message
        );
      } else {
        ack({ status: "failed", error: err.message });
        console.log(`User ${message.currentContactId} is offline.`);
        // Handle offline case, maybe save the message for later delivery
      }
    } catch (error) {
      ack({ status: "failed", error: err.message });
      console.error("Error checking online status or sending message:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    const userKeys = await redisClient.keys("user:*");
    for (const key of userKeys) {
      const storedSocketId = await redisClient.hGet(key, "socketId");

      if (storedSocketId === socket.id) {
        console.log(
          `Found user with socketId: ${socket.id}, removing from Redis: ${key}`
        );
        await redisClient.del(key);
        console.log(`User removed: ${key}`);
        break;
      }
    }
    const updatedUsers = await redisClient.keys("user:*");
    io.emit("getOnlineUsers", updatedUsers);
  });
});

setInterval(async () => {
  const onlineUsers = await redisClient.keys("user:*");
  io.emit("getOnlineUsers", onlineUsers);
}, 1000);
