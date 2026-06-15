const pool = require('../config/database');
const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');
const helpers = require('../utils/helpers');
const validators = require('../utils/validators');

class PaymentService {
  async recordPayment(userId, saleId, paymentData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify sale exists
      const [sales] = await connection.execute(
        'SELECT s.total_amount FROM sales_entries s WHERE s.sale_id = ? AND s.user_id = ?',
        [saleId, userId]
      );

      if (sales.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.SALE_NOT_FOUND,
        };
      }

      const { amount_received, payment_type, reference_number } = paymentData;

      // Get current payment status
      const [payments] = await connection.execute(
        'SELECT * FROM payment_tracking WHERE sale_id = ?',
        [saleId]
      );

      if (payments.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: 'Payment tracking not found',
        };
      }

      const payment = payments[0];
      const newAmountReceived = parseFloat(payment.amount_received) + parseFloat(amount_received);
      const newBalance = Math.max(0, parseFloat(payment.total_amount) - newAmountReceived);
      const newStatus = validators.determinePaymentStatus(parseFloat(payment.total_amount), newAmountReceived);

      // Update payment tracking
      await connection.execute(
        `UPDATE payment_tracking
         SET amount_received = ?, balance_amount = ?, payment_status = ?, last_payment_date = NOW()
         WHERE sale_id = ?`,
        [newAmountReceived, newBalance, newStatus, saleId]
      );

      // Update sales entry payment status
      await connection.execute(
        'UPDATE sales_entries SET payment_status = ? WHERE sale_id = ?',
        [newStatus, saleId]
      );

      // Always record payment details
      const [paymentId] = await connection.execute(
        'SELECT payment_id FROM payment_tracking WHERE sale_id = ?',
        [saleId]
      );

      await connection.execute(
        `INSERT INTO online_payments (payment_id, reference_number, payment_type, payment_date, amount_received)
         VALUES (?, ?, ?, NOW(), ?)`,
        [paymentId[0].payment_id, reference_number || null, payment_type || null, amount_received]
      );

      await connection.commit();

      return {
        sale_id: saleId,
        total_amount: payment.total_amount,
        amount_received: helpers.roundToTwo(newAmountReceived),
        balance_amount: helpers.roundToTwo(newBalance),
        payment_status: newStatus,
        last_payment_date: helpers.getTodayDate(),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getPaymentStatus(userId, saleId) {
    const connection = await pool.getConnection();

    try {
      const [payments] = await connection.execute(
        `SELECT pt.*, s.customer_id, c.name as customer_name
         FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         LEFT JOIN customers c ON s.customer_id = c.customer_id
         WHERE pt.sale_id = ? AND s.user_id = ?`,
        [saleId, userId]
      );

      if (payments.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: 'Payment tracking not found',
        };
      }

      return payments[0];
    } finally {
      connection.release();
    }
  }

  async getOutstandingPayments(userId, page = 1, limit = 20) {
    const connection = await pool.getConnection();

    try {
      const { offset } = helpers.buildPaginationQuery(page, limit);

      const [payments] = await connection.execute(
        `SELECT pt.*, s.sale_date, s.customer_id, c.name as customer_name
         FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         LEFT JOIN customers c ON s.customer_id = c.customer_id
         WHERE s.user_id = ? AND pt.payment_status IN ('Pending', 'Partially Paid')
         ORDER BY s.sale_date DESC
         LIMIT ${offset}, ${limit}`,
        [userId]
      );

      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         WHERE s.user_id = ? AND pt.payment_status IN ('Pending', 'Partially Paid')`,
        [userId]
      );

      return {
        data: payments,
        pagination: helpers.getPaginationMeta(countResult[0].total, page, limit),
      };
    } finally {
      connection.release();
    }
  }

  async getOutstandingPaymentsSummary(userId) {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        `SELECT
           COUNT(*) as count,
           SUM(balance_amount) as total_outstanding
         FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         WHERE s.user_id = ? AND pt.payment_status IN ('Pending', 'Partially Paid')`,
        [userId]
      );

      return {
        count: result[0].count || 0,
        total_outstanding: result[0].total_outstanding || 0,
      };
    } finally {
      connection.release();
    }
  }

  async getCustomerOutstandingPayments(userId, customerId) {
    const connection = await pool.getConnection();

    try {
      const [payments] = await connection.execute(
        `SELECT pt.*, s.sale_date
         FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         WHERE s.customer_id = ? AND s.user_id = ? AND pt.payment_status IN ('Pending', 'Partially Paid')
         ORDER BY s.sale_date DESC`,
        [customerId, userId]
      );

      const totalOutstanding = payments.reduce((sum, p) => sum + parseFloat(p.balance_amount), 0);

      return {
        data: payments,
        total_outstanding: totalOutstanding,
      };
    } finally {
      connection.release();
    }
  }

  async getPaymentHistory(userId, saleId) {
    const connection = await pool.getConnection();

    try {
      const [payments] = await connection.execute(
        `SELECT op.* FROM online_payments op
         INNER JOIN payment_tracking pt ON op.payment_id = pt.payment_id
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         WHERE pt.sale_id = ? AND s.user_id = ?
         ORDER BY op.payment_date DESC`,
        [saleId, userId]
      );

      return payments;
    } finally {
      connection.release();
    }
  }

  async getDuePayments(userId, daysOverdue = 30) {
    const connection = await pool.getConnection();

    try {
      const daysAgo = new Date(Date.now() - daysOverdue * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const [payments] = await connection.execute(
        `SELECT pt.*, s.sale_date, s.customer_id, c.name as customer_name
         FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         LEFT JOIN customers c ON s.customer_id = c.customer_id
         WHERE s.user_id = ? AND pt.payment_status IN ('Pending', 'Partially Paid')
         AND s.sale_date <= ?
         ORDER BY s.sale_date ASC`,
        [userId, daysAgo]
      );

      return payments;
    } finally {
      connection.release();
    }
  }

  async getAllPayments(userId, page = 1, limit = 50) {
    const connection = await pool.getConnection();

    try {
      const { offset } = helpers.buildPaginationQuery(page, limit);

      const [payments] = await connection.execute(
        `SELECT pt.*, s.sale_date, s.customer_id, c.name as customer_name
         FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         LEFT JOIN customers c ON s.customer_id = c.customer_id
         WHERE s.user_id = ?
         ORDER BY s.sale_date DESC
         LIMIT ${offset}, ${limit}`,
        [userId]
      );

      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         WHERE s.user_id = ?`,
        [userId]
      );

      return {
        data: payments,
        pagination: helpers.getPaginationMeta(countResult[0].total, page, limit),
      };
    } finally {
      connection.release();
    }
  }

  async updatePayment(userId, paymentId, paymentData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify ownership and get current payment
      const [payments] = await connection.execute(
        `SELECT op.*, pt.sale_id, s.user_id FROM online_payments op
         INNER JOIN payment_tracking pt ON op.payment_id = pt.payment_id
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         WHERE op.online_payment_id = ? AND s.user_id = ?`,
        [paymentId, userId]
      );

      if (payments.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: 'Payment not found',
        };
      }

      const oldPayment = payments[0];
      const { amount_received, payment_type, reference_number } = paymentData;

      // Update online_payments record
      await connection.execute(
        `UPDATE online_payments
         SET amount_received = ?, payment_type = ?, reference_number = ?
         WHERE online_payment_id = ?`,
        [amount_received, payment_type || null, reference_number || null, paymentId]
      );

      await connection.commit();

      return {
        online_payment_id: paymentId,
        amount_received,
        payment_type,
        reference_number,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deletePayment(userId, paymentId) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify ownership
      const [payments] = await connection.execute(
        `SELECT op.*, pt.sale_id, s.user_id FROM online_payments op
         INNER JOIN payment_tracking pt ON op.payment_id = pt.payment_id
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         WHERE op.online_payment_id = ? AND s.user_id = ?`,
        [paymentId, userId]
      );

      if (payments.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: 'Payment not found',
        };
      }

      const payment = payments[0];

      // Delete the payment record
      await connection.execute(
        'DELETE FROM online_payments WHERE online_payment_id = ?',
        [paymentId]
      );

      // Get all remaining payments for this sale
      const [remainingPayments] = await connection.execute(
        `SELECT COALESCE(SUM(amount_received), 0) as total_paid FROM online_payments
         WHERE payment_id = (SELECT payment_id FROM payment_tracking WHERE sale_id = ?)`,
        [payment.sale_id]
      );

      const totalPaid = parseFloat(remainingPayments[0].total_paid);

      // Get sale total
      const [saleData] = await connection.execute(
        'SELECT total_amount FROM sales_entries WHERE sale_id = ?',
        [payment.sale_id]
      );

      const totalAmount = parseFloat(saleData[0].total_amount);
      const newBalance = Math.max(0, totalAmount - totalPaid);
      const newStatus = validators.determinePaymentStatus(totalAmount, totalPaid);

      // Update payment_tracking
      await connection.execute(
        `UPDATE payment_tracking
         SET amount_received = ?, balance_amount = ?, payment_status = ?, last_payment_date = NOW()
         WHERE sale_id = ?`,
        [totalPaid, newBalance, newStatus, payment.sale_id]
      );

      // Update sales entry payment status
      await connection.execute(
        'UPDATE sales_entries SET payment_status = ? WHERE sale_id = ?',
        [newStatus, payment.sale_id]
      );

      await connection.commit();

      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new PaymentService();
