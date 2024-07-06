import { deleteObjectFromS3, uploadImageToS3 } from '../AWS/S3.AWS.js';
import { DEFAULT_IMAGE_URL } from '../config/globals.config.js';
import User from '../models/user.model.js';

const createUserService = async (data) => {
  const user = await User.create(data);
  if (user) user.password = undefined;
  return user;
};

const fetchUserByIdService = async (userId) => {
  const user = await User.findById({ _id: userId });
  if (user) user.password = undefined;
  return user;
};

const fetchOneUserService = async (params) => {
  const user = await User.findOne(params);
  if (user) user.password = undefined;
  return user;
};

const fetchOneUserWithPasswordService = async (params) => {
  const user = await User.findOne(params);
  return user;
};

const fetchOneUserAndUpdateService = async ({ params, data }) => {
  const user = await User.findOneAndUpdate(params, data, { runValidators: true });
  if (user) user.password = undefined;
  return user;
};

const deleteUserByIdService = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (user) {
    const objectUrl = user.picturePath;
    if (objectUrl !== DEFAULT_IMAGE_URL && !objectUrl.startsWith('https://lh3.googleusercontent.com')) {
      // Delete if the image is not default image
      await deleteObjectFromS3({ userId, objectUrl });
    }
    // Incomplete
    // Delete all projects and portfolio details and Images
    return true;
  } else {
    return false;
  }
};

const updateUserByIdService = async ({ userId, data }) => {
  const { newImage } = data;
  if (newImage) {
    const userImage = await uploadImageToS3({ userId, file: newImage });
    data.picturePath = userImage;

    // Update user but get old details to delete image.
    const user = await User.findByIdAndUpdate(userId, { ...data }, { runValidators: true, new: false });

    // get objectUrl
    const objectUrl = user.picturePath;
    // Delete previous image from S3
    if (objectUrl !== DEFAULT_IMAGE_URL && !objectUrl.startsWith('https://lh3.googleusercontent.com')) {
      await deleteObjectFromS3({ userId, objectUrl });
    }

    // Fetch updated user again
    const updatedUser = await fetchUserByIdService(userId);
    return updatedUser;
  }
  const updatedUser = await User.findByIdAndUpdate(userId, { ...data }, { runValidators: true, new: true });
  updatedUser.password = undefined;
  return updatedUser;
};

export {
  createUserService,
  fetchUserByIdService,
  fetchOneUserService,
  fetchOneUserWithPasswordService,
  deleteUserByIdService,
  updateUserByIdService,
  fetchOneUserAndUpdateService,
};
