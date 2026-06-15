const expenseService = require('../services/expenseService');
const { STATUS_CODES } = require('../config/constants');
const helpers = require('../utils/helpers');

class ExpenseController {
  async createExpense(req, res, next) {
    try {
      const userId = req.userId;
      const expense = await expenseService.createExpense(userId, req.body);

      res.status(STATUS_CODES.CREATED).json(
        helpers.successResponse(expense, 'Expense created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getExpense(req, res, next) {
    try {
      const userId = req.userId;
      const { expenseId } = req.params;
      const expense = await expenseService.getExpense(userId, expenseId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(expense)
      );
    } catch (error) {
      next(error);
    }
  }

  async getExpenses(req, res, next) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { category, startDate, endDate } = req.query;

      const filters = {
        category,
        startDate,
        endDate,
      };

      const result = await expenseService.getExpenses(userId, page, limit, filters);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const userId = req.userId;
      const { expenseId } = req.params;
      const expense = await expenseService.updateExpense(userId, expenseId, req.body);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(expense, 'Expense updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      const userId = req.userId;
      const { expenseId } = req.params;
      await expenseService.deleteExpense(userId, expenseId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(null, 'Expense deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getExpensesByDateRange(req, res, next) {
    try {
      const userId = req.userId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('startDate and endDate required')
        );
      }

      const expenses = await expenseService.getExpensesByDateRange(userId, startDate, endDate);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(expenses)
      );
    } catch (error) {
      next(error);
    }
  }

  async getExpensesByCategory(req, res, next) {
    try {
      const userId = req.userId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('startDate and endDate required')
        );
      }

      const expenses = await expenseService.getExpensesByCategory(userId, startDate, endDate);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(expenses)
      );
    } catch (error) {
      next(error);
    }
  }

  async getDailyExpensesTotal(req, res, next) {
    try {
      const userId = req.userId;
      const { date } = req.query;

      if (!date) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('Date required')
        );
      }

      const result = await expenseService.getDailyExpensesTotal(userId, date);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExpenseController();
