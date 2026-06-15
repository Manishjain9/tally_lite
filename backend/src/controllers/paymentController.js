const paymentService = require('../services/paymentService');
const { STATUS_CODES } = require('../config/constants');
const helpers = require('../utils/helpers');

class PaymentController {
  async recordPayment(req, res, next) {
    try {
      const userId = req.userId;
      const { saleId } = req.params;
      const payment = await paymentService.recordPayment(userId, saleId, req.body);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(payment, 'Payment recorded successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStatus(req, res, next) {
    try {
      const userId = req.userId;
      const { saleId } = req.params;
      const payment = await paymentService.getPaymentStatus(userId, saleId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(payment)
      );
    } catch (error) {
      next(error);
    }
  }

  async getOutstandingPayments(req, res, next) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await paymentService.getOutstandingPayments(userId, page, limit);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getOutstandingPaymentsSummary(req, res, next) {
    try {
      const userId = req.userId;
      const result = await paymentService.getOutstandingPaymentsSummary(userId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCustomerOutstandingPayments(req, res, next) {
    try {
      const userId = req.userId;
      const { customerId } = req.params;
      const result = await paymentService.getCustomerOutstandingPayments(userId, customerId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getPaymentHistory(req, res, next) {
    try {
      const userId = req.userId;
      const { saleId } = req.params;
      const history = await paymentService.getPaymentHistory(userId, saleId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(history)
      );
    } catch (error) {
      next(error);
    }
  }

  async getDuePayments(req, res, next) {
    try {
      const userId = req.userId;
      const { daysOverdue } = req.query;
      const parsedDays = daysOverdue ? parseInt(daysOverdue) : 30;
      const payments = await paymentService.getDuePayments(userId, parsedDays);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(payments)
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllPayments(req, res, next) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const result = await paymentService.getAllPayments(userId, page, limit);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }

  async updatePayment(req, res, next) {
    try {
      const userId = req.userId;
      const { paymentId } = req.params;
      const payment = await paymentService.updatePayment(userId, paymentId, req.body);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(payment, 'Payment updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async deletePayment(req, res, next) {
    try {
      const userId = req.userId;
      const { paymentId } = req.params;
      await paymentService.deletePayment(userId, paymentId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(null, 'Payment deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
