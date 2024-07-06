import mongoose from 'mongoose';

const UserDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide userId'],
    },
    // Storage
    currentStorage: {
      type: Number,
      default: 0,
    },
    totalDataUploaded: {
      type: Number,
      default: 0,
    },
    // Images Data
    totalImagesUploaded: {
      type: Number,
      default: 0,
    },
    imagesOnS3: {
      type: [],
      default: [],
    },
    imageUploads: {
      type: [],
      default: [],
    },
    totalImagesDeleted: {
      type: Number,
      default: 0,
    },
    imageUploadLimit: {
      type: Number,
      default: 20,
    },
    // Password Resets
    totalPasswordResets: {
      type: Number,
      default: 0,
    },
    allPasswordResets: {
      type: [],
      default: [],
    },
    passwordResetRequests: {
      type: [],
      default: [],
    },
    passwordResetLimit: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

const UserData = mongoose.model('UserData', UserDataSchema);

export default UserData;
