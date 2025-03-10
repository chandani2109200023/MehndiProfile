const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const registerAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const AdminExists = await Admin.findOne({ email });
    if (AdminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // If no role is provided, default to 'admin'
    const newRole = role && ['admin', 'superAdmin'].includes(role) ? role : 'admin';

    const admin = new Admin({ name, email, password, role: newRole });
    await admin.save();

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
