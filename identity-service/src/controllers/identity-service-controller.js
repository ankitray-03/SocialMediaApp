import logger from "../utils/logger.js";
import { validateRegistration, validateLogin } from "../utils/validation.js";
import RefreshToken from "../models/refreshToken.model.js";
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

export const loginUser = async (req, res) => {
  logger.info("Login endpoint hit...");

  try {
    const { error } = validateLogin(req.body);

    if (error) {
      logger.warn("Login validation failed ! ", error.details[0].message);

      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("User not found in DB.");

      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // comparing password
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      logger.warn("Invalid password");

      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    const { accessToken, refreshToken } = await generateToken(user);

    return res
      .status(201)
      .json({ success: true, accessToken, refreshToken, userId: user._id });
  } catch (err) {
    logger.error("Login error occurred : ", err);

    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const refreshTokenUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      // body doesn't contains refresh token
      logger.warn("Body does not contains Refreshtoken");

      return res
        .status(400)
        .json({ success: false, message: "Refresh token missing" });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Refresh token expired");

      return res.status(400).json({
        success: false,
        message: "Refresh token expired or not found",
      });
    }

    const user = await User.findById(storedToken.user);

    if (!user) {
      logger.warn("Corresponding user to refresh token not found");

      return res
        .status(401)
        .json({ success: false, message: "Corresponding user not found" });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    // delete old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    return res.status(201).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Refresh token error occured : ", error);

    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn("Refresh token missing in body");

      return res
        .status(400)
        .json({ success: false, message: "Refresh token is missing" });
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh token deleted , logout successfull");

    return res
      .status(201)
      .json({ success: true, message: "Logout successfull" });
  } catch (error) {
    logger.error("Logout error occured : ", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
