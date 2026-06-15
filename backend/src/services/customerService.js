const pool = require('../config/database');
const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');
const helpers = require('../utils/helpers');

class CustomerService {
  async createCustomer(userId, customerData) {
    const connection = await pool.getConnection();

    try {
      const { name, mobile, company_name, address, city, gst_number, notes } = customerData;

      const [result] = await connection.execute(
        `INSERT INTO customers (user_id, name, mobile, company_name, address, city, gst_number, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, mobile || null, company_name || null, address || null, city || null, gst_number || null, notes || null]
      );

      return {
        customer_id: result.insertId,
        user_id: userId,
        name,
        mobile,
        company_name,
        address,
        city,
        gst_number,
        notes,
      };
    } finally {
      connection.release();
    }
  }

  async updateCustomer(userId, customerId, customerData) {
    const connection = await pool.getConnection();

    try {
      // Verify ownership
      const [customers] = await connection.execute(
        'SELECT * FROM customers WHERE customer_id = ? AND user_id = ?',
        [customerId, userId]
      );

      if (customers.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.CUSTOMER_NOT_FOUND,
        };
      }

      const { name, mobile, company_name, address, city, gst_number, notes } = customerData;

      await connection.execute(
        `UPDATE customers
         SET name = ?, mobile = ?, company_name = ?, address = ?, city = ?, gst_number = ?, notes = ?
         WHERE customer_id = ? AND user_id = ?`,
        [name, mobile || null, company_name || null, address || null, city || null, gst_number || null, notes || null, customerId, userId]
      );

      return {
        customer_id: customerId,
        user_id: userId,
        name,
        mobile,
        company_name,
        address,
        city,
        gst_number,
        notes,
      };
    } finally {
      connection.release();
    }
  }

  async getCustomer(userId, customerId) {
    const connection = await pool.getConnection();

    try {
      const [customers] = await connection.execute(
        'SELECT * FROM customers WHERE customer_id = ? AND user_id = ?',
        [customerId, userId]
      );

      if (customers.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.CUSTOMER_NOT_FOUND,
        };
      }

      return customers[0];
    } finally {
      connection.release();
    }
  }

  async getCustomers(userId, page = 1, limit = 20) {
    const connection = await pool.getConnection();

    try {
      const { offset } = helpers.buildPaginationQuery(page, limit);

      const [customers] = await connection.execute(
        `SELECT c.*, COALESCE(SUM(pt.balance_amount), 0) as outstanding_balance
         FROM customers c
         LEFT JOIN sales_entries s ON c.customer_id = s.customer_id AND s.user_id = ?
         LEFT JOIN payment_tracking pt ON s.sale_id = pt.sale_id AND pt.payment_status IN ('Pending', 'Partially Paid')
         WHERE c.user_id = ?
         GROUP BY c.customer_id
         ORDER BY c.name ASC
         LIMIT ${offset}, ${limit}`,
        [userId, userId]
      );

      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM customers WHERE user_id = ?',
        [userId]
      );

      return {
        data: customers,
        pagination: helpers.getPaginationMeta(countResult[0].total, page, limit),
      };
    } finally {
      connection.release();
    }
  }

  async searchCustomers(userId, searchTerm, limit = 20) {
    const connection = await pool.getConnection();

    try {
      const searchPattern = `%${searchTerm}%`;

      const [customers] = await connection.execute(
        `SELECT * FROM customers
         WHERE user_id = ? AND (name LIKE ? OR mobile LIKE ? OR company_name LIKE ?)
         ORDER BY name ASC
         LIMIT ?`,
        [userId, searchPattern, searchPattern, searchPattern, limit]
      );

      return customers;
    } finally {
      connection.release();
    }
  }

  async getRecentCustomers(userId, limit = 10) {
    const connection = await pool.getConnection();

    try {
      const [customers] = await connection.execute(
        `SELECT DISTINCT c.* FROM customers c
         INNER JOIN sales_entries s ON c.customer_id = s.customer_id
         WHERE c.user_id = ? AND s.user_id = ?
         ORDER BY s.sale_date DESC
         LIMIT ?`,
        [userId, userId, limit]
      );

      return customers;
    } finally {
      connection.release();
    }
  }

  async getCustomerTransactions(userId, customerId) {
    const connection = await pool.getConnection();

    try {
      // Verify customer exists
      const [customers] = await connection.execute(
        'SELECT * FROM customers WHERE customer_id = ? AND user_id = ?',
        [customerId, userId]
      );

      if (customers.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.CUSTOMER_NOT_FOUND,
        };
      }

      // Get transactions
      const [transactions] = await connection.execute(
        `SELECT s.*, pt.balance_amount, pt.payment_status
         FROM sales_entries s
         LEFT JOIN payment_tracking pt ON s.sale_id = pt.sale_id
         WHERE s.customer_id = ? AND s.user_id = ?
         ORDER BY s.sale_date DESC`,
        [customerId, userId]
      );

      // Fetch items for each transaction
      const transactionsWithItems = await Promise.all(
        transactions.map(async (txn) => {
          const [items] = await connection.execute(
            `SELECT product_name, quantity, rate, unit, (quantity * rate) as total
             FROM sales_line_items
             WHERE sale_id = ?`,
            [txn.sale_id]
          );
          return {
            ...txn,
            items,
          };
        })
      );

      return transactionsWithItems;
    } finally {
      connection.release();
    }
  }

  async deleteCustomer(userId, customerId) {
    const connection = await pool.getConnection();

    try {
      // Verify ownership
      const [customers] = await connection.execute(
        'SELECT * FROM customers WHERE customer_id = ? AND user_id = ?',
        [customerId, userId]
      );

      if (customers.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.CUSTOMER_NOT_FOUND,
        };
      }

      // Check if customer has transactions
      const [transactions] = await connection.execute(
        'SELECT COUNT(*) as count FROM sales_entries WHERE customer_id = ?',
        [customerId]
      );

      if (transactions[0].count > 0) {
        throw {
          statusCode: STATUS_CODES.CONFLICT,
          message: 'Cannot delete customer with existing transactions',
        };
      }

      await connection.execute(
        'DELETE FROM customers WHERE customer_id = ? AND user_id = ?',
        [customerId, userId]
      );

      return true;
    } finally {
      connection.release();
    }
  }

  async getCustomerOutstandingBalance(userId, customerId) {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        `SELECT SUM(pt.balance_amount) as outstanding_balance
         FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         WHERE s.customer_id = ? AND s.user_id = ? AND pt.payment_status IN ('Pending', 'Partially Paid')`,
        [customerId, userId]
      );

      return result[0].outstanding_balance || 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = new CustomerService();
