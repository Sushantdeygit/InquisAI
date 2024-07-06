import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT } from '../config/globals.config.js';

const TokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: [true, "Please provide userId."],
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60,
  },
});

TokenSchema.pre('save', async function () {
  const salt = await bcrypt.genSalt(Number(BCRYPT_SALT));
  this.token = await bcrypt.hash(this.token, salt);
});
TokenSchema.methods.compareToken = async function (candidateToken) {
  const isMatch = await bcrypt.compare(candidateToken, this.token);
  return isMatch;
};
const Token = mongoose.model('Token', TokenSchema);

export default Token;
