import dotenv from "dotenv";
dotenv.config();

// libraries import
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import proxy from "express-http-proxy";

// file import
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./utils/logger.js";

const app = express();
const PORT = process.env.PORT;

const RedisClient = new Redis(process.env.REDIS_URL);

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// rate-limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive Endpoints rate-limit exceeded for IP : ${req.ip}`);
    res.status(429).json({ message: "Too many requests", success: false });
  },

  store: new RedisStore({
    sendCommand: (...args) => RedisClient.call(...args),
  }),
});
app.use(limiter);

// logging the req
app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  logger.info(`$Request body : ${req.body}`);
  next();
});

// proxy implementation
const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },

  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy Error : ${err.message}`);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
      success: false,
    });
  },
};

// Identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response recieved from Identity Service : ${proxyRes.statusCode}`,
      );

      return proxyResData;
    },
  }),
);

// post service

// should be at last
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on PORT : ${PORT}`);
});
