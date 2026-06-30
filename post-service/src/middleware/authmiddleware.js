import logger from "../utils/logger.js";

const authenticateRequest = (req, res, next) => {
  console.log("MEdia endpoint hit");
  const userId = req.headers["x-user-id"];

  if (!userId) {
    logger.warn(
      "Access attempt to media Service without authentication from IP : ",
      req.ip,
    );

    return res.status(401).json({
      success: false,
      message: "Authentication required ! , Please login to continue",
    });
  }

  req.user = { userId };

  next();
};

export default authenticateRequest;
