import logger from "logger";
import Post from "../models/post.model.js";
import validatePost from "../utils/validation.js";

// for deleting posts after any update from redis cache
async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;

  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");

  if (keys.length > 0) await req.redisClient.del(keys);
}

// create a single post
export const createPost = async (req, res) => {
  logger.infor("CreatePost Endpint hit...");

  try {
    // body -> {content:"",mediaIds:[]}
    const { error } = validatePost(req.body);

    if (Error) {
      logger.error("Post validation failed : ", error.details[0].message);

      return res
        .status(400)
        .json({ success: false, message: "Incorrect post format" });
    }

    const newPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();
    logger.info(`Post with id : ${newPost._id.toString()} created.`);

    await invalidatePostCache(req, newPost._id.toString());
    logger.info(`Post with id : ${newPost._id.toString()} cached to redis.`);

    return res
      .status(201)
      .json({ success: true, message: "Post created successfully" });
  } catch (error) {
    logger.error("Error while creating a single Post : ", error);

    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
