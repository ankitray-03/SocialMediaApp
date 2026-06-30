import Joi from "joi";

const validateCreatePost = (post) => {
  const schema = Joi.object({
    content: Joi.string().min(3).max(5000).required(),
    mediaIds: Joi.array(),
  });

  return schema.validate(post);
};

export default validateCreatePost;
