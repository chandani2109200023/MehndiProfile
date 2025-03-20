const express = require('express');
const {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  resetPassword,
} = require('../controllers/authUserController');
const{
  getPaymentsByUserId
} = require('../controllers/paymentController')
const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/payment',getPaymentsByUserId);
module.exports = router;
