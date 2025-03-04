const express = require('express');
const authAdmin = require('../middleware/authAdmin'); // Import middleware
const{
  getAllAdmins,
  getAllUsers
}=require('../controllers/adminController');

const router = express.Router();
router.get('/admins', authAdmin, getAllAdmins);
router.get('/users', authAdmin, getAllUsers);


module.exports = router;
