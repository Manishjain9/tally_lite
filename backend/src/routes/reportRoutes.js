const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/daily', reportController.getDailyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/customer', reportController.getCustomerReport);
router.get('/cash', reportController.getCashReport);
router.get('/outstanding-payments', reportController.getOutstandingPaymentReport);
router.get('/expenses', reportController.getExpenseReport);

module.exports = router;
