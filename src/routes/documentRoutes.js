const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authAdmin = require('../middleware/authAdmin');

const upload = documentController.upload.fields([
    { name: 'passbookImage', maxCount: 1 },
    { name: 'aadhaarImage', maxCount: 1 }
]);

router.post('/upload', upload, documentController.uploadDocument);
router.get('/:userId', documentController.getDocumentByUserId);
router.put('/:userId', upload,documentController.updateDocumentById); // Updated route for bank details & images
router.delete('/:userId', authAdmin,documentController.deleteDocumentById);

module.exports = router;
