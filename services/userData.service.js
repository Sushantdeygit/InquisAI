import { BadRequestError } from '../errors/index.js';
import UserData from '../models/userData.model.js';

// To keep track of user data
const createUserDataService = async (data) => {
  const userData = await UserData.create(data);
  return userData;
};

const fetchUserDataByUserIdService = async (userId) => {
  const userData = await UserData.findOne({ userId });
  return userData;
};

const checkUserImageLimitService = async (userId) => {
  const userData = await fetchUserDataByUserIdService(userId);
  if (!userData) throw new BadRequestError('User not found');

  const { imageUploads, imageUploadLimit } = userData;
  // Check Reset limit on every request
  if (imageUploads?.length > 0) {
    // Check for the oldest image
    const oldestImageUploaded = imageUploads[0];
    // Get the date and time
    const { uploaded } = oldestImageUploaded;
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check if the oldest image was uploaded more than 24 hours ago
    if (new Date(uploaded) < twentyFourHoursAgo) {
      // Clear the imageUploads array
      userData.imageUploads = [];
      await userData.save();
    }
  }
  if (imageUploads.length < imageUploadLimit) {
    //   If there is space then return false
    return !(imageUploads.length < imageUploadLimit);
  } else {
    // Check for the oldest image
    const oldestImageUploaded = imageUploads[0];

    // Get the date and time
    const { uploaded } = oldestImageUploaded;

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check if the oldest image was uploaded more than 24 hours ago
    if (new Date(uploaded) < twentyFourHoursAgo) {
      // Clear the imageUploads array
      userData.imageUploads = [];
      await userData.save(); // Save the updated userData
      return false;
    } else {
      return true;
    }
  }
};

// Email request limit
const emailRequestLimitForPasswordResetService = async (userId) => {
  const userData = await fetchUserDataByUserIdService(userId);
  if (!userData) throw new BadRequestError('User not found');
  const { passwordResetRequests, passwordResetLimit } = userData;

  // If new user
  if (passwordResetRequests.length === 0) return { limitReached: false, cooldown: false };

  //  If there is still limit
  if (passwordResetRequests.length < passwordResetLimit) {
    // Check for the latest password reset
    const latestPasswordReset = passwordResetRequests[passwordResetRequests.length - 1];
    const { resetTime } = latestPasswordReset;
    // Calculate 1 hours ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    // Check for cooldown if password as reset less than 1 hr ago
    if (new Date(resetTime) > oneHourAgo) {
      // Cooldown is true
      return { limitReached: false, cooldown: true };
    } else {
      // Cooldown is false
      return { limitReached: false, cooldown: false };
    }
  } else {
    // Check for the oldest password reset
    const oldestPasswordReset = passwordResetRequests[0];
    // Get the date and time
    const { resetTime } = oldestPasswordReset;
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Check if the oldest password was reset more than 24 hours ago
    if (new Date(resetTime) < twentyFourHoursAgo) {
      // Clear the passwordResetRequests array
      userData.passwordResetRequests = [];
      await userData.save(); // Save the updated userData
      return { limitReached: false, cooldown: false };
    } else {
      return { limitReached: true, cooldown: false };
    }
  }
};

// Upload to S3
const updateUserDataOnImageUploadToS3 = async ({ userId, data }) => {
  try {
    const { objectUrl, size, objectKey } = data;
    const fileSizeInMb = Number((size / (1024 * 1024)).toFixed(2));
    const formattedData = {
      $push: {
        imageUploads: { objectUrl, uploaded: new Date(), size: fileSizeInMb },
        imagesOnS3: { objectKey, objectUrl, uploaded: new Date(), size: fileSizeInMb },
      },
      $inc: {
        totalImagesUploaded: 1,
        totalDataUploaded: fileSizeInMb,
        currentStorage: fileSizeInMb,
      },
    };
    await updateUserDataByUserIdService({ userId, data: formattedData });
  } catch (error) {
    console.log(error);
  }
};

// Delete from S3
const updateUserDataOnImageDeleteFromS3 = async ({ userId, objectKey }) => {
  try {
    const userData = await fetchUserDataByUserIdService(userId);
    if (!userData) throw new BadRequestError('User not found');
    // get current image details
    const currentImage = userData.imagesOnS3.filter((item) => item.objectKey === objectKey)[0];
    const { objectUrl, size } = currentImage;
    const formattedData = {
      $pull: {
        imagesOnS3: { objectUrl },
      },
      $inc: {
        totalImagesDeleted: 1,
        currentStorage: -size,
      },
    };
    await updateUserDataByUserIdService({ userId, data: formattedData });
  } catch (error) {
    console.log(error);
  }
};

// On password reset request
const updateUserDataOnPasswordResetRequest = async ({ userId }) => {
  try {
    const data = {
      $push: {
        passwordResetRequests: { resetTime: new Date() },
      },
    };
    await updateUserDataByUserIdService({ userId, data });
  } catch (error) {
    console.log(error);
  }
};

// Update user data on password reset
const updateUserDataOnPasswordReset = async ({ userId }) => {
  try {
    const data = {
      $push: {
        allPasswordResets: { resetTime: new Date() },
      },
      $inc: {
        totalPasswordResets: 1,
      },
    };
    await updateUserDataByUserIdService({ userId, data });
  } catch (error) {
    console.log(error);
  }
};

const updateUserDataByUserIdService = async ({ userId, data }) => {
  const updatedUser = await UserData.findOneAndUpdate({ userId }, { ...data }, { runValidators: true, new: true });
  return updatedUser;
};
const deleteUserDataByUserIdService = async (userId) => {
  const deletedUser = await UserData.deleteOne({ userId }, { new: true });
  return deletedUser;
};

export {
  createUserDataService,
  fetchUserDataByUserIdService,
  updateUserDataByUserIdService,
  deleteUserDataByUserIdService,
  checkUserImageLimitService,
  emailRequestLimitForPasswordResetService,
  updateUserDataOnImageUploadToS3,
  updateUserDataOnImageDeleteFromS3,
  updateUserDataOnPasswordResetRequest,
  updateUserDataOnPasswordReset,
};
