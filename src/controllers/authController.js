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

    // Validate pages (must be an array and not empty)
    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ message: 'Pages must be a non-empty array' });
    }

    // Create a new admin with assigned pages
    const admin = new Admin({ name, email, password, role: newRole, pages });
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
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = { registerAdmin, loginAdmin };
