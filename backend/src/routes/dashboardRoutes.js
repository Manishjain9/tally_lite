const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/today', dashboardController.getTodaysSummary);
router.get('/monthly', dashboardController.getMonthlySummary);
router.get('/chart', dashboardController.getChartData);
router.get('/transactions', dashboardController.getRecentTransactions);
router.get('/metrics', dashboardController.getDashboardMetrics);

module.exports = router;
