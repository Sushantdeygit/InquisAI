import { welcomeEmailTemplate } from '../utils/nodemailer/welcomeEmailTemplate.js';
import { resetPasswordTemplate } from '../utils/nodemailer/resetPasswordTemplate.js';
import { GOOGLE_APP_PASSWORD, GOOGLE_USER_ID, ENV } from '../config/globals.config.js';
import nodemailer from 'nodemailer';
import { BadRequestError, CustomAPIError } from '../errors/index.js';

// Create a transporter with Gmail SMTP details
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: GOOGLE_USER_ID,
    pass: GOOGLE_APP_PASSWORD,
  },
});

let mailOptions = {
  from: GOOGLE_USER_ID,
};

const sendEmailService = async ({ type, data }) => {
  const { email } = data;
  let error = false;
  switch (type) {
    case 'register':
      mailOptions = { ...mailOptions, ...welcomeEmailTemplate(data) };
      break;
    case 'passwordReset':
      mailOptions = { ...mailOptions, ...resetPasswordTemplate(data) };
      break;

    default:
      error = true;
  }
  if (error) {
    throw new BadRequestError('Please provide email type.');
  } else {
    try {
      if (ENV === 'PRODUCTION') {
        await transporter.sendMail(mailOptions);
      }
      console.log(`${type} Email successfully sent to ${email}.`);
      return true;
    } catch (error) {
      console.error('Error occurred:', error);
      throw new BadRequestError('Error while sending Email');
    }
  }
};
export { sendEmailService };
