import { fetchOneUserAndUpdateService } from './user.service.js';
import { CLIENT_URL } from '../config/globals.config.js';
import { sendEmailService } from './nodemailer.service.js';
import { BadRequestError, CustomAPIError } from '../errors/index.js';
import { updateUserDataOnPasswordReset } from './userData.service.js';
import jwt from 'jsonwebtoken';
import Token from '../models/token.model.js';
import crypto from 'crypto';

const requestResetUserPasswordService = async (user) => {
  const { _id: userId } = user;
  const token = await Token.findOne({ userId });
  // If there is already a token then reset it
  if (token) {
    await token.deleteOne();
  }
  // Create a new token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Save it to token db
  await new Token({
    userId: user._id,
    token: resetToken,
    createdAt: Date.now(),
  }).save();
  // Get data to pass to the email template
  const { email, username } = user;

  const resetPasswordLink = CLIENT_URL + `auth/resetpassword/${resetToken}?id=${userId}`;
  const devResetPasswordLink = 'http://localhost:3000/' + `auth/resetpassword/${resetToken}?id=${userId}`;
  console.log(devResetPasswordLink);
  return await sendEmailService({ type: 'passwordReset', data: { email, username, resetPasswordLink } });
};

const resePasswordService = async ({ userId, password }) => {
  // Find user and update
  const params = { _id: userId };
  const data = { password };
  const user = await fetchOneUserAndUpdateService({ params, data });
  await updateUserDataOnPasswordReset({ userId });
  // If there was no password ever
  if (!user.providers.includes('portify')) {
    await user.updateOne({ providers: [...user.providers, 'portify'] });
  }
  if (!user) throw new CustomAPIError('Unexpected error occured. Service: Password-Reset');
  return user;
};

const verifyResePasswordTokenService = async ({ userId, resetToken }) => {
  // Find token
  const token = await Token.findOne({ userId });
  if (token) {
    // check if token is valid or not
    const validToken = await token.compareToken(resetToken);
    if (validToken) {
      // return true if valid token
      return true;
    } else {
      // Else return false
      return false;
    }
  } else {
    throw new BadRequestError('No/Expired reset token.');
  }
};
// Verify google token service
async function verifyGoogleIdTokenService(idToken) {
  try {
    //  Check if the token is valid and retrieve user information
    const token = jwt.decode(idToken);
    return token;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return { error: true, msg: 'Id Token verification failed' };
  }
}

export { verifyGoogleIdTokenService, requestResetUserPasswordService, verifyResePasswordTokenService, resePasswordService };
