const express = require("express");
const routes = require("./routes");

const app = express();

app.use(express.json());

// Register all API routes
app.use("/api", routes);

// Error Handler (last middleware)
// const errorMiddleware = require("./middlewares/error.middleware");
// app.use(errorMiddleware);

module.exports = app;
