import express from "express";
import logger from "../utils/logger.js";
import multer from "multer";
import authenticateRequest from "../middleware/authMiddleware.js";
import { getAllMedias, uploadMedia } from "../controllers/media.controller.js";

const router = express.Router();

// configuration for file upload using Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    logger.info("Multer Middleware started...");
    upload(req, res, function (error) {
      if (error instanceof multer.MulterError) {
        logger.error("Error while multer upload : ", error);

        return res.status(400).json({
          success: false,
          message: "Error occured, file may be corrupted",
        });
      } else if (error) {
        logger.error("Unknown error occured while uplaoding file : ", err);

        return res
          .status(500)
          .json({ success: false, message: "Internal server error occured" });
      }

      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "File not attached" });

      next();
    });
  },
  uploadMedia,
);

router.get("/getAllMedias", authenticateRequest, getAllMedias);

export default router;
