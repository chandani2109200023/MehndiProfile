const mongoose = require('mongoose');
const Investment = require('../models/investment');
const User = require('../models/User'); // Adjust path based on your project structure
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const Payment=require('../models/payment');

const pendingInvestments = new Map();
const pendingWithdrawals = new Map();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendApprovalEmail = async (adminEmail, investmentId, userId, amount) => {
    try {
        // Fetch user details
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found');
            return;
        }

        // Fetch investment details
        const investment = await Investment.findById(investmentId);
        if (!investment) {
            console.error('Investment not found');
            return;
        }

        const approvalId = uuidv4();
        pendingInvestments.set(approvalId, { investmentId, userId, amount });

        const approveLink = `https://mehndiprofile.onrender.com/investment/approve/${approvalId}`;
        const rejectLink = `https://mehndiprofile.onrender.com/investment/reject/${approvalId}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "chandanikumari21092000@gmail.com", // Use dynamic admin email
            subject: 'New Investment Request Approval Needed',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #333;">Investment Approval Request</h2>
                <p style="font-size: 16px;">Dear Admin,</p>
                <p style="font-size: 14px;">You have received a new investment request.</p>
                
                <h3 style="color: #007bff;">User Details</h3>
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Contact:</strong> ${user.phone}</p>

                <h3 style="color: #28a745;">Investment Details</h3>
                <p><strong>Investment Name:</strong> ${investment.name}</p>
                <p><strong>Investment ID:</strong> ${investment.id}</p>
                <p><strong>Amount:</strong> $${amount}</p>

                <p style="font-size: 14px;">Please review and take action:</p>
                <a href="${approveLink}" style="background: green; color: white; padding: 12px 18px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve</a> 
                <a href="${rejectLink}" style="background: red; color: white; padding: 12px 18px; text-decoration: none; border-radius: 5px;">Reject</a>
            </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Approval email sent:', info.response);
    } catch (error) {
        console.error('Error sending approval email:', error);
    }
};

// Send Withdrawal Request Email
const sendWithdrawalEmail = async (adminEmail, investmentId, userId, amount) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found');
            return;
        }

        // Fetch investment details
        const investment = await Investment.findById(investmentId);
        if (!investment) {
            console.error('Investment not found');
            return;
        }

        const withdrawId = uuidv4();
        pendingWithdrawals.set(withdrawId, { investmentId: investment.id, userId: user.id, amount });

        const approveLink = `https://mehndiprofile.onrender.com/investment/withdraw/approve/${withdrawId}`;
        const rejectLink = `https://mehndiprofile.onrender.com/investment/withdraw/reject/${withdrawId}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "chandanikumari21092000@gmail.com",
            subject: 'New Withdrawal Request Approval Needed',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #333;">Withdrawal Request Approval</h2>
            <p style="font-size: 16px;">Dear Admin,</p>
            <p style="font-size: 14px;">A user has requested a withdrawal.</p>
            
            <h3 style="color: #007bff;">User Details</h3>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Contact:</strong> ${user.phone}</p>

            <h3 style="color: #dc3545;">Withdrawal Details</h3>
            <p><strong>Investment Name:</strong> ${investment.name}</p>
            <p><strong>Investment ID:</strong> ${investment.id}</p>
            <p><strong>Withdrawal Amount:</strong> $${amount}</p>

            <p style="font-size: 14px;">Please review and take action:</p>
            <a href="${approveLink}" style="background: green; color: white; padding: 12px 18px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve</a> 
            <a href="${rejectLink}" style="background: red; color: white; padding: 12px 18px; text-decoration: none; border-radius: 5px;">Reject</a>
        </div>
        `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Approval email sent:', info.response);
    } catch (error) {
        console.error('Error sending approval email:', error);
    }
};

// Approve Withdrawal
const approveWithdrawal = async (req, res) => {
    try {
        const { withdrawId } = req.params;
        const pending = pendingWithdrawals.get(withdrawId);
        if (!pending) return res.status(404).json({ error: 'Withdrawal request not found' });

        const { investmentId, userId, amount } = pending;
        const investment = await Investment.findById(investmentId);
        if (!investment) return res.status(404).json({ error: 'Investment not found' });

        const investorIndex = investment.investors.findIndex(i => i.userId.toString() === userId);
        if (investorIndex === -1) return res.status(404).json({ error: 'Investor not found' });

        const investor = investment.investors[investorIndex];

        if (amount >= investor.amount) {
            // If withdrawing the full amount, remove investor from list
            investment.investors.splice(investorIndex, 1);
        } else {
            // Deduct the withdrawn amount
            investor.amount -= amount;
        }

        investment.totalInvestment -= amount;
        await investment.save();
        await Payment.findOneAndUpdate(
            { investmentId, userId, amount, status: 'pending', type: 'withdrawal' },
            { status: 'approved' }
        );
        pendingWithdrawals.delete(withdrawId);

        res.status(200).json({ message: 'Withdrawal approved successfully' });
    } catch (err) {
        console.error('Error approving withdrawal:', err);
        res.status(500).json({ error: 'Unable to approve withdrawal' });
    }
};

