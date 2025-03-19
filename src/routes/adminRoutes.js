const express = require('express');
const authAdmin = require('../middleware/authAdmin'); // Import middleware
const{
  getAllAdmins,
  getAllUsers,
  deleteAdmin
}=require('../controllers/adminController');
const{deleteUser}=require('../controllers/authUserController')

const router = express.Router();
router.get('/admins', authAdmin, getAllAdmins);
router.get('/users', authAdmin, getAllUsers);
router.delete('/delete/:id',authAdmin,deleteUser);
router.delete('/deleteAdmin/:id',authAdmin,deleteAdmin);


module.exports = router;
