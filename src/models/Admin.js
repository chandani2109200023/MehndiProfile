const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'superAdmin'], // Only allow 'admin' or 'superAdmin'
    default: 'admin', // Default role is 'admin'
  },
  pages: {
    type: [String], // Array of pages the admin has access to
    required: true, // Ensure pages are always provided
  },
}, { timestamps: true }); // Adds createdAt & updatedAt fields

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Skip if password not modified

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Method to compare provided password with stored hashed password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
