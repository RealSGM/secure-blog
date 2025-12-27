const nodemailer = require('nodemailer');
require('dotenv').config();

function sendResetEmail(email, resetURL) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  var mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Password',
    text: resetURL
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

function send2FAEmail(email, code) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  var mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '2FA Code',
    text: `Your 2FA code is: ${code}\n
    This code will expire in 5 minutes.`
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = {
    sendResetEmail,
    send2FAEmail
};
