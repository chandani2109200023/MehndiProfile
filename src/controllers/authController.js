const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const registerAdmin = async (req, res) => {
  const { name, email, password, role, pages } = req.body;

  try {
    // Check if the admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Validate role, default to 'admin' if not provided or invalid
    const newRole = role && ['admin', 'superAdmin'].includes(role) ? role : 'admin';

    // Validate pages (must be an array)
    if (!Array.isArray(pages)) {
      return res.status(400).json({ message: 'Pages must be an array' });
    }

    // Create a new admin
    const admin = new Admin({
      name,
      email,
      password,
      role: newRole,
      pages,
    });

    await admin.save();

    res.status(201).json({ message: 'Admin registered successfully', admin });
  } catch (err) {
    console.error('Error registering admin:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password.trim(), admin.password);
    console.log('Entered password:', password.trim());
    console.log('Stored password hash:', admin.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

    // Generate JWT Token
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);

    // Send response with token, email, role, and pages
    res.json({
      token,
      email: admin.email,
      role: admin.role,
      pages: admin.pages,
    });

  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = { registerAdmin, loginAdmin };
