import { config } from 'dotenv';
config();

// Server secrets
export const PORT = process.env.PORT || 5000;
export const DEFAULT_IMAGE_URL = process.env.DEFAULT_IMAGE_URL;
export const BCRYPT_SALT = process.env.BCRYPT_SALT || 10;
export const CLIENT_URL = process.env.CLIENT_URL;
export const ENV = process.env.ENV;

// MongoDB keys
export const MONGO_URI = process.env.MONGO_URI;

// JWT keys
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_LIFETIME = process.env.JWT_LIFETIME || '30d';

// Google Keys used for nodemailer
export const GOOGLE_APP_PASSWORD = process.env.GOOGLE_APP_PASSWORD;
export const GOOGLE_USER_ID = process.env.GOOGLE_USER_ID;

// Open AI Credentials
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Deepgram Transcribe key
export const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// AWS Credentials
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
