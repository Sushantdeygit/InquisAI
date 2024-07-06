import { BadRequestError, NotFoundError, UnauthenticatedError } from '../errors/index.js';
import { fetchUserByIdService, fetchOneUserWithPasswordService, deleteUserByIdService, updateUserByIdService } from '../services/user.service.js';
import { fetchUserDataByUserIdService } from '../services/userData.service.js';
import { resePasswordService } from '../services/auth.service.js';

const getUser = async (req, res) => {
  const { userId } = req.body;
  const user = await fetchUserByIdService(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  const userData = await fetchUserDataByUserIdService(userId);
  if (!userData) {
    throw new NotFoundError('UserData not found');
  }

  return res.status(200).send({ user, userData });
};

const deleteUser = async (req, res) => {
  const { userId } = req.body;
  await deleteUserByIdService(userId);
  return res.status(200).send({ success: true });
};

const updateUser = async (req, res) => {
  const { firstname, lastname, privateProfile, userId } = req.body;
  let data = { firstname, lastname, privateProfile };
  // If there is a new image
  if (req.file) {
    data.newImage = req.file;
  }
  const user = await updateUserByIdService({ userId, data });
  const userData = await fetchUserDataByUserIdService(userId);
  if (!userData) {
    throw new NotFoundError('UserData not found');
  }

  return res.status(200).send({ user, userData });
};

const checkLatestUser = async (req, res) => {
  const { userId } = req.body;
  const user = await fetchUserByIdService(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return res.status(200).send({ latestUser: user.updatedAt });
};

const resetUserPassword = async (req, res) => {
  const { userId, currentPassword, password, confirm, provider } = req.body;
  // Check if all feilds are provided
  if (!password || !confirm || !provider) throw new BadRequestError('Please provide all fields.');
  // Check if passwornd and confirm password matches
  if (password !== confirm) throw new BadRequestError('Passwords and confirm password do not match.');
  // Check if passwornd and old password matches
  if (password === currentPassword) throw new BadRequestError('Your password cannot be same as current password.');
  // Check for provider
  if (provider !== 'portify') throw new BadRequestError('Invalid provider.');
  // Fetch user with password
  const user = await fetchOneUserWithPasswordService({ _id: userId });
  // If the current user has some password but there is not in the request
  if (!currentPassword && user.providers.includes(provider)) throw new BadRequestError('Please provide current password.');
  if (currentPassword) {
    // Compare password
    const auth = await user.comparePassword(currentPassword);
    // If the password is wrong
    if (!auth) throw new UnauthenticatedError(`Wrong current password.`);
    // Reset password
    await resePasswordService({ userId, password });
    return res.status(200).send({ success: true });
  } else {
    await resePasswordService({ userId, password });
    return res.status(200).send({ success: true });
  }
};
export { getUser, deleteUser, updateUser, resetUserPassword, checkLatestUser };
