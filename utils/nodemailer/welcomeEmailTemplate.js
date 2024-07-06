export const welcomeEmailTemplate = (data) => {
  const { username, email } = data;
  return {
    to: email,
    subject: 'Welcome to Portify!',
    html: `<!DOCTYPE html>
    <html lang='en'>
    <head>
      <meta charset='UTF-8' />
      <title>Welcome to Portify!</title>
      <style>
        /* Email wrapper styles */
        .container {
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
          margin-top: 15px;
        }
    
        /* Footer text styles */
        footer {
          margin-top: 20px;
          font-size: 14px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class='container'>
        <h1>Welcome to Portify!</h1>
        <p>Dear ${username},</p>
        <p>
          We are thrilled to welcome you to Portify! Thank you for registering with us. You've taken the first step towards accessing a world of
          <em><strong>projects and portfolios!.</strong></em>
        </p>
        <p>Your account has been successfully created.</p>
        <ul>
          <li><strong>Username/Email:</strong> ${email}</li> 
        </ul>
        <p>Please click the button below to log in and get started.</p>
        <a href='https://portify.website/login' class='btn'>Log In Now</a>
        <p>Once again, welcome to Portify! We hope you enjoy your experience with us.</p>
        <footer>
          <p>Best regards,<br />Portify Team</p>
        </footer>
      </div>
    </body>
    </html>
    
`,
  };
};
