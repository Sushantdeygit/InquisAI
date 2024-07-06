import { AWS_SECRET_ACCESS_KEY, AWS_ACCESS_KEY_ID, AWS_REGION, AWS_S3_BUCKET_NAME, ENV } from '../config/globals.config.js';
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CustomAPIError } from '../errors/index.js';
import { checkUserImageLimitService, updateUserDataOnImageDeleteFromS3, updateUserDataOnImageUploadToS3 } from '../services/userData.service.js';
import { fromUtf8 } from "@aws-sdk/util-utf8-node";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  region: AWS_REGION,
});

const uploadImageToS3 = async ({ userId, file, newUser }) => {
  // Check user Image Limits
  if (!newUser) {
    const limitReached = await checkUserImageLimitService(userId);
    if (limitReached) {
      throw new BadRequestError('Daily limit for uploading images reached');
    }
  }
  const { originalname, buffer, mimetype, size } = file;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  // Create new unique name without spaces
  const newName = uniqueSuffix + '-aws-' + originalname.replace(/ /g, '_');
  // Command to put object in bucket
  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET_NAME,
    Key: newName,
    Body: buffer,
    ContentType: mimetype,
  });
  try {
    if (ENV === 'PRODUCTION') {
      await s3Client.send(command);
    }
    // Construct the URL for the uploaded object
    const objectUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${newName}`;
    console.log(`${objectUrl} \nuploaded successfully to S3.`);
    // Update user data
    if (!newUser) {
      await updateUserDataOnImageUploadToS3({ userId, data: { objectUrl, size, objectKey: newName } });
    }
    return objectUrl; // Return the S3 URL
  } catch (err) {
    console.log(err);
    throw new CustomAPIError('Error uploading Image to S3');
  }
};

const uploadSpeechMarksToS3 = async ({ name, speechMarks }) => {
  const s3Params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: name,
    Body: fromUtf8(speechMarks),
    ContentType: 'application/json',
  };

  // Command to put object in bucket
  const command = new PutObjectCommand(s3Params);
  try {
    console.log(`uploading ${name} to S3.`);
    await s3Client.send(command);
    // Construct the URL for the uploaded object
    const objectUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${name}`;
    console.log(`${objectUrl} uploaded successfully to S3.`);
    return objectUrl; // Return the S3 URL
  } catch (err) {
    console.log(err);
    console.log(`Error uploading Image to S3: ${err.message}`);
    throw new CustomAPIError('Error uploading Image to S3');
  }
};

const uploadAudioBufferToS3 = async ({ name, audioBuffer }) => {
  const s3Params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: name,
    Body: audioBuffer,
    ContentType: 'audio/mp3', // Set content type to WAV
  };

  // Command to put object in bucket
  const command = new PutObjectCommand(s3Params);
  try {
    console.log(`uploading ${name} to S3.`);
    await s3Client.send(command);
    // Construct the URL for the uploaded object
    const objectUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${name}`;
    console.log(`${objectUrl} uploaded successfully to S3.`);
    return objectUrl; // Return the S3 URL
  } catch (err) {
    console.log(err);
    console.log(`Error uploading Image to S3: ${err.message}`);
    throw new CustomAPIError('Error uploading Image to S3');
  }
};

async function checkObjectExistsInS3({ bucketName, objectKey }) {
  try {
    // Construct the parameters for the headObject command
    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };

    // Send the headObject command to check if the object exists
    await s3Client.send(new HeadObjectCommand(params));

    // Object exists
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      // Object does not exist
      console.log(`Object with Key ${objectKey} does not exist in bucket ${AWS_S3_BUCKET_NAME}.`);
      return false;
    } else {
      // Other errors occurred
      console.log(`Error checking object existence in S3: ${error.message}`);
      throw error;
    }
  }
}

async function fetchAudioBufferFromS3({ bucketName, objectKey }) {
  try {
    // Construct the parameters for the getObject command
    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };

    // Send the getObject command to fetch the object
    const { Body } = await s3Client.send(new GetObjectCommand(params));

    // Read the object's content into a buffer
    const data = await streamToBuffer(Body);

    console.log(`Object fetched from S3: ${objectKey}`);

    // Return the object's content as a buffer
    return data;
  } catch (error) {
    console.log('Error fetching object from S3:', error);
    throw error;
  }
}

async function fetchSpeechMarksFromS3({ bucketName, objectKey }) {
  try {
    // Construct the parameters for the getObject command
    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };

    // Send the getObject command to fetch the object
    const { Body } = await s3Client.send(new GetObjectCommand(params));
    const speechMarks = JSON.parse(await Body.transformToString());
    return speechMarks;

  } catch (error) {
    console.log('Error fetching object from S3:');
    throw error;
  }
}

async function fetchObjectFromS3({ bucketName, objectKey }) {
  try {
    // Construct the parameters for the getObject command
    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };

    // Send the getObject command to fetch the object
    const { Body } = await s3Client.send(new GetObjectCommand(params));

    const data = Body;
    console.log(`Object fetched from S3: ${objectKey}`);

    return data;
  } catch (error) {
    console.log('Error fetching object from S3:');
    throw error;
  }
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}


async function generateS3PreSignedUrl(fileKey) {
  try {
    // Create an S3 client

    // Parameters for the getObject command
    const getObjectParams = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: fileKey,
    };

    // Generate the pre-signed URL
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return url;
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw error;
  }
}

// Function to delete an object from an S3 bucket
const deleteObjectFromS3 = async ({ userId, objectUrl }) => {
  const objectKey = objectUrl.split(`https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`)[1];
  try {
    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: objectKey,
    };
    const deleteCommand = new DeleteObjectCommand(params);
    if (ENV === 'PROD') {
      await s3Client.send(deleteCommand);
    }
    console.log(`${objectKey} deleted successfully from S3.`);
    await updateUserDataOnImageDeleteFromS3({ userId, objectKey });
    return objectUrl;
  } catch (error) {
    console.log(error);
    throw new CustomAPIError('Error deleting Image from S3');
  }
};


export {
  uploadImageToS3,
  uploadAudioBufferToS3,
  uploadSpeechMarksToS3,
  checkObjectExistsInS3,
  fetchAudioBufferFromS3,
  fetchSpeechMarksFromS3,
  fetchObjectFromS3,
  generateS3PreSignedUrl,
  deleteObjectFromS3
};
