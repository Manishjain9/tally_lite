const customerService = require('../services/customerService');
const { STATUS_CODES } = require('../config/constants');
const helpers = require('../utils/helpers');

class CustomerController {
  async createCustomer(req, res, next) {
    try {
      const userId = req.userId;
      const customer = await customerService.createCustomer(userId, req.body);

      res.status(STATUS_CODES.CREATED).json(
        helpers.successResponse(customer, 'Customer created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const userId = req.userId;
      const { customerId } = req.params;
      const customer = await customerService.updateCustomer(userId, customerId, req.body);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(customer, 'Customer updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getCustomer(req, res, next) {
    try {
      const userId = req.userId;
      const { customerId } = req.params;
      const customer = await customerService.getCustomer(userId, customerId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(customer)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCustomers(req, res, next) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await customerService.getCustomers(userId, page, limit);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(result)
      );
    } catch (error) {
      next(error);
    }
  }

  async searchCustomers(req, res, next) {
    try {
      const userId = req.userId;
      const { search, limit } = req.query;

      if (!search) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('Search term required')
        );
      }

      const parsedLimit = limit ? parseInt(limit) : 20;
      const customers = await customerService.searchCustomers(userId, search, parsedLimit);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(customers)
      );
    } catch (error) {
      next(error);
    }
  }

  async getRecentCustomers(req, res, next) {
    try {
      const userId = req.userId;
      const { limit } = req.query;
      const parsedLimit = limit ? parseInt(limit) : 10;
      const customers = await customerService.getRecentCustomers(userId, parsedLimit);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(customers)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCustomerTransactions(req, res, next) {
    try {
      const userId = req.userId;
      const { customerId } = req.params;
      const transactions = await customerService.getCustomerTransactions(userId, customerId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(transactions)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCustomerOutstandingBalance(req, res, next) {
    try {
      const userId = req.userId;
      const { customerId } = req.params;
      const balance = await customerService.getCustomerOutstandingBalance(userId, customerId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse({ outstanding_balance: balance })
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      const userId = req.userId;
      const { customerId } = req.params;
      await customerService.deleteCustomer(userId, customerId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(null, 'Customer deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
