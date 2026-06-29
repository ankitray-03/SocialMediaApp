import logger from "../utils/logger.js";
import { uploadMediaToCloudinary } from "../utils/cloudinary.js";
import Media from "../models/media.model.js";

const uploadMedia = async (req, res) => {
  logger.info("Uploading of file to Cloudinary Started");

  try {
    if (!req.file) {
      logger.error("Uploading file without any attachment");

      return res
        .status(400)
        .json({ success: false, message: "No file found, Please attach file" });
    }

    const { originalname, mimetype, buffer } = req.file;

    const userId = req.user.userId;

    logger.info(`File details : name = ${originalname}, type=${mimetype}`);
    logger.info(`File uploading to Cloudinary started...`);

    const cloudinaryUplaodResult = await uploadMediaToCloudinary(req.file);

    logger.info(
      `Cloudinary upload successfully. Public id : ${cloudinaryUplaodResult}`,
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUplaodResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUplaodResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(200).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media upload to cloudinary successfull",
    });
  } catch (error) {
    logger.error("Error occured while uploading file to Cloudinary : ", error);

    return res
      .status(500)
      .json({ success: false, message: "Internal Server error" });
  }
};

const getAllMedias = async (req, res) => {
  try {
    const medias = await Media.find({});

    return res.status(201).json({ medias });
  } catch (error) {
    logger.error("Error occured while getting all Medias : ", error);

    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export { uploadMedia, getAllMedias };
