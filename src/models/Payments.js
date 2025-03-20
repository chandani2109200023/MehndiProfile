const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    type: { type: String, enum: ['investment', 'withdrawal'], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', PaymentSchema);
module.exports = Payment;
