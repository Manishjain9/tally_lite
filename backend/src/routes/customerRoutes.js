const express = require('express');
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', validateRequest(schemas.customer), customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/search', customerController.searchCustomers);
router.get('/recent', customerController.getRecentCustomers);
router.get('/:customerId/transactions', customerController.getCustomerTransactions);
router.get('/:customerId/outstanding-balance', customerController.getCustomerOutstandingBalance);
router.get('/:customerId', customerController.getCustomer);
router.put('/:customerId', validateRequest(schemas.customer), customerController.updateCustomer);
router.delete('/:customerId', customerController.deleteCustomer);

module.exports = router;
