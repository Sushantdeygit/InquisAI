import { BadRequestError, CustomAPIError, NotFoundError, UnauthenticatedError } from '../errors/index.js';
import {
  verifyGoogleIdTokenService,
  requestResetUserPasswordService,
  verifyResePasswordTokenService,
  resePasswordService,
} from '../services/auth.service.js';
import {
  fetchOneUserService,
  createUserService,
  updateUserByIdService,
  fetchOneUserWithPasswordService,
  fetchUserByIdService,
} from '../services/user.service.js';

import {
  createUserDataService,
  emailRequestLimitForPasswordResetService,
  fetchUserDataByUserIdService,
  updateUserDataOnPasswordResetRequest,
} from '../services/userData.service.js';
import { sendEmailService } from '../services/nodemailer.service.js';
import { uploadImageToS3 } from '../AWS/S3.AWS.js';
import { DEFAULT_IMAGE_URL } from '../config/globals.config.js';

import Token from '../models/token.model.js';

const registerUser = async (req, res) => {
  const { username, firstname, lastname, email, password, provider, googleIdToken } = req.body;
  if (!username || !firstname || !email || !provider) {
    throw new BadRequestError('Please provide all fields');
  }
  // Set common data
  let data = { username, firstname, lastname, email, providers: [provider], picturePath: DEFAULT_IMAGE_URL };
  // If provider is google
  if (provider === 'google') {
    if (!googleIdToken) throw new BadRequestError('Google Token required for authentication.');
    // Do google verification
    const verified = await verifyGoogleIdTokenService(googleIdToken);
    if (verified.error) {
      throw new BadRequestError(verified.msg);
    }
    // Get data from google id token
    const { email_verified, picture, email: googleEmail } = verified;
    if (email === googleEmail) {
      data.verifiedProfile = email_verified === 'true' ? true : false;
      // Add google image to picture path
      data.picturePath = picture;
    } else {
      throw new BadRequestError('Email missmatch');
    }
    // If provider is portify (credentials)
  } else if (provider === 'portify') {
    if (!password) throw new BadRequestError('Please provide password.');
    //  Add password details to data
    data.password = password;

    // If there is user image, Upload  to S3
    if (req.file) {
      const newImage = await uploadImageToS3({ userId, file: req.file, newUser: true });
      data.picturePath = newImage
    }
  } else {
    throw new BadRequestError('Invalid provider');
  }

  // Create user
  const user = await createUserService(data);
  // Create userData
  const { _id: userId } = user;
  await createUserDataService({ userId });

  // Send Email
  await sendEmailService({ type: 'register', data: { email, username } });
  return res.status(200).send({ msg: 'User created successfully' });
};

/* Logs in a user */
const loginUser = async (req, res) => {
  // await Token.deleteMany();
  // await UserData.deleteMany();
  // await User.deleteMany();
  const { email, password, provider, googleIdToken } = req.body;
  const user = await fetchOneUserWithPasswordService({ email });
  if (!user) throw new NotFoundError(`No user with email ${email}`);
  // Incase the provider gets updated
  let updatedUser;
  // If provider is google
  if (provider === 'google') {
    if (!googleIdToken) throw new BadRequestError('Google Id Token required for authentication.');
    // Do google verification
    const verified = await verifyGoogleIdTokenService(googleIdToken);
    const { error, picture, email: googleEmail } = verified;
    if (error) {
      throw new BadRequestError(verified.msg);
    }
    if (email !== googleEmail) {
      throw new BadRequestError('Email missmatch');
    }
    // check if user have google in providers
    const { _id } = user;
    const data = {};
    if (!user.providers.includes(provider)) {
      data.providers = [...user.providers, provider];
    }
    data.picturePath = user.picturePath === DEFAULT_IMAGE_URL ? picture : user.picturePath;
    data.verifiedProfile = verified.email_verified;
    // Update user
    updatedUser = await updateUserByIdService({ userId: _id, data });
    // If provider is portify (credentials)
  } else if (provider === 'portify') {
    if (!password) throw new BadRequestError('Please provide password.');
    if (user.providers.includes('portify')) {
      const auth = await user.comparePassword(password);
      if (!auth) throw new UnauthenticatedError(`Wrong password`);
    } else {
      throw new UnauthenticatedError(`No password created, please click forgot passowrd`);
    }
  } else {
    throw new BadRequestError('Invalid provider');
  }
  user.password = undefined;
  const token = user.createJWT();
  const userData = await fetchUserDataByUserIdService(user._id);
  if (!userData) {
    throw new NotFoundError('UserData not found');
  }
  return res.status(200).send({ token, user: provider === 'google' ? updatedUser : user, provider, userData });
};

// Request reset user password
const requestResetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new BadRequestError('Please provide email');
  }
  const user = await fetchOneUserService({ email });
  if (!user) {
    throw new BadRequestError('Email not registered with portify');
  }
  const { limitReached, cooldown } = await emailRequestLimitForPasswordResetService(user._id);
  // If password reset limit reached or is on cooldown
  if (limitReached) {
    throw new BadRequestError(`Daily password reset limit reached!. Please try again in 24hrs.`);
  }
  if (cooldown) {
    throw new BadRequestError(`We have already sent and email to ${email}. Please try again in 1hr.`);
  }
  const resetRequest = await requestResetUserPasswordService(user);
  await updateUserDataOnPasswordResetRequest({ userId: user._id });
  return res.status(200).send({ success: resetRequest });
};

// Verify reset token
const verifyResetToken = async (req, res) => {
  const { userId, resetToken } = req.body;
  if (!userId || !resetToken) {
    throw new BadRequestError('Please provide userId and resetToken');
  }
  const valid = await verifyResePasswordTokenService({ userId, resetToken });
  if (valid) {
    const user = await fetchUserByIdService(userId);
    return res.status(200).send({ valid, username: user.username });
  } else {
    throw new BadRequestError('Invalid reset token');
  }
};

// Reset user password
const resetPasswordUsingToken = async (req, res) => {
  const { userId, resetToken, password } = req.body;
  if (!userId || !resetToken || !password) {
    throw new BadRequestError('Please provide all fields');
  }
  const valid = await verifyResePasswordTokenService({ userId, resetToken });
  if (valid) {
    // reset password service
    const success = await resePasswordService({ userId, password });
    if (success) {
      await Token.deleteOne({ userId });
      return res.status(200).send({ success });
    } else {
      throw new CustomAPIError('Error in reseting the password');
    }
  } else {
    throw new BadRequestError('Invalid reset token');
  }
};

const userExist = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new BadRequestError('Please provide email');
  }
  const user = await fetchOneUserService({ email });
  if (!user) {
    return res.status(200).send({ found: false });
  } else {
    return res.status(200).send({ found: true });
  }
};
export {
  registerUser,
  loginUser,
  userExist,
  requestResetPassword,
  verifyResetToken,
  resetPasswordUsingToken,
};
