const User = require('../models/User');
const Admin=require('../models/Admin');
const getAllAdmins=async(req,res)=>{
  try{
  const admins=await Admin.find().select('-password');
  res.status(200).json(admins);
  }catch(err){
    res.status(500).json({message:err.message});
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); 
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const deleteAdmin = async (req, res) => {
  const { id } = req.params; // Get user ID from URL params

  try {
    // Find the user by ID
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await Admin.deleteOne({ _id: id });

    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};


module.exports = {
  getAllAdmins,
  getAllUsers,
  deleteAdmin
};
