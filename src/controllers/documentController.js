const Document = require('../models/Document');
const multer = require('multer');

// Multer storage configuration (store file in memory as a buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload a document with bank details
const uploadDocument = async (req, res) => {
    try {
        const { userId, accountHolderName, accountNumber, ifscCode, bankName } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
            return res.status(400).json({ error: 'All bank details are required' });
        }

        if (!req.files || !req.files.passbookImage || !req.files.aadhaarImage) {
            return res.status(400).json({ error: 'Both Passbook and Aadhaar images are required' });
        }

        const newDocument = new Document({
            userId,
            bankDetails: {
                accountHolderName,
                accountNumber,
                ifscCode,
                bankName
            },
            passbookImage: {
                data: req.files.passbookImage[0].buffer,
                contentType: req.files.passbookImage[0].mimetype,
            },
            aadhaarImage: {
                data: req.files.aadhaarImage[0].buffer,
                contentType: req.files.aadhaarImage[0].mimetype,
            }
        });

        const savedDocument = await newDocument.save();
        res.status(201).json({ message: 'Document uploaded successfully', documentId: savedDocument._id });

    } catch (err) {
        console.error('Error uploading document:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get document by user ID
const getDocumentByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const document = await Document.findOne({ userId });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.status(200).json(document);
    } catch (err) {
        console.error('Error fetching document:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateDocumentById = async (req, res) => {
    try {
        const { userId } = req.params; // Extract userId from request parameters
        const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const updatedFields = {};

        // Update bank details if provided
        if (accountHolderName || accountNumber || ifscCode || bankName) {
            updatedFields.bankDetails = {};
            if (accountHolderName) updatedFields.bankDetails.accountHolderName = accountHolderName;
            if (accountNumber) updatedFields.bankDetails.accountNumber = accountNumber;
            if (ifscCode) updatedFields.bankDetails.ifscCode = ifscCode;
            if (bankName) updatedFields.bankDetails.bankName = bankName;
        }

        // Handle file uploads
        if (req.files?.passbookImage) {
            updatedFields.passbookImage = {
                data: req.files.passbookImage[0].buffer,
                contentType: req.files.passbookImage[0].mimetype,
            };
        }

        if (req.files?.aadhaarImage) {
            updatedFields.aadhaarImage = {
                data: req.files.aadhaarImage[0].buffer,
                contentType: req.files.aadhaarImage[0].mimetype,
            };
        }

        // Find and update the document based on userId
        const updatedDocument = await Document.findOneAndUpdate(
            { userId }, // Find by userId
            { $set: updatedFields },
            { new: true }
        );

        if (!updatedDocument) {
            return res.status(404).json({ error: 'Document not found for this user' });
        }

        res.status(200).json({ message: 'Document updated successfully', updatedDocument });
    } catch (err) {
        console.error('Error updating document:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete document by document ID (_id)
const deleteDocumentById = async (req, res) => {
    try {
        const { id } = req.params; // Get _id from request params
        const deletedDocument = await Document.findByIdAndDelete(id);

        if (!deletedDocument) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (err) {
        console.error('Error deleting document:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    upload,
    uploadDocument,
    getDocumentByUserId,
    updateDocumentById,
    deleteDocumentById, // Updated function for deletion by _id
};
