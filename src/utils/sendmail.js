import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: false,
  auth: {
    user: process.env.GG_MAIL_USER,
    pass: process.env.GG_MAIL_PW,
  },
});

export const sendMail = async (options) => {
  try {
    return transporter.sendMail(options);
  } catch (error) {
    console.error(error, "email not sent");
    throw error;
  }
};

export async function sendPasswordResetEmail(userEmail, token) {
  const resetLink = `${process.env.RESET_PW_URL}/${token}`;

  const mailOptions = {
    from: `"TODO LIST APP" <${process.env.GG_MAIL_USER}>`,
    to: userEmail,
    subject: "Password Reset Request",
    text: `Hi, \n\nYou requested a password reset. Click the link below to reset your password: \n${resetLink} \n\nThis link will expire in 15 minutes. \n\nIf you did not request this, please ignore this email.`,
    html: `
      <p>Hi,</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in <strong>15 minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await sendMail(mailOptions);
  } catch (error) {
    throw new Error("Email could not be sent.");
  }
}
