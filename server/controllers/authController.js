import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';

// Configure Nodemailer (You'll need to fill in your email service details)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // e.g., 'Gmail', 'SendGrid'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User Not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(404).json({ success: false, error: "Wrong Password" });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "10d" }
    );

    return res
      .status(200)
      .json({
        success: true,
        token,
        user: { _id: user._id, name: user.name, role: user.role },
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
};

export const verify = (req, res) => {
  return res.status(200).json({ success: true, user: req.user })
}

// Request password reset OTP
export const requestPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Requesting OTP for email:', email); // Debug log

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email); // Debug log
      return res.status(404).json({ success: false, error: "User with that email not found" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otp); // Debug log

    // Set OTP and expiry time (e.g., 10 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    console.log('OTP saved to user document'); // Debug log

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
    };

    console.log('Email configuration:', {
      service: process.env.EMAIL_SERVICE,
      user: process.env.EMAIL_USER,
      from: process.env.EMAIL_FROM
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending OTP email:', error);
        console.error('Error details:', {
          code: error.code,
          command: error.command,
          responseCode: error.responseCode,
          response: error.response
        });
      } else {
        console.log('OTP Email sent successfully:', {
          messageId: info.messageId,
          response: info.response,
          preview: nodemailer.getTestMessageUrl(info)
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });

  } catch (error) {
    console.error('Error in requestPasswordResetOTP:', error);
    res.status(500).json({ success: false, error: "Failed to request password reset OTP" });
  }
};

// Reset password using OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }, // Check if OTP is not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP fields
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined; // Clear OTP
    user.resetPasswordExpires = undefined; // Clear expiry
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, error: "Failed to reset password" });
  }
};

