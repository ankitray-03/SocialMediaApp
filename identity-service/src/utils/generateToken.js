import jwt from "jsonwebtoken";
import crypto from "crypto";

import RefreshToken from "../models/refreshToken.model.js";

const generateToken = async (user) => {
  const accessToken = await jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "60m" },
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + 7); // refresh token valid upto 7 days

  try {
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt,
    });
  } catch (err) {
    throw err;
  }

  return { accessToken, refreshToken };
};

export default generateToken;
