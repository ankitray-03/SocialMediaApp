import dotenv from "dotenv";
dotenv.config();

import express from "express";
import logger from "./utils/logger.js";
import mongoose from "mongoose";
import Redis from "ioredis";
import helmet from "helmet";
import cors from "cors";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import errorHandler from "./middlewares/errorHandler.js";
import routes from "./routes/identity-service-routes.js";
import dns from "node:dns";

// Use Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const PORT = process.env.PORT || 3001;

// connecting to databse
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to Mongodb database !"))
  .catch((e) => logger.error("Mongodb connection error", e));

// redis client
const redisClient = new Redis(process.env.REDIS_URL);

// middleware
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info("Request body: ", req.body);

  next();
});

// DDos protection and rate limiter
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});
app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch((error) => {
      logger.error(`Rate limit exceeds for ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

// rate limit for sensitive endpoints
const sensitveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    logger.info(`Sensitive endpoints rate limit exceeds for ${req.ip}`);

    res.status(429).json({
      success: false,
      message: "Too many requests to sensitive endpoints",
    });
  },

  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// setting rate limit for sensitive endpoints
app.use("/api/auth/register", sensitveEndpointLimiter);

// all routes here
app.use("/api/auth", routes);

// error handler
app.use(errorHandler);

// running server on the PORT
app.listen(PORT, () => {
  logger.info(`Identity service running on http;//localhost:${PORT}`);
});

// unhandled rejection
process.on("unhandledRejection", (reason, promise) => {
  console.log(reason);
  logger.error("Unhandled rejection at : ", promise, " reason : ", reason);
});
