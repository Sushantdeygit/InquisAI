import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_LIFETIME, BCRYPT_SALT, DEFAULT_IMAGE_URL } from '../config/globals.config.js';
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide first name.'],
      match: [/^[A-Za-z][A-Za-z0-9]*$/, 'Invalid Username'],
      unique: true,
      minlength: 3,
      maxlength: 50,
    },
    firstname: {
      type: String,
      required: [true, 'Please provide first name.'],
      match: [/^[A-Za-z]*$/, 'Invalid firstname'],
      minlength: 1,
      maxlength: 50,
    },
    lastname: {
      type: String,
      // required: [true, 'Please provide last name.'],
      match: [/^[A-Za-z]*$/, 'Invalid lastname'],
      minlength: 1,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Please provide email.'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide valid email',
      ],
      unique: true,
      minlength: 3,
      maxlength: 50,
    },
    password: {
      type: String,
      minlength: 6,
      maxlength: 500,
    },
    picturePath: {
      type: String,
      default: '',
    },
    providers: {
      type: [],
      default: [],
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (this.password) {
    const salt = await bcrypt.genSalt(Number(BCRYPT_SALT));
    this.password = await bcrypt.hash(this.password, salt);
  }
});
UserSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  if (update.password) {
    if (update.password.length < 6) {
      throw new BadRequestError('At least 6 characters are required.');
    }
    try {
      const hashedPassword = await bcrypt.hash(update.password, Number(BCRYPT_SALT)); // Hash the password with bcrypt
      this.set({ password: hashedPassword }); // Use set() to set the hashed password in the query
    } catch (error) {
      throw new Error(error);
    }
  }
});

UserSchema.methods.createJWT = function () {
  return jwt.sign({ id: this._id }, JWT_SECRET, {
    expiresIn: JWT_LIFETIME,
  });
};

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};
const User = mongoose.model('User', UserSchema);

export default User;
