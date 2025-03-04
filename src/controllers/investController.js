const mongoose = require('mongoose');
const Investment = require('../models/investment');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const pendingInvestments = new Map();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendApprovalEmail = (adminEmail, investmentId, userId, amount) => {
    const approvalId = uuidv4();
    pendingInvestments.set(approvalId, { investmentId, userId, amount});
    
    const approveLink = `http://192.168.101.183:8000/investment/approve/${approvalId}`;
    const rejectLink = `http://192.168.101.183:8000/investments/reject/${approvalId}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: "chandanikumari21092000@gmail.com",
        subject: 'New Investment Request',
        html: `<p>User <strong>${userId}</strong> wants to invest <strong>${amount}</strong> in investment <strong>${investmentId}</strong>.</p>
               <p><a href="${approveLink}">Approve</a> | <a href="${rejectLink}">Reject</a></p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error('Error sending email:', error);
        else console.log('Approval email sent:', info.response);
    });
};

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

        sendApprovalEmail(process.env.ADMIN_EMAIL, investmentId, userId, amount);
        res.status(200).json({ message: 'Investment request sent for approval' });
    } catch (err) {
        console.error('Error processing investment request:', err);
        res.status(500).json({ error: 'Unable to process investment request' });
    }
};

const approveInvestment = async (req, res) => {
    try {
        const { approvalId } = req.params;
        const pending = pendingInvestments.get(approvalId);
        if (!pending) return res.status(404).json({ error: 'Approval request not found' });

        const { investmentId, userId, amount } = pending; // Removed quantity
        const investment = await Investment.findById(investmentId);
        if (!investment) return res.status(404).json({ error: 'Investment not found' });

        // Check if the user is already an investor
        const existingInvestor = investment.investors.find(i => i.userId.toString() === userId);
        if (existingInvestor) {
            existingInvestor.amount += amount; // Only updating amount
        } else {
            investment.investors.push({ userId, amount }); // Storing only amount
        }

        investment.totalInvestment += amount; // Updating total investment

        await investment.save();
        pendingInvestments.delete(approvalId);

        res.status(200).json({ message: 'Investment approved successfully' });
    } catch (err) {
        console.error('Error approving investment:', err);
        res.status(500).json({ error: 'Unable to approve investment' });
    }
};

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

const getAllInvestments = async (req, res) => {
    try {
        console.log("Fetching all investments...");
  
        const investments = await Investment.find().populate('investors.userId', 'name email'); // Fetch user details
  
        console.log("Fetched investments with user details:", investments);
  
        if (!investments || investments.length === 0) {
            return res.status(404).json({ error: 'No investments found' });
        }
  
        res.status(200).json(investments);
    } catch (err) {
        console.error('Error fetching investments:', err);
        res.status(500).json({ error: 'Unable to fetch investments' });
    }
  };
const updateInvestment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid Investment ID' });
        }

        const investment = await Investment.findByIdAndUpdate(id, updates, { new: true });
        if (!investment) return res.status(404).json({ error: 'Investment not found' });

        res.status(200).json(investment);
    } catch (err) {
        console.error('Error updating investment:', err);
        res.status(500).json({ error: 'Unable to update investment' });
    }
};

const createInvestment = async (req, res) => {
    try {
        const { material, description, minInvestment, expectedProfit, quantity } = req.body;
        const investment = new Investment({
            material,
            description: description || "",
            minInvestment,
            expectedProfit,
            totalInvestment: 0,
            quantity,
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

module.exports = {
    getAllInvestments,
    getInvestmentById: async (id) => Investment.findById(id),
    createInvestment,
    invest,
    updateInvestment,
    approveInvestment,
    rejectInvestment
};
