import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendMail = async (email, subject, link) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GG_MAIL_USER,
        pass: process.env.GG_MAIL_PW,
      },
    });
  } catch (error) {
    console.error(error, "email not sent");
  }
};

export async function sendPasswordResetEmail(userEmail, token) {
  const resetLink = `${process.env.APP_BASE_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Your App Name" <${process.env.GG_MAIL_USER}>`,
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
    const info = await sendMail(userEmail, mailOptions, resetLink);
    console.log(`Password reset email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error);
    throw new Error("Email could not be sent.");
  }
}
