const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', validateRequest(schemas.expense), expenseController.createExpense);
router.get('/date-range', expenseController.getExpensesByDateRange);
router.get('/by-category', expenseController.getExpensesByCategory);
router.get('/daily-total', expenseController.getDailyExpensesTotal);
router.get('/', expenseController.getExpenses);
router.get('/:expenseId', expenseController.getExpense);
router.put('/:expenseId', validateRequest(schemas.expense), expenseController.updateExpense);
router.delete('/:expenseId', expenseController.deleteExpense);

module.exports = router;
