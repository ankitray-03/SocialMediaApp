import Media from "../models/media.model.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

const handlePostDeleted = async (event) => {
  console.log(event, " : PostDeleteEvent");

  const { postId, mediaIds } = event;

  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);

      logger.info(`Media with  Id : ${media.publicId} deleted from cloudinary`);

      await Media.findByIdAndDelete(media._id);

      logger.info(`Media deleted from MongoDB with Media-ID : ${media._id}`);
    }
  } catch (error) {
    logger.error(error, "Error occured while Post deletion");
  }
};

export default handlePostDeleted;
