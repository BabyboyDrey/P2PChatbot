const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDb = require("./db/database");
const path = require("path");
const userRoutes = require("./controllers/users");

const morgan = require("morgan");
const app = express();

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    path: ".env",
  });
}

app.use(
  cors({
    origin: ["http://localhost:5173"],
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

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'))
//  })

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
