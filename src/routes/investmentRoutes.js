const express = require('express');
const {
  createInvestment,
  getAllInvestments,
  getInvestmentById,
  invest,
  updateInvestment,
  approveInvestment,
  rejectInvestment,
  updateInvestorProfit,
  approveWithdrawal,
  rejectWithdrawal,
  requestWithdrawal,
  updateInvestmentById,
  deleteInvestment,
  uploadInvestmentImages
} = require('../controllers/investController');
const authAdmin = require('../middleware/authAdmin');
const authUser = require('../middleware/auth'); // Middleware for authenticated users
const upload = require('../middleware/upload');


const router = express.Router();

// 🔹 Create a new investment opportunity (Admin Only)
router.post('/', createInvestment);

// 🔹 Get all investment opportunities (Authenticated Users)
router.get('/', getAllInvestments);

// 🔹 Get a specific investment opportunity by ID (Authenticated Users)
router.get('/:id', getInvestmentById);

// 🔹 Invest in an opportunity (Authenticated Partners)

router.post('/invest', authAdmin, invest);
router.get('/approve/:approvalId', approveInvestment);
router.get('/reject/:approvalId', rejectInvestment);
router.put('/:id',authAdmin,updateInvestment);
router.patch('/:id',authAdmin,updateInvestment);
router.patch("/:investmentId/investor/:investorId",authAdmin, updateInvestorProfit);
router.post('/withdraw',authUser,requestWithdrawal);
router.get('/withdraw/:withdrawId',approveWithdrawal);
router.get('/reject/:withdrawId',rejectWithdrawal);
router.patch('/investment/:id',authAdmin ,updateInvestmentById);  // Route for updating an investment
router.delete('/:id',authAdmin, deleteInvestment);
router.post('/investment/:id/upload-images',authAdmin, upload.array('images', 5), uploadInvestmentImages);

module.exports = router;