// Reject Withdrawal
const rejectWithdrawal = async (req, res) => {
    try {
        const { withdrawId } = req.params;
        if (!pendingWithdrawals.has(withdrawId)) {
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }
        pendingWithdrawals.delete(withdrawId);
        res.status(200).json({ message: 'Withdrawal request rejected' });
    } catch (err) {
        console.error('Error rejecting withdrawal:', err);
        res.status(500).json({ error: 'Unable to reject withdrawal' });
    }
};

// Handle Withdrawal Request
const requestWithdrawal = async (req, res) => {
    try {
        const { investmentId, userId, amount } = req.body;

        if (!mongoose.Types.ObjectId.isValid(investmentId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid IDs provided' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Withdrawal amount must be greater than 0' });
        }

        const investment = await Investment.findById(investmentId);
        if (!investment) return res.status(404).json({ error: 'Investment not found' });

        const investor = investment.investors.find(i => i.userId.toString() === userId);
        if (!investor) return res.status(404).json({ error: 'Investor not found in this investment' });

        if (amount > investor.amount) {
            return res.status(400).json({ error: 'Withdrawal amount exceeds invested amount' });
        }
        await Payment.create({
            investmentId,
            userId,
            amount,
            status: 'pending',
            type: 'withdrawal',
            createdAt: new Date()
        });

        sendWithdrawalEmail(process.env.ADMIN_EMAIL, investmentId, userId, amount);
        res.status(200).json({ message: 'Withdrawal request sent for approval' });
    } catch (err) {
        console.error('Error processing withdrawal request:', err);
        res.status(500).json({ error: 'Unable to process withdrawal request' });
    }
};
const updateInvestorProfit = async (req, res) => {
    try {
        const { investmentId, investorId } = req.params;
        const { profit } = req.body;

        if (!mongoose.Types.ObjectId.isValid(investmentId) || !mongoose.Types.ObjectId.isValid(investorId)) {
            return res.status(400).json({ error: 'Invalid Investment ID or Investor ID' });
        }
        if (profit === undefined || profit < 0) {
            return res.status(400).json({ error: 'Invalid profit percentage' });
        }

        const investment = await Investment.findById(investmentId);
        if (!investment) return res.status(404).json({ error: 'Investment not found' });

        console.log("Investment Investors:", investment.investors); // Debugging

        // Try matching using investor's `_id` instead of `userId`
        const investor = investment.investors.find(inv => inv._id.toString() === investorId);

        if (!investor) return res.status(404).json({ error: 'Investor not found in this investment' });

        // Update the profit percentage
        investor.profit = profit;

        await investment.save();
        res.status(200).json({ message: 'Investor profit updated successfully', investment });
    } catch (err) {
        console.error('Error updating investor profit:', err);
        res.status(500).json({ error: 'Unable to update investor profit' });
    }
};

// Create new investment
const createInvestment = async (req, res) => {
    try {
        const {
            material,
            description,
            costPrice,
            costQuantity,
        } = req.body;

        const investment = new Investment({
            material,
            description: description || "",
            totalInvestment: 0,
            costPrice,
            costQuantity,
            sellingPrice: 0,
            sellingQuantity: 0,
            investors: [],
            status: 'open',
        });

        const savedInvestment = await investment.save();
        res.status(201).json(savedInvestment);
    } catch (err) {
        console.error('Error creating investment:', err);
        res.status(500).json({ error: 'Unable to create investment' });
    }
};

// Fetch all investments
const getAllInvestments = async (req, res) => {
    try {
        const investments = await Investment.find().populate('investors.userId', 'name email');

        if (!investments || investments.length === 0) {
            return res.status(404).json({ error: 'No investments found' });
        }

        res.status(200).json(investments);
    } catch (err) {
        console.error('Error fetching investments:', err);
        res.status(500).json({ error: 'Unable to fetch investments' });
    }
};

// Handle investment request
const invest = async (req, res) => {
    try {
        const { investmentId, userId, amount } = req.body;

        if (!mongoose.Types.ObjectId.isValid(investmentId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid IDs provided' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Investment amount must be greater than 0' });
        }

        const investment = await Investment.findById(investmentId);
        if (!investment) return res.status(404).json({ error: 'Investment not found' });
        if (investment.status !== 'open') return res.status(400).json({ error: 'This investment opportunity is closed' });
        const payment = new Payment({
            investmentId,
            userId,
            amount,
            type: 'investment',
            status: 'pending'
        });
        await payment.save();

        sendApprovalEmail(process.env.ADMIN_EMAIL, investmentId, userId, amount);
        res.status(200).json({ message: 'Investment request sent for approval' });
    } catch (err) {
        console.error('Error processing investment request:', err);
        res.status(500).json({ error: 'Unable to process investment request' });
    }
};

