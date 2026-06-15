const dashboardService = require('../services/dashboardService');
const { STATUS_CODES } = require('../config/constants');
const helpers = require('../utils/helpers');

class DashboardController {
  async getTodaysSummary(req, res, next) {
    try {
      const userId = req.userId;
      const summary = await dashboardService.getTodaysSummary(userId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(summary)
      );
    } catch (error) {
      next(error);
    }
  }

  async getMonthlySummary(req, res, next) {
    try {
      const userId = req.userId;
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('month and year required')
        );
      }

      const summary = await dashboardService.getMonthlySummary(userId, month, year);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(summary)
      );
    } catch (error) {
      next(error);
    }
  }

  async getChartData(req, res, next) {
    try {
      const userId = req.userId;
      const { type, period } = req.query;

      if (!type) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('type required')
        );
      }

      const data = await dashboardService.getChartData(userId, type, period || 'month');

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(data)
      );
    } catch (error) {
      next(error);
    }
  }

  async getRecentTransactions(req, res, next) {
    try {
      const userId = req.userId;
      const { limit } = req.query;
      const transactions = await dashboardService.getRecentTransactions(userId, limit);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(transactions)
      );
    } catch (error) {
      next(error);
    }
  }

  async getDashboardMetrics(req, res, next) {
    try {
      const userId = req.userId;
      const metrics = await dashboardService.getDashboardMetrics(userId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(metrics)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
