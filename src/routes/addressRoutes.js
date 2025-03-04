const express = require('express');
const router = express.Router();

const {
    getAddressesByUserId,
    createAddress,
    updateAddressById,
    deleteAddressById,
} = require('../controllers/addressController');

const auth = require('../middleware/auth'); // Middleware for authentication

router.get('/get/:userId', async (req, res) => {
    try {
        const userId = req.params.userId; // Extract userId from request parameters

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Fetch addresses for the user
        const addresses = await getAddressesByUserId(userId);

        if (addresses.length === 0) {
            return res.status(404).json({ message: 'No addresses found for this user' });
        }

        res.status(200).json(addresses); // Return the addresses of the user
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message }); // Handle errors
    }
});


router.post('/add/', auth, async (req, res) => {
    try {
        const addressData = { ...req.body, userId: req.user.id }; // Associate userId from auth middleware
        const newAddress = await createAddress(addressData);
        res.status(201).json(newAddress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAddress = await updateAddressById(id, req.body);
        if (!updatedAddress) {
            return res.status(404).json({ message: 'Address not found' });
        }
        res.status(200).json(updatedAddress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAddress = await deleteAddressById(id);
        if (!deletedAddress) {
            return res.status(404).json({ message: 'Address not found' });
        }
        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
