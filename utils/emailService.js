const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Built-in service for Gmail
      auth: {
        user: process.env.EMAIL_USER, // Load from .env
        pass: process.env.EMAIL_PASS, // Load from .env
      },
    });

    const mailOptions = {
      from: `"HealthConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    // Add HTML if provided
    if (html) {
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email Sent] To: ${to} | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Email Error]', error);
    throw error; // Rethrow so the controller knows it failed
  }
};

module.exports = sendEmail;
