import logger from "../utils/logger.js";
import { validateRegistration } from "../utils/validation.js";
import USer from "../models/user.model.js";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit....");
  try {
    // schema validation
    const { error } = validateRegistration(req.body);

    if (error) {
      logger.warn(
        "Validation error while registration",
        error.details[0].message,
      );

      return res.status(400).json({
        success: false,
        message:
          error.details[0].message || "Validation error while registration",
      });
    }

    // validation finished

    const { email, password, username } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      logger.warn("User already registered");

      return res
        .status(400)
        .json({ success: false, message: "User already registered" });
    }

    user = new User(req.body);
    await user.save();

    logger.info("User successfully created with userId : ", user._id);

    const { accessToken, refreshToken } = await generateToken(user);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error("Registration error occured", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};
