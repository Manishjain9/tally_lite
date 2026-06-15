const pool = require('../config/database');
const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');
const helpers = require('../utils/helpers');
const validators = require('../utils/validators');

class SalesService {
  async createSale(userId, saleData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { customer_id, sale_date, payment_mode, payment_status, remarks, items } = saleData;

      // Calculate total
      const totalAmount = items.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity) * parseFloat(item.rate));
      }, 0);

      // Create sale entry
      const [saleResult] = await connection.execute(
        `INSERT INTO sales_entries (user_id, customer_id, sale_date, total_amount, payment_mode, payment_status, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, customer_id, sale_date, totalAmount, payment_mode, payment_status || 'Pending', remarks || null]
      );

      const saleId = saleResult.insertId;

      // Insert line items
      for (const item of items) {
        const itemTotal = parseFloat(item.quantity) * parseFloat(item.rate);
        await connection.execute(
          `INSERT INTO sales_line_items (sale_id, product_name, quantity, rate, total, unit)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [saleId, item.product_name, item.quantity, item.rate, itemTotal, item.unit || 'Units']
        );
      }

      // Create payment tracking entry
      await connection.execute(
        `INSERT INTO payment_tracking (sale_id, total_amount, amount_received, balance_amount, payment_status)
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, totalAmount, 0, totalAmount, 'Pending']
      );

      await connection.commit();

      return {
        sale_id: saleId,
        user_id: userId,
        customer_id,
        sale_date,
        total_amount: helpers.roundToTwo(totalAmount),
        payment_mode,
        payment_status: payment_status || 'Pending',
        remarks,
        items,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getSale(userId, saleId) {
    const connection = await pool.getConnection();

    try {
      const [sales] = await connection.execute(
        'SELECT * FROM sales_entries WHERE sale_id = ? AND user_id = ?',
        [saleId, userId]
      );

      if (sales.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.SALE_NOT_FOUND,
        };
      }

      const sale = sales[0];

      // Get line items
      const [items] = await connection.execute(
        'SELECT product_name, quantity, rate, total, unit FROM sales_line_items WHERE sale_id = ?',
        [saleId]
      );

      // Get payment tracking
      const [payments] = await connection.execute(
        'SELECT * FROM payment_tracking WHERE sale_id = ?',
        [saleId]
      );

      return {
        ...sale,
        items,
        payment_tracking: payments[0] || null,
      };
    } finally {
      connection.release();
    }
  }

  async getSales(userId, page = 1, limit = 20, filters = {}) {
    const connection = await pool.getConnection();

    try {
      const { offset } = helpers.buildPaginationQuery(page, limit);
      let query = 'SELECT s.* FROM sales_entries s WHERE s.user_id = ?';
      const params = [userId];

      if (filters.customerId) {
        query += ' AND s.customer_id = ?';
        params.push(filters.customerId);
      }

      if (filters.startDate && filters.endDate) {
        query += ' AND s.sale_date BETWEEN ? AND ?';
        params.push(filters.startDate, filters.endDate);
      }

      if (filters.paymentStatus) {
        query += ' AND s.payment_status = ?';
        params.push(filters.paymentStatus);
      }

      if (filters.paymentMode) {
        query += ' AND s.payment_mode = ?';
        params.push(filters.paymentMode);
      }

      query += ` ORDER BY s.sale_date DESC LIMIT ${offset}, ${limit}`;
      // params already has all needed values

      const [sales] = await connection.execute(query, params);

      // Count total
      let countQuery = 'SELECT COUNT(*) as total FROM sales_entries s WHERE s.user_id = ?';
      const countParams = [userId];

      if (filters.customerId) {
        countQuery += ' AND s.customer_id = ?';
        countParams.push(filters.customerId);
      }

      if (filters.startDate && filters.endDate) {
        countQuery += ' AND s.sale_date BETWEEN ? AND ?';
        countParams.push(filters.startDate, filters.endDate);
      }

      if (filters.paymentStatus) {
        countQuery += ' AND s.payment_status = ?';
        countParams.push(filters.paymentStatus);
      }

      const [countResult] = await connection.execute(countQuery, countParams);

      // Get all sale IDs
      const saleIds = sales.map(s => s.sale_id);

      // Fetch all items for these sales in one query
      let itemsMap = {};
      if (saleIds.length > 0) {
        const placeholders = saleIds.map(() => '?').join(',');
        const [allItems] = await connection.execute(
          `SELECT sale_id, product_name, quantity, rate, unit FROM sales_line_items WHERE sale_id IN (${placeholders})`,
          saleIds
        );

        // Group items by sale_id
        allItems.forEach(item => {
          if (!itemsMap[item.sale_id]) {
            itemsMap[item.sale_id] = [];
          }
          itemsMap[item.sale_id].push(item);
        });
      }

      // Attach items to each sale
      const salesWithItems = sales.map(sale => ({
        ...sale,
        items: itemsMap[sale.sale_id] || [],
        items_preview: (itemsMap[sale.sale_id] || [])
          .map(item => `${item.product_name} (${item.quantity} ${item.unit || 'Units'})`)
          .join(', '),
      }));

      return {
        data: salesWithItems,
        pagination: helpers.getPaginationMeta(countResult[0].total, page, limit),
      };
    } finally {
      connection.release();
    }
  }

  async updateSale(userId, saleId, saleData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify ownership
      const [sales] = await connection.execute(
        'SELECT * FROM sales_entries WHERE sale_id = ? AND user_id = ?',
        [saleId, userId]
      );

      if (sales.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.SALE_NOT_FOUND,
        };
      }

      const { customer_id, sale_date, payment_mode, payment_status, remarks, items } = saleData;

      // Calculate new total
      const totalAmount = items.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity) * parseFloat(item.rate));
      }, 0);

      // Update sale entry
      await connection.execute(
        `UPDATE sales_entries
         SET customer_id = ?, sale_date = ?, total_amount = ?, payment_mode = ?, payment_status = ?, remarks = ?
         WHERE sale_id = ? AND user_id = ?`,
        [customer_id, sale_date, totalAmount, payment_mode, payment_status, remarks || null, saleId, userId]
      );

      // Delete old line items
      await connection.execute('DELETE FROM sales_line_items WHERE sale_id = ?', [saleId]);

      // Insert new line items
      for (const item of items) {
        const itemTotal = parseFloat(item.quantity) * parseFloat(item.rate);
        await connection.execute(
          `INSERT INTO sales_line_items (sale_id, product_name, quantity, rate, total, unit)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [saleId, item.product_name, item.quantity, item.rate, itemTotal, item.unit || 'Units']
        );
      }

      // Update payment tracking
      await connection.execute(
        `UPDATE payment_tracking
         SET total_amount = ?, balance_amount = total_amount - amount_received
         WHERE sale_id = ?`,
        [totalAmount, saleId]
      );

      await connection.commit();

      return {
        sale_id: saleId,
        user_id: userId,
        customer_id,
        sale_date,
        total_amount: helpers.roundToTwo(totalAmount),
        payment_mode,
        payment_status,
        remarks,
        items,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteSale(userId, saleId) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify ownership
      const [sales] = await connection.execute(
        'SELECT * FROM sales_entries WHERE sale_id = ? AND user_id = ?',
        [saleId, userId]
      );

      if (sales.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.SALE_NOT_FOUND,
        };
      }

      // Delete related records
      await connection.execute('DELETE FROM payment_tracking WHERE sale_id = ?', [saleId]);
      await connection.execute('DELETE FROM sales_line_items WHERE sale_id = ?', [saleId]);
      await connection.execute('DELETE FROM sales_entries WHERE sale_id = ? AND user_id = ?', [saleId, userId]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getSalesByDateRange(userId, startDate, endDate) {
    const connection = await pool.getConnection();

    try {
      const [sales] = await connection.execute(
        `SELECT s.*, c.name as customer_name
         FROM sales_entries s
         LEFT JOIN customers c ON s.customer_id = c.customer_id
         WHERE s.user_id = ? AND s.sale_date BETWEEN ? AND ?
         ORDER BY s.sale_date DESC`,
        [userId, startDate, endDate]
      );

      return sales;
    } finally {
      connection.release();
    }
  }

  async getDailySalesTotal(userId, date) {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        'SELECT COUNT(*) as count, SUM(total_amount) as total FROM sales_entries WHERE user_id = ? AND sale_date = ?',
        [userId, date]
      );

      return {
        count: result[0].count || 0,
        total: result[0].total || 0,
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new SalesService();
