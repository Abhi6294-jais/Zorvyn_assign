const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');
const { isAuthenticated } = require('../middleware/roleCheck');

// All dashboard routes require authentication
router.use(authMiddleware);
router.use(isAuthenticated);

router.get('/summary', dashboardController.getDashboardSummary);
router.get('/categories', dashboardController.getCategoryTotals);
router.get('/trends', dashboardController.getMonthlyTrends);
router.get('/recent', dashboardController.getRecentTransactions);
router.get('/full', dashboardController.getFullDashboard);

module.exports = router;