const express = require('express');
const {
  createInvestment,
  getAllInvestments,
  getInvestmentById,
  invest,
  closeInvestment,
  updateInvestment,
  deleteInvestment,
  approveInvestment,
  rejectInvestment
} = require('../controllers/investController');
const authAdmin = require('../middleware/authAdmin');
const authUser = require('../middleware/auth'); // Middleware for authenticated users

const router = express.Router();

// 🔹 Create a new investment opportunity (Admin Only)
router.post('/', createInvestment);

// 🔹 Get all investment opportunities (Authenticated Users)
router.get('/', getAllInvestments);

// 🔹 Get a specific investment opportunity by ID (Authenticated Users)
router.get('/:id', getInvestmentById);

// 🔹 Invest in an opportunity (Authenticated Partners)
router.post('/invest', authUser, invest);
router.get('/approve/:approvalId', approveInvestment);
router.get('/reject/:approvalId', rejectInvestment);
router.put('/:id',authAdmin,updateInvestment)

module.exports = router;
