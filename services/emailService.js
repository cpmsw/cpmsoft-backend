const nodemailer = require('nodemailer');

if (!process.env.SMTP_HOST) {
  throw new Error('SMTP environment variables are not set');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  };

  const info = await transporter.sendMail(mailOptions);

  return {
    messageId: info.messageId,
    accepted: info.accepted
  };
}

module.exports = {
  sendEmail
};
