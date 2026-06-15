const express = require('express');
const cashBookController = require('../controllers/cashBookController');
const authMiddleware = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', validateRequest(schemas.cashBook), cashBookController.createCashBookEntry);
router.get('/summary', cashBookController.getCashSummary);
router.get('/date-range', cashBookController.getCashBookByDateRange);
router.get('/reconcile/:date', cashBookController.reconcileCash);
router.get('/', cashBookController.getCashBook);
router.get('/:date', cashBookController.getCashBookEntry);
router.put('/:date', validateRequest(schemas.cashBook), cashBookController.updateCashBookEntry);

module.exports = router;
