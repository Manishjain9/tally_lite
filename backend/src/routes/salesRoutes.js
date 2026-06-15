const express = require('express');
const salesController = require('../controllers/salesController');
const authMiddleware = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', validateRequest(schemas.salesEntry), salesController.createSale);
router.get('/date-range', salesController.getSalesByDateRange);
router.get('/daily-total', salesController.getDailySalesTotal);
router.get('/', salesController.getSales);
router.get('/:saleId', salesController.getSale);
router.put('/:saleId', validateRequest(schemas.salesEntry), salesController.updateSale);
router.delete('/:saleId', salesController.deleteSale);

module.exports = router;
