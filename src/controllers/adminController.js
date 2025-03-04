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

module.exports = {
  getAllAdmins,
  getAllUsers,
};
