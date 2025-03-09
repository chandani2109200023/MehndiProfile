const mongoose = require('mongoose');

// Define the Documents schema
const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to User model
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        required: [true, 'Account holder name is required'],
      },
      accountNumber: {
        type: String,
        required: [true, 'Account number is required'],
      },
      ifscCode: {
        type: String,
        required: [true, 'IFSC code is required'],
      },
      bankName: {
        type: String,
        required: [true, 'Bank name is required'],
      },
    },
    passbookImage: {
      data: {
        type: Buffer, // Store image as binary data
        required: true,
      },
      contentType: {
        type: String, // Store image format (e.g., image/jpeg)
        required: true,
      },
    },
    aadhaarImage: {
      data: {
        type: Buffer, // Store image as binary data
        required: true,
      },
      contentType: {
        type: String, // Store image format
        required: true,
      },
    },
  },
  { timestamps: true }
);

// Create or use existing model
const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);

module.exports = Document;
