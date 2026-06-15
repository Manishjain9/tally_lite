const pool = require('../config/database');
const helpers = require('../utils/helpers');
const validators = require('../utils/validators');

class CashBookService {
  async createCashBookEntry(userId, entryData) {
    const connection = await pool.getConnection();

    try {
      const { entry_date, opening_balance, cash_received, cash_paid, remarks } = entryData;

      // Validate no duplicate entry for the date
      const [existing] = await connection.execute(
        'SELECT cash_book_id FROM cash_book WHERE user_id = ? AND entry_date = ?',
        [userId, entry_date]
      );

      if (existing.length > 0) {
        throw {
          statusCode: 409,
          message: 'Cash book entry already exists for this date',
        };
      }

      const closingBalance = validators.calculateClosingBalance(
        opening_balance,
        cash_received || 0,
        cash_paid || 0
      );

      const [result] = await connection.execute(
        `INSERT INTO cash_book (user_id, entry_date, opening_balance, cash_received, cash_paid, closing_balance, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, entry_date, opening_balance, cash_received || 0, cash_paid || 0, closingBalance, remarks || null]
      );

      return {
        cash_book_id: result.insertId,
        user_id: userId,
        entry_date,
        opening_balance,
        cash_received: cash_received || 0,
        cash_paid: cash_paid || 0,
        closing_balance: helpers.roundToTwo(closingBalance),
        remarks,
      };
    } finally {
      connection.release();
    }
  }

  async getCashBookEntry(userId, date) {
    const connection = await pool.getConnection();

    try {
      const [entries] = await connection.execute(
        'SELECT * FROM cash_book WHERE user_id = ? AND entry_date = ?',
        [userId, date]
      );

      if (entries.length === 0) {
        return null;
      }

      return entries[0];
    } finally {
      connection.release();
    }
  }

  async getCashBook(userId, page = 1, limit = 20, filters = {}) {
    const connection = await pool.getConnection();

    try {
      const { offset } = helpers.buildPaginationQuery(page, limit);
      let query = 'SELECT * FROM cash_book WHERE user_id = ?';
      const params = [userId];

      if (filters.startDate && filters.endDate) {
        query += ' AND entry_date BETWEEN ? AND ?';
        params.push(filters.startDate, filters.endDate);
      }

      query += ` ORDER BY entry_date DESC LIMIT ${offset}, ${limit}`;
      // params already has all needed values

      const [entries] = await connection.execute(query, params);

      // Count total
      let countQuery = 'SELECT COUNT(*) as total FROM cash_book WHERE user_id = ?';
      const countParams = [userId];

      if (filters.startDate && filters.endDate) {
        countQuery += ' AND entry_date BETWEEN ? AND ?';
        countParams.push(filters.startDate, filters.endDate);
      }

      const [countResult] = await connection.execute(countQuery, countParams);

      return {
        data: entries,
        pagination: helpers.getPaginationMeta(countResult[0].total, page, limit),
      };
    } finally {
      connection.release();
    }
  }

  async updateCashBookEntry(userId, date, entryData) {
    const connection = await pool.getConnection();

    try {
      const [existing] = await connection.execute(
        'SELECT * FROM cash_book WHERE user_id = ? AND entry_date = ?',
        [userId, date]
      );

      if (existing.length === 0) {
        throw {
          statusCode: 404,
          message: 'Cash book entry not found',
        };
      }

      const { opening_balance, cash_received, cash_paid, remarks } = entryData;

      const closingBalance = validators.calculateClosingBalance(
        opening_balance,
        cash_received || 0,
        cash_paid || 0
      );

      await connection.execute(
        `UPDATE cash_book
         SET opening_balance = ?, cash_received = ?, cash_paid = ?, closing_balance = ?, remarks = ?
         WHERE user_id = ? AND entry_date = ?`,
        [opening_balance, cash_received || 0, cash_paid || 0, closingBalance, remarks || null, userId, date]
      );

      return {
        user_id: userId,
        entry_date: date,
        opening_balance,
        cash_received: cash_received || 0,
        cash_paid: cash_paid || 0,
        closing_balance: helpers.roundToTwo(closingBalance),
        remarks,
      };
    } finally {
      connection.release();
    }
  }

  async getCashSummary(userId) {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        `SELECT
           opening_balance,
           cash_received,
           cash_paid,
           closing_balance
         FROM cash_book
         WHERE user_id = ?
         ORDER BY entry_date DESC
         LIMIT 1`,
        [userId]
      );

      if (result.length === 0) {
        return {
          current_balance: 0,
          last_closing_balance: 0,
        };
      }

      return {
        current_balance: result[0].closing_balance,
        last_closing_balance: result[0].closing_balance,
      };
    } finally {
      connection.release();
    }
  }

  async getCashBookByDateRange(userId, startDate, endDate) {
    const connection = await pool.getConnection();

    try {
      const [entries] = await connection.execute(
        `SELECT * FROM cash_book
         WHERE user_id = ? AND entry_date BETWEEN ? AND ?
         ORDER BY entry_date ASC`,
        [userId, startDate, endDate]
      );

      return entries;
    } finally {
      connection.release();
    }
  }

  async reconcileCash(userId, date) {
    const connection = await pool.getConnection();

    try {
      // Get cash book entry
      const [cashBook] = await connection.execute(
        'SELECT * FROM cash_book WHERE user_id = ? AND entry_date = ?',
        [userId, date]
      );

      if (cashBook.length === 0) {
        throw {
          statusCode: 404,
          message: 'Cash book entry not found',
        };
      }

      const entry = cashBook[0];

      // Calculate expected balance from sales and expenses
      const [salesResult] = await connection.execute(
        `SELECT SUM(total_amount) as total FROM sales_entries
         WHERE user_id = ? AND payment_mode = 'Cash' AND sale_date = ?`,
        [userId, date]
      );

      const [expenseResult] = await connection.execute(
        `SELECT SUM(amount) as total FROM expenses
         WHERE user_id = ? AND expense_date = ?`,
        [userId, date]
      );

      const expectedBalance =
        entry.opening_balance +
        (salesResult[0].total || 0) -
        (expenseResult[0].total || 0);

      const difference = entry.closing_balance - expectedBalance;

      return {
        opening_balance: entry.opening_balance,
        cash_received: entry.cash_received,
        cash_paid: entry.cash_paid,
        closing_balance: entry.closing_balance,
        expected_balance: helpers.roundToTwo(expectedBalance),
        difference: helpers.roundToTwo(difference),
        is_balanced: Math.abs(difference) < 0.01,
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new CashBookService();
