const express = require('express');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/', paymentController.getAllPayments);
router.get('/outstanding', paymentController.getOutstandingPayments);
router.get('/outstanding-summary', paymentController.getOutstandingPaymentsSummary);
router.get('/due', paymentController.getDuePayments);
router.put('/:paymentId', validateRequest(schemas.paymentUpdate), paymentController.updatePayment);
router.delete('/:paymentId', paymentController.deletePayment);
router.get('/customer/:customerId', paymentController.getCustomerOutstandingPayments);
router.get('/:saleId/status', paymentController.getPaymentStatus);
router.get('/:saleId/history', paymentController.getPaymentHistory);
router.put('/:saleId/record', validateRequest(schemas.paymentUpdate), paymentController.recordPayment);

module.exports = router;
