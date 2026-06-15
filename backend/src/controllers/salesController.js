const salesService = require('../services/salesService');
const { STATUS_CODES } = require('../config/constants');
const helpers = require('../utils/helpers');

class SalesController {
  async createSale(req, res, next) {
    try {
      const userId = req.userId;
      const sale = await salesService.createSale(userId, req.body);

      res.status(STATUS_CODES.CREATED).json(
        helpers.successResponse(sale, 'Sale created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getSale(req, res, next) {
    try {
      const userId = req.userId;
      const { saleId } = req.params;
      const sale = await salesService.getSale(userId, saleId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(sale)
      );
    } catch (error) {
      next(error);
    }
  }

  async getSales(req, res, next) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { customerId, startDate, endDate, paymentStatus, paymentMode } = req.query;

      const filters = {
        customerId: customerId ? parseInt(customerId) : null,
        startDate,
        endDate,
        paymentStatus,
        paymentMode,
      };

      const result = await salesService.getSales(userId, page, limit, filters);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateSale(req, res, next) {
    try {
      const userId = req.userId;
      const { saleId } = req.params;
      const sale = await salesService.updateSale(userId, saleId, req.body);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(sale, 'Sale updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteSale(req, res, next) {
    try {
      const userId = req.userId;
      const { saleId } = req.params;
      await salesService.deleteSale(userId, saleId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(null, 'Sale deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getSalesByDateRange(req, res, next) {
    try {
      const userId = req.userId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('startDate and endDate required')
        );
      }

      const sales = await salesService.getSalesByDateRange(userId, startDate, endDate);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(sales)
      );
    } catch (error) {
      next(error);
    }
  }

  async getDailySalesTotal(req, res, next) {
    try {
      const userId = req.userId;
      const { date } = req.query;

      if (!date) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('Date required')
        );
      }

      const result = await salesService.getDailySalesTotal(userId, date);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SalesController();
