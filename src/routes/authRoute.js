const express = require('express');
const { registerAdmin, loginAdmin } = require('../controllers/authController');
const router = express.Router();

// Register route
router.post('/registerAdmin', registerAdmin);

// Login route
router.post('/loginAdmin', loginAdmin);

module.exports = router;
