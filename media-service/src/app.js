import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
dotenv.config();

import dns from "node:dns";

import MediaRoutes from "./routes/media.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { connectTORabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import handlePostDeleted from "./eventHandlers/media.event.handler.js";

const app = express();
const PORT = process.env.PORT || 3001;

// connecting to databse
// Use Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to Mongodb database !"))
  .catch((e) => logger.error("Mongodb connection error", e));

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Request ${req.method} to ${req.url}`);
  logger.info(`Request Body : ${req.body}`);

  next();
});

// All routes
app.use("/api/media", MediaRoutes);

// error handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectTORabbitMQ();

    // consume the event
    await consumeEvent("post.deleted", handlePostDeleted);

    // listening to port
    app.listen(PORT, () => {
      logger.info(`Server running on PORT : ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect server : ", error);
    process.exit(1);
  }
}

startServer();

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled rejection at : ${promise} due to : ${reason}`);
});
