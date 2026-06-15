const cashBookService = require('../services/cashBookService');
const { STATUS_CODES } = require('../config/constants');
const helpers = require('../utils/helpers');

class CashBookController {
  async createCashBookEntry(req, res, next) {
    try {
      const userId = req.userId;
      const entry = await cashBookService.createCashBookEntry(userId, req.body);

      res.status(STATUS_CODES.CREATED).json(
        helpers.successResponse(entry, 'Cash book entry created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getCashBookEntry(req, res, next) {
    try {
      const userId = req.userId;
      const { date } = req.params;
      const entry = await cashBookService.getCashBookEntry(userId, date);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(entry)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCashBook(req, res, next) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { startDate, endDate } = req.query;

      const filters = {
        startDate,
        endDate,
      };

      const result = await cashBookService.getCashBook(userId, page, limit, filters);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCashBookEntry(req, res, next) {
    try {
      const userId = req.userId;
      const { date } = req.params;
      const entry = await cashBookService.updateCashBookEntry(userId, date, req.body);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(entry, 'Cash book entry updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getCashSummary(req, res, next) {
    try {
      const userId = req.userId;
      const summary = await cashBookService.getCashSummary(userId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(summary)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCashBookByDateRange(req, res, next) {
    try {
      const userId = req.userId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('startDate and endDate required')
        );
      }

      const entries = await cashBookService.getCashBookByDateRange(userId, startDate, endDate);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(entries)
      );
    } catch (error) {
      next(error);
    }
  }

  async reconcileCash(req, res, next) {
    try {
      const userId = req.userId;
      const { date } = req.params;
      const result = await cashBookService.reconcileCash(userId, date);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CashBookController();
