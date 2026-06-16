// This is my application entry point.

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const cron = require('node-cron');
const { sendweeklyMemory } = require('./controllers/entryController');

// To initiazile Express

const app = express();
const PORT = process.env.PORT || 9000;

// To connect to my Mongo DB

connectDB();

// Implementing the middlewares

// app.use(cors({ // this is to add the front end (ReactJs) url

// }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Implementing the Routes

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/entries", require("./routes/entryRoutes"));

// Health Check

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "okay",
    Timestamp: new Date(),
  });
});

// Schedule weekly activities

// Error Handler
app.use(errorHandler);

// Using to use.all function to handle all URL request and display error when they fail. Not that this request is meant to be below every route.
app.all("*path", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    messsage: `Can't find ${req.url} on this application!`,
  });
});

// To start application

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
