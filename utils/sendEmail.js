const nodemailer = require("nodemailer");

const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
};

exports.sendResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
  console.log(`🔑 [Reset Password Link] Email: ${email} | URL: ${resetUrl}`);
  const transporter = getTransporter();
  
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Password Reset Request - Civix",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #5A3825;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>This mail is from the Civix platform. Please use the link below to reset your password. Do not share it with anyone else and use it within 60 minutes:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #5A3825; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #718096; font-size: 0.875rem;">If the button above does not work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #5A3825;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #a0aec0; font-size: 0.75rem; border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">If you did not request this reset, please ignore this email. This link is valid for 60 minutes.</p>
      </div>
    `,
  });
};

exports.sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`;
  console.log(`📧 [Verification Link] Email: ${email} | URL: ${verifyUrl}`);
  const transporter = getTransporter();
  
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Verify Your Email - Civix",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4CAF50;">Confirm Your Authenticity</h2>
        <p>Hello ${name},</p>
        <p>Welcome to Civix! Please use the link below to verify your email address. Once verified, your account will be fully created and active:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #718096; font-size: 0.875rem;">If the button above does not work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #4CAF50;"><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color: #a0aec0; font-size: 0.75rem; border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">This verification link will expire in 3 minutes.</p>
      </div>
    `,
  });
};