// Approve investment
const approveInvestment = async (req, res) => {
    try {
        const { approvalId } = req.params;
        const pending = pendingInvestments.get(approvalId);
        if (!pending) return res.status(404).json({ error: 'Approval request not found' });

        const { investmentId, userId, amount } = pending;
        const investment = await Investment.findById(investmentId);
        if (!investment) return res.status(404).json({ error: 'Investment not found' });

        // Check if the user is already an investor
        const existingInvestor = investment.investors.find(i => i.userId.toString() === userId);
        if (existingInvestor) {
            existingInvestor.amount += amount;
        } else {
            investment.investors.push({ userId, amount, profit: investment.expectedProfit });
        }

        investment.totalInvestment += amount;

        await investment.save();
        await Payment.findOneAndUpdate(
            { investmentId, userId, amount, status: 'pending', type: 'investment' },
            { status: 'approved' }
        );
        pendingInvestments.delete(approvalId);

        res.status(200).json({ message: 'Investment approved successfully' });
    } catch (err) {
        console.error('Error approving investment:', err);
        res.status(500).json({ error: 'Unable to approve investment' });
    }
};

// Reject investment
const rejectInvestment = async (req, res) => {
    try {
        const { approvalId } = req.params;
        if (!pendingInvestments.has(approvalId)) {
            return res.status(404).json({ error: 'Approval request not found' });
        }
        pendingInvestments.delete(approvalId);
        res.status(200).json({ message: 'Investment request rejected' });
    } catch (err) {
        console.error('Error rejecting investment:', err);
        res.status(500).json({ error: 'Unable to reject investment' });
    }
};
const deleteInvestment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid Investment ID' });
        }

        const investment = await Investment.findByIdAndDelete(id);

        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }

        res.status(200).json({ message: 'Investment deleted successfully' });
    } catch (err) {
        console.error('Error deleting investment:', err);
        res.status(500).json({ error: 'Unable to delete investment' });
    }
};

const updateInvestmentById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Received Update Request for ID:", id);
        console.log("Request Body:", req.body);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid Investment ID" });
        }

        // Update investment directly in the database
        const investment = await Investment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        if (!investment) {
            return res.status(404).json({ message: "Investment not found" });
        }

        console.log("After Update:", investment);

        res.status(200).json({ message: "Investment updated successfully", investment });
    } catch (error) {
        console.error("Error updating investment:", error);
        res.status(500).json({ message: "Error updating investment", error: error.message });
    }
};

const updateInvestment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid Investment ID" });
        }

        const investment = await Investment.findById(id);
        if (!investment) {
            return res.status(404).json({ error: "Investment not found" });
        }

        // Update sellingPrice and sellingQuantity if provided
        if (updates.sellingPrice !== undefined) {
            investment.sellingPrice = updates.sellingPrice;
        }
        if (updates.sellingQuantity !== undefined) {
            investment.sellingQuantity = updates.sellingQuantity;
        }

        // Update costPrice and costQuantity if provided
        if (updates.costPrice !== undefined) {
            investment.costPrice = updates.costPrice;
        }
        if (updates.costQuantity !== undefined) {
            investment.costQuantity = updates.costQuantity;
        }

        // Calculate cost per unit only if costQuantity is greater than zero
        let costPerUnit = 0;
        if (investment.costQuantity > 0) {
            costPerUnit = investment.costPrice / investment.costQuantity;
        }

        // Ensure sellingQuantity is not greater than available costQuantity
        if (investment.sellingQuantity > investment.costQuantity) {
            return res.status(400).json({ error: "Selling quantity cannot exceed available cost quantity" });
        }

        // Reduce costPrice and costQuantity based on sellingQuantity
        investment.costPrice -= costPerUnit * investment.sellingQuantity;
        investment.costQuantity -= investment.sellingQuantity;

        // Update profit for investors
        investment.investors.forEach(investor => {
            const newProfit = ((investment.sellingPrice - costPerUnit * investment.sellingQuantity) * investor.profit) / 100;
            investor.profitAmount += newProfit;
        });

        await investment.save(); // Save the updated investment

        res.status(200).json({ message: "Investment updated successfully", investment });
    } catch (err) {
        console.error("Error updating investment:", err);
        res.status(500).json({ error: "Unable to update investment" });
    }
};

const uploadInvestmentImages = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if files exist
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        // Find the investment record by ID
        const investment = await Investment.findById(id);
        if (!investment) {
            return res.status(404).json({ error: "Investment not found" });
        }

        // Convert uploaded files to MongoDB-compatible format
        const imageObjects = req.files.map(file => ({
            data: file.buffer, // Binary image data
            contentType: file.mimetype // Image MIME type
        }));

        // Append new images to existing images array
        investment.images.push(...imageObjects);
        await investment.save();

        res.status(200).json({ message: "Images uploaded successfully", investment });
    } catch (err) {
        console.error("Error uploading images:", err);
        res.status(500).json({ error: "Unable to upload images" });
    }
};


module.exports = {
    getAllInvestments,
    getInvestmentById: async (id) => Investment.findById(id),
    createInvestment,
    invest,
    updateInvestment,
    approveInvestment,
    rejectInvestment,
    updateInvestorProfit,
    approveWithdrawal,
    rejectWithdrawal,
    requestWithdrawal,
    deleteInvestment,
    updateInvestmentById,
    uploadInvestmentImages,
    upload
};
