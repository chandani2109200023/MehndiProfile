const mongoose = require('mongoose');
const Payment=require('../models/Payments')

const getPaymentsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const payments = await Payment.find({ userId }).sort({ createdAt: -1 });

        if (!payments.length) {
            return res.status(404).json({ error: 'No payments found for this user' });
        }

        res.status(200).json(payments);
    } catch (err) {
        console.error('Error fetching payments:', err);
        res.status(500).json({ error: 'Unable to fetch payments' });
    }
};

module.exports = { getPaymentsByUserId };
