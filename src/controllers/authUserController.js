const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Helper: Generate OTP
const generateOtp = async (user) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    const otpHash = await bcrypt.hash(otp, 10); // Hash the OTP
    const otpExpiry = new Date(Date.now() + 8 * 60 * 1000); // Expire after 8 minutes

    // Save OTP hash and expiry to user
    user.otpHash = otpHash;
    user.otpExpiry = otpExpiry;
    await user.save();

    return otp; // Return the plain OTP for sending
  } catch (error) {
    console.error('Error generating OTP:', error);
    throw new Error('Could not generate OTP');
  }
};

// Helper: Validate OTP
const validateOtp = async (user, otp) => {
  try {
    if (user.otpExpiry && user.otpExpiry < Date.now()) {
      return { valid: false, message: 'OTP has expired' };
    }
    const isMatch = await bcrypt.compare(otp, user.otpHash);
    return isMatch
      ? { valid: true, message: 'OTP is valid' }
      : { valid: false, message: 'Invalid OTP' };
  } catch (error) {
    console.error('Error validating OTP:', error);
    throw new Error('Could not validate OTP');
  }
};

// Send OTP to User's email
const sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = await generateOtp(user);

    // Create a transporter object
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use the email provider's service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Replace with your email password or app-specific password
      },
    });

    // Define the email options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to: email, // Receiver's email
      subject: 'Your OTP Code from Mehndi Profile',
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 0;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .header h2 {
                color: #4CAF50;
                font-size: 24px;
              }
              .content {
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 20px;
              }
              .footer {
                text-align: center;
                font-size: 14px;
                color: #888;
                margin-top: 30px;
              }
              .otp {
                font-weight: bold;
                font-size: 18px;
                color: #4CAF50;
              }
              .cta {
                display: block;
                text-align: center;
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
              }
              .cta:hover {
                background-color: #45a049;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Agrive Mart - OTP Verification</h2>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>Thank you for choosing Mehndi Profile! We have received your request for verification. Please use the OTP code below to complete your action:</p>
                <p class="otp">${otp}</p>
                <p>This OTP is valid for the next 8 minutes.</p>
                <p>If you did not request this, please ignore this message.</p>
              </div>
              <div class="footer">
                <p>Best regards,</p>
                <p><strong>Mehndi Profile Team</strong></p>
                <p>For support, contact us at: <a href="agrivemart3@gmail.com" target="_blank">agrivemart3@gmail.com</a></p>
              </div>
            </div>
          </body>
        </html>
      `, // HTML body
    };


    // Send the email
    await transporter.sendMail(mailOptions);

    console.log(`Generated OTP for ${email}: ${otp}`); // For testing only
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { valid, message } = await validateOtp(user, otp);
    if (!valid) {
      return res.status(400).json({ message });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};
const resetPassword = async (req, res) => {
  const { email, password, otp } = req.body; // Include OTP in the request body

  try {
    // Step 1: Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Validate OTP
    const { valid, message } = await validateOtp(user, otp); // Use validateOtp here
    if (!valid) {
      return res.status(400).json({ message });
    }

    // Step 3: Update the password after OTP validation
    console.log('Resetting password for user:', email);
    console.log('New password:', password);

    // Update the user's password (hashing is done automatically in the pre-save hook)
    user.password = password;
    user.otpHash = undefined; // Clear OTP hash after password reset
    user.otpExpiry = undefined; // Clear OTP expiry time

    // Step 4: Save the updated user, which triggers the password hashing
    await user.save();
    console.log('Password reset successful for user:', user.email);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};


// Register User
const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or phone already in use' });
    }

    const user = new User({ name, email, password, phone });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params; // Get user ID from URL params

  try {
    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await User.deleteOne({ _id: id });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

const sendLoginOTP = async (phone) => {
  F
  try {
    // Find user by phone number
    const user = await User.findOne({ phone });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!user.email) {
      return { success: false, message: "No email associated with this phone number" };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 mins

    // Save OTP details
    user.loginOtpHash = otpHash;
    user.loginOtpExpiry = otpExpiry;
    await user.save();

    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email, // Send OTP to the email found
      subject: "Your OTP Code for Login",
      html: `
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    margin: 0;
                    padding: 0;
                  }
                  .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 20px;
                  }
                  .header h2 {
                    color: #4CAF50;
                    font-size: 24px;
                  }
                  .content {
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 20px;
                  }
                  .otp {
                    font-weight: bold;
                    font-size: 18px;
                    color: #4CAF50;
                  }
                  .footer {
                    text-align: center;
                    font-size: 14px;
                    color: #888;
                    margin-top: 30px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2>Agrive Mart - OTP Verification</h2>
                  </div>
                  <div class="content">
                    <p>Hello,</p>
                    <p>Your OTP for login is: <span class="otp">${otp}</span></p>
                    <p>This OTP is valid for the next 10 minutes.</p>
                  </div>
                  <div class="footer">
                    <p>Best regards,</p>
                    <p><strong>Agrive Mart Team</strong></p>
                  </div>
                </div>
              </body>
            </html>
          `,
    };

    // Send OTP to the email found
    await transporter.sendMail(mailOptions);

    return { success: true, message: `OTP sent to the email associated with phone number ${phone}` };

  } catch (error) {
    console.error("Error sending OTP:", error);
    return { success: false, message: "Failed to send OTP" };
  }
};
const verifyLoginOTP = async (phone, otp) => {
  try {
    // Find user by phone number
    const user = await User.findOne({ phone });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!user.email) {
      return { success: false, message: "No email associated with this phone number" };
    }

    if (!user.loginOtpHash || !user.loginOtpExpiry || new Date() > user.loginOtpExpiry) {
      return { success: false, message: "OTP expired or invalid" };
    }

    const isMatch = await bcrypt.compare(otp, user.loginOtpHash);
    if (!isMatch) {
      return { success: false, message: "Invalid OTP" };
    }

    // OTP is correct, generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Clear OTP fields after successful login
    user.loginOtpHash = null;
    user.loginOtpExpiry = null;
    await user.save();

    return { success: true, message: "Login successful", token };

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: "OTP verification failed" };
  }
};
const loginUser = async (req, res) => {
  const { phone, password, otp } = req.body;

  try {
    // Find user by phone number and get the email
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Verify OTP
    if (!user.loginOtpHash || !user.loginOtpExpiry || new Date() > user.loginOtpExpiry) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    const isOtpMatch = await bcrypt.compare(otp, user.loginOtpHash);
    if (!isOtpMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP and Password are both correct, generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Clear OTP fields after successful login
    user.loginOtpHash = null;
    user.loginOtpExpiry = null;
    await user.save();

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });

  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Failed to log in" });
  }
};

module.exports = {
  deleteUser,
  registerUser,
  loginUser,
  sendOtp,
  generateOtp,
  validateOtp,
  verifyOtp,
  resetPassword,
  sendLoginOTP,
  verifyLoginOTP
};
