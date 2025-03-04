const mongoose = require('mongoose');

// Define the Address schema
const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      required: true,
      ref: 'User', // Assuming you have a User model
    },
    fullName: { type: String, required: true }, // User's full name
    phoneNumber: { type: String, required: true }, // User's phone number
    pincode: { type: String, required: true }, // Address pincode
    state: { type: String, required: true }, // Address state
    city: { type: String, required: true }, // Address city
    houseDetails: { type: String, required: true }, // House/building details
    roadDetails: { type: String, required: true }, // Road/area details
    type: { 
      type: String, 
      enum: ['Home', 'Work', 'Hotel'], // Restrict to predefined types
      required: true 
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Use the existing model if it is already defined, otherwise create it
const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);

module.exports = Address;
