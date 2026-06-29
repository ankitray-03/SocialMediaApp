import { v2 as cloudinary } from "cloudinary";
import logger from "./logger.js";

import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.SECRET_KEY,
});

// function to upload file to cloudinary
export const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error("Cloudinary file upload error : ", error);
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(file.buffer);
  });
};

// code to delete media from cloudinary
export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error("Error while deleting file from Cloudinary : ", error);
    throw error;
  }
};
