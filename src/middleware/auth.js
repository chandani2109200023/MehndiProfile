// src/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin=require('../models/Admin')

const auth = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const token = req.header('Authorization');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token missing' });
    }

    // Extract token from the Authorization header
    const tokenWithoutBearer = token.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);

    // Find user by the decoded id from token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Attach the user to the request object
    req.user = user;
    next(); // Move to the next middleware or route handler
  } catch (err) {
    // Handle specific token errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Handle other errors
    res.status(401).json({ message: 'Authentication failed' });
  }
};


module.exports = auth;
