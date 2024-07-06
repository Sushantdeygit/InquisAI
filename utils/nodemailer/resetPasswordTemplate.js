export const resetPasswordTemplate = (data) => {
  const { username, email, resetPasswordLink } = data;
  return {
    to: email,
    subject: 'Reset Password!',
    html: `  
    <!DOCTYPE html>
    <html lang='en'>
    <head>
      <meta charset='UTF-8' />
      <title>Reset Your Password</title>
      <style>
        /* Email wrapper styles */
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          line-height: 1.6;
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          background-color: #fff;
        }
    
        /* Heading styles */
        h1 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #333;
        }
    
        /* Button styles */
        .btn {
          display: inline-block;
          padding: 10px 20px;
          text-decoration: none;
          color: #fff;
          background-color: #007bff;
          border-radius: 4px;
        }
    
        /* Footer text styles */
        .footer-text {
          margin-top: 20px;
          font-size: 14px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class='email-wrapper'>
        <h1>Reset Your Password</h1>
        <p>Dear ${username},</p>
        <p>You are receiving this email because a request was made to reset your password for Portify. If you did not request this change, you can safely ignore this email.</p>
        <p>To reset your password for the account associated with ${email}, please click on the following button:</p>
        <a href='${resetPasswordLink}' class='btn'>Reset Password</a>
        <p>This link will expire in 1 hours. If the link has expired, you can request a new password reset.</p>
        <p>For security reasons, please do not share this link with anyone.</p>
        <p class='footer-text'>Thank you,<br />Portify Team</p>
      </div>
    </body>
    </html>
  `,
  };
};
