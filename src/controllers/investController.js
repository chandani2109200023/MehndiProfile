const mongoose = require('mongoose');
const Investment = require('../models/investment');
const User = require('../models/User'); // Adjust path based on your project structure
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payments');

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

const sendApprovalEmail = async (investmentId, userId, amount) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found");
            return;
        }

        const investment = await Investment.findById(investmentId);
        if (!investment) {
            console.error("Investment not found");
            return;
        }

        const approvalId = uuidv4();
        pendingInvestments.set(approvalId, { investmentId, userId, amount, approvedBy: new Set() });

        const adminEmails = [
            "chandanikumari21092000@gmail.com",
            "h.18.chandanikumaei@gmail.com"
        ];

        const approveLink = (adminEmail) => `https://mehndiprofile.onrender.com/investment/approve/${approvalId}?admin=${adminEmail}`;
        const rejectLink = (adminEmail) => `https://mehndiprofile.onrender.com/investment/reject/${approvalId}?admin=${adminEmail}`;

        for (const adminEmail of adminEmails) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: adminEmail,
                subject: "New Investment Request Approval Needed",
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
                    <a href="${approveLink(adminEmail)}" style="background: green; color: white; padding: 12px 18px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve</a> 
                    <a href="${rejectLink(adminEmail)}" style="background: red; color: white; padding: 12px 18px; text-decoration: none; border-radius: 5px;">Reject</a>
                </div>
                `,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`Approval email sent to ${adminEmail}:`, info.response);
        };

    } catch (error) {
        console.error("Error sending approval email:", error);
    }
};

const sendWithdrawalEmail = async (investmentId, userId, amount) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found");
            return;
        }

        const investment = await Investment.findById(investmentId);
        if (!investment) {
            console.error("Investment not found");
            return;
        }

        const withdrawId = uuidv4();
        pendingWithdrawals.set(withdrawId, {
            investmentId,
            userId,
            amount,
            approvedBy: new Set()
        });

        const adminEmails = [
            "chandanikumari21092000@gmail.com",
            "h.18.chandanikumaei@gmail.com"
        ];

        const approveLink = (adminEmail) => `https://mehndiprofile.onrender.com/investment/withdraw/${withdrawId}?admin=${adminEmail}`;
        const rejectLink = (adminEmail) => `https://mehndiprofile.onrender.com/investment/reject/${withdrawId}?admin=${adminEmail}`;

        for (const adminEmail of adminEmails) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: adminEmail,
                subject: "New Withdrawal Request Approval Needed",
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
                    <a href="${approveLink(adminEmail)}" style="background: green; color: white; padding: 12px 18px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve</a> 
                    <a href="${rejectLink(adminEmail)}" style="background: red; color: white; padding: 12px 18px; text-decoration: none; border-radius: 5px;">Reject</a>
                </div>
                `,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`Approval email sent to ${adminEmail}:`, info.response);
        };

    } catch (error) {
        console.error("Error sending approval email:", error);
    }
};


const approveWithdrawal = async (req, res) => {
    try {
        const { withdrawId } = req.params;
        const { admin } = req.query;

        if (!pendingWithdrawals.has(withdrawId)) {
            return res.status(404).json({ error: "Withdrawal request not found or already processed" });
        }

        const withdrawal = pendingWithdrawals.get(withdrawId);

        if (withdrawal.approvedBy.has(admin)) {
            return res.status(400).json({ error: "Admin has already approved this withdrawal" });
        }

        withdrawal.approvedBy.add(admin);

        console.log(`Admin ${admin} approved. Total approvals:`, withdrawal.approvedBy.size);

        // If two approvals are given, process the withdrawal
        if (withdrawal.approvedBy.size >= 2) {
            console.log("Withdrawal approved by both admins:", withdrawal);
            const { investmentId, userId, amount } = withdrawal;

            const investment = await Investment.findById(investmentId);
            if (!investment) return res.status(404).json({ error: "Investment not found" });

            const investorIndex = investment.investors.findIndex(i => i.userId.toString() === userId);
            if (investorIndex === -1) return res.status(404).json({ error: "Investor not found" });

            const investor = investment.investors[investorIndex];

            // Ensure profitAmount field exists (if using default 0)
            investor.profitAmount = investor.profitAmount || 0;

            // **Step 1: Check if withdrawal amount exceeds total available funds (profit + investment)**
            const totalAvailable = investor.totalAmount;
            if (amount > totalAvailable) {
                return res.status(400).json({ error: "Withdrawal amount exceeds total available funds (profit + investment)" });
            }

            // **Step 2: Deduct from profitAmount first**
            let remainingAmount = amount;
            if (investor.profitAmount > 0) {
                if (remainingAmount <= investor.profitAmount) {
                    investor.profitAmount -= remainingAmount;
                    remainingAmount = 0;
                } else {
                    remainingAmount -= investor.profitAmount;
                    investor.profitAmount = 0;
                }
            }

            // **Step 3: Deduct remaining amount from investor amount**
            if (remainingAmount > 0) {
                investor.amount -= remainingAmount;
                investment.totalInvestment -= remainingAmount;
                await investment.save();
            }

            // **Step 4: Remove investor if they withdraw all their funds**
            if (investor.amount === 0 && investor.profitAmount === 0) {
                investment.investors.splice(investorIndex, 1);
            }



            const paymentUpdate = await Payment.findOneAndUpdate(
                { investmentId, userId, amount, status: "pending", type: "withdrawal" },
                { status: "approved" },
                { new: true }
            );
            if (!paymentUpdate) {
                return res.status(400).json({ error: "Pending payment record not found" });
            }

            pendingWithdrawals.delete(withdrawId);
            console.log("Withdrawal approved and processed.");
            return res.status(200).json({ message: "Withdrawal approved successfully!" });
        }

        res.status(200).json({ message: "Approval recorded. Waiting for second admin." });

    } catch (err) {
        console.error("Error approving withdrawal:", err);
        res.status(500).json({ error: "Unable to approve withdrawal" });
    }
};

// Reject Withdrawal (Requires Two Admins)
const rejectWithdrawal = async (req, res) => {
    try {
        const { withdrawId } = req.params;
        const { admin } = req.query;

        if (!pendingWithdrawals.has(withdrawId)) {
            return res.status(404).json({ error: "Withdrawal request not found or already processed" });
        }

        const withdrawal = pendingWithdrawals.get(withdrawId);

        if (withdrawal.rejectedBy.has(admin)) {
            return res.status(400).json({ error: "Admin has already rejected this withdrawal" });
        }

        withdrawal.rejectedBy.add(admin);

        console.log(`Admin ${admin} rejected. Total rejections:`, withdrawal.rejectedBy.size);

        // If two rejections are recorded, remove the request
        if (withdrawal.rejectedBy.size >= 2) {
            pendingWithdrawals.delete(withdrawId);
            console.log("Withdrawal request rejected by both admins and removed.");
            return res.status(200).json({ message: "Withdrawal request fully rejected." });
        }

        res.status(200).json({ message: "Rejection recorded. Waiting for second admin." });

    } catch (err) {
        console.error("Error rejecting withdrawal:", err);
        res.status(500).json({ error: "Unable to reject withdrawal" });
    }
};

// Handle Withdrawal Request
const requestWithdrawal = async (req, res) => {
    try {
        const { investmentId, userId, amount } = req.body;

        if (!mongoose.Types.ObjectId.isValid(investmentId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid IDs provided" });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Withdrawal amount must be greater than 0" });
        }

        const investment = await Investment.findById(investmentId);
        if (!investment) return res.status(404).json({ error: "Investment not found" });

        const investor = investment.investors.find(i => i.userId.toString() === userId);
        if (!investor) return res.status(404).json({ error: "Investor not found in this investment" });

        if (amount > investor.totalAmount) {
            return res.status(400).json({ error: "Withdrawal amount exceeds Total amount" });
        }

        const payment = new Payment({
            investmentId,
            userId,
            amount,
            status: "pending",
            type: "withdrawal",
        });
        await payment.save();

        sendWithdrawalEmail(investmentId, userId, amount);
        res.status(200).json({ message: "Withdrawal request sent for approval" });
    } catch (err) {
        console.error("Error processing withdrawal request:", err);
        res.status(500).json({ error: "Unable to process withdrawal request" });
    }
};


const updateInvestorProfit = async (req, res) => {
    try {
        const { investmentId, investorId } = req.params;
        const { profit } = req.body;

        if (!mongoose.Types.ObjectId.isValid(investmentId) || !mongoose.Types.ObjectId.isValid(investorId)) {
            return res.status(400).json({ error: "Invalid Investment ID or Investor ID" });
        }

        const investment = await Investment.findById(investmentId);
        if (!investment) return res.status(404).json({ error: "Investment not found" });

        console.log("Investment Investors:", investment.investors); // Debugging

        // Find investor by _id
        const investor = investment.investors.find(inv => inv._id.toString() === investorId);
        if (!investor) return res.status(404).json({ error: "Investor not found in this investment" });

        // Initially set profit as (investor.amount / investment.totalAmount) * 100
        if (investor.profit === undefined || investor.profit === 0) {
            investor.profit = (investor.amount / investment.totalAmount) * 100;
        }

        // If a new profit value is provided, update it
        if (profit !== undefined) {
            if (profit < 0) return res.status(400).json({ error: "Invalid profit percentage" });
            investor.profit = profit;
        }

        await investment.save();
        res.status(200).json({ message: "Investor profit updated successfully", investment });
    } catch (err) {
        console.error("Error updating investor profit:", err);
        res.status(500).json({ error: "Unable to update investor profit" });
    }
};

// Create new investment
const createInvestment = async (req, res) => {
    try {
        const { material, description } = req.body;

        // Ensure required fields are provided
        if (!material) {
            return res.status(400).json({ error: "Material is required" });
        }

        const investment = new Investment({
            material,
            description: description || "",
            totalInvestment: 0,
            costPrice: 0,
            costQuantity: 0,
            sellingPrice: 0,
            sellingQuantity: 0,
            investors: [],
            status: "open",
        });

        const savedInvestment = await investment.save();
        res.status(201).json({
            message: "Investment created successfully!",
            investment: savedInvestment
        });

    } catch (err) {
        console.error("Error creating investment:", err);
        res.status(500).json({ error: "Unable to create investment" });
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

        sendApprovalEmail(investmentId, userId, amount);
        res.status(200).json({ message: 'Investment request sent for approval' });
    } catch (err) {
        console.error('Error processing investment request:', err);
        res.status(500).json({ error: 'Unable to process investment request' });
    }
};
const approveInvestment = async (req, res) => {
    try {
        const { approvalId } = req.params;
        const { admin } = req.query; // Admin email approving the request

        if (!pendingInvestments.has(approvalId)) {
            return res.status(400).json({ error: "Invalid or expired approval request" });
        }

        const investmentData = pendingInvestments.get(approvalId);

        // Ensure admin has not already approved
        if (investmentData.approvedBy.has(admin)) {
            return res.status(400).json({ error: "Admin has already approved this request" });
        }

        // Add admin to approval set
        investmentData.approvedBy.add(admin);

        console.log(`Admin ${admin} approved. Total approvals: ${investmentData.approvedBy.size}`);

        // Check if both admins have approved
        if (investmentData.approvedBy.size >= 2) {
            console.log("Investment approved by both admins:", investmentData);

            // Process Investment Approval
            const { investmentId, userId, amount } = investmentData;
            const investment = await Investment.findById(investmentId);
            if (!investment) return res.status(404).json({ error: "Investment not found" });

            // Check if user is already an investor
            let existingInvestor = investment.investors.find(i => i.userId.toString() === userId);
            if (existingInvestor) {
                existingInvestor.amount += amount;
            } else {
                investment.investors.push({
                    userId,
                    amount,
                    profit: (amount / (investment.totalInvestment + amount)) * 100, // Dynamic profit
                });
            }

            // Update total investment
            investment.totalInvestment += amount;
            await investment.save();

            // Update payment status
            const paymentUpdate = await Payment.findOneAndUpdate(
                { investmentId, userId, amount, status: "pending", type: "investment" },
                { status: "approved" },
                { new: true }
            );

            if (!paymentUpdate) {
                return res.status(400).json({ error: "Pending payment record not found" });
            }

            // Remove from pending approvals
            pendingInvestments.delete(approvalId);

            return res.status(200).json({ message: "Investment approved successfully!", investment });
        }

        res.status(200).json({ message: "Approval recorded. Waiting for second admin." });

    } catch (error) {
        console.error("Error approving investment:", error);
        res.status(500).json({ error: "Unable to approve investment" });
    }
};


const rejectInvestment = async (req, res) => {
    try {
        const { approvalId } = req.params;
        const { admin } = req.query; // Identify which admin rejected

        if (!pendingInvestments.has(approvalId)) {
            return res.status(404).json({ error: "Approval request not found or already processed" });
        }

        const investmentData = pendingInvestments.get(approvalId);

        // Ensure admin has not already rejected
        if (investmentData.rejectedBy && investmentData.rejectedBy.has(admin)) {
            return res.status(400).json({ error: "Admin has already rejected this request" });
        }

        // Initialize rejection set if not already present
        if (!investmentData.rejectedBy) {
            investmentData.rejectedBy = new Set();
        }

        // Add admin to rejected set
        investmentData.rejectedBy.add(admin);

        console.log(`Admin ${admin} rejected. Total rejections: ${investmentData.rejectedBy.size}`);

        // If both admins reject, remove the request
        if (investmentData.rejectedBy.size >= 2) {
            console.log("Investment rejected by both admins:", investmentData);
            pendingInvestments.delete(approvalId);
            return res.status(200).json({ message: "Investment request fully rejected and removed." });
        }

        res.status(200).json({ message: "Rejection recorded. Waiting for second admin." });

    } catch (err) {
        console.error("Error rejecting investment:", err);
        res.status(500).json({ error: "Unable to reject investment" });
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

        // Update fields if provided
        if (updates.sellingPrice !== undefined) {
            investment.sellingPrice = updates.sellingPrice;
        }
        if (updates.sellingQuantity !== undefined) {
            investment.sellingQuantity = updates.sellingQuantity;
        }
        if (updates.costPrice !== undefined) {
            investment.costPrice = updates.costPrice;
        }
        if (updates.costQuantity !== undefined) {
            investment.costQuantity = updates.costQuantity;
        }
        if (updates.companyMargin !== undefined) {
            investment.companyMargin = updates.companyMargin;
        }
        if (investment.sellingQuantity > investment.costQuantity) {
            return res.status(400).json({ error: "Selling quantity cannot exceed available cost quantity" });
        }

        // Update profit for investors
        investment.investors.forEach(investor => {
            const newProfit = (((investment.sellingPrice - investment.costPrice) - investment.companyMargin) * investor.profit) / 100;
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
