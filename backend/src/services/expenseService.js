const pool = require('../config/database');
const helpers = require('../utils/helpers');

class ExpenseService {
  async createExpense(userId, expenseData) {
    const connection = await pool.getConnection();

    try {
      const { expense_date, amount, category, remarks } = expenseData;

      const [result] = await connection.execute(
        `INSERT INTO expenses (user_id, expense_date, amount, category, remarks)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, expense_date, amount, category, remarks || null]
      );

      return {
        expense_id: result.insertId,
        user_id: userId,
        expense_date,
        amount,
        category,
        remarks,
      };
    } finally {
      connection.release();
    }
  }

  async getExpense(userId, expenseId) {
    const connection = await pool.getConnection();

    try {
      const [expenses] = await connection.execute(
        'SELECT * FROM expenses WHERE expense_id = ? AND user_id = ?',
        [expenseId, userId]
      );

      if (expenses.length === 0) {
        throw {
          statusCode: 404,
          message: 'Expense not found',
        };
      }

      return expenses[0];
    } finally {
      connection.release();
    }
  }

  async getExpenses(userId, page = 1, limit = 20, filters = {}) {
    const connection = await pool.getConnection();

    try {
      const { offset } = helpers.buildPaginationQuery(page, limit);
      let query = 'SELECT * FROM expenses WHERE user_id = ?';
      const params = [userId];

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.startDate && filters.endDate) {
        query += ' AND expense_date BETWEEN ? AND ?';
        params.push(filters.startDate, filters.endDate);
      }

      query += ` ORDER BY expense_date DESC LIMIT ${offset}, ${limit}`;
      // params already has all needed values

      const [expenses] = await connection.execute(query, params);

      // Count total
      let countQuery = 'SELECT COUNT(*) as total FROM expenses WHERE user_id = ?';
      const countParams = [userId];

      if (filters.category) {
        countQuery += ' AND category = ?';
        countParams.push(filters.category);
      }

      if (filters.startDate && filters.endDate) {
        countQuery += ' AND expense_date BETWEEN ? AND ?';
        countParams.push(filters.startDate, filters.endDate);
      }

      const [countResult] = await connection.execute(countQuery, countParams);

      return {
        data: expenses,
        pagination: helpers.getPaginationMeta(countResult[0].total, page, limit),
      };
    } finally {
      connection.release();
    }
  }

  async updateExpense(userId, expenseId, expenseData) {
    const connection = await pool.getConnection();

    try {
      const [expenses] = await connection.execute(
        'SELECT * FROM expenses WHERE expense_id = ? AND user_id = ?',
        [expenseId, userId]
      );

      if (expenses.length === 0) {
        throw {
          statusCode: 404,
          message: 'Expense not found',
        };
      }

      const { expense_date, amount, category, remarks } = expenseData;

      await connection.execute(
        `UPDATE expenses
         SET expense_date = ?, amount = ?, category = ?, remarks = ?
         WHERE expense_id = ? AND user_id = ?`,
        [expense_date, amount, category, remarks || null, expenseId, userId]
      );

      return {
        expense_id: expenseId,
        user_id: userId,
        expense_date,
        amount,
        category,
        remarks,
      };
    } finally {
      connection.release();
    }
  }

  async deleteExpense(userId, expenseId) {
    const connection = await pool.getConnection();

    try {
      const [expenses] = await connection.execute(
        'SELECT * FROM expenses WHERE expense_id = ? AND user_id = ?',
        [expenseId, userId]
      );

      if (expenses.length === 0) {
        throw {
          statusCode: 404,
          message: 'Expense not found',
        };
      }

      await connection.execute(
        'DELETE FROM expenses WHERE expense_id = ? AND user_id = ?',
        [expenseId, userId]
      );

      return true;
    } finally {
      connection.release();
    }
  }

  async getExpensesByDateRange(userId, startDate, endDate) {
    const connection = await pool.getConnection();

    try {
      const [expenses] = await connection.execute(
        `SELECT * FROM expenses
         WHERE user_id = ? AND expense_date BETWEEN ? AND ?
         ORDER BY expense_date DESC`,
        [userId, startDate, endDate]
      );

      return expenses;
    } finally {
      connection.release();
    }
  }

  async getDailyExpensesTotal(userId, date) {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        'SELECT COUNT(*) as count, SUM(amount) as total FROM expenses WHERE user_id = ? AND expense_date = ?',
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

  async getExpensesByCategory(userId, startDate, endDate) {
    const connection = await pool.getConnection();

    try {
      const [expenses] = await connection.execute(
        `SELECT category, COUNT(*) as count, SUM(amount) as total
         FROM expenses
         WHERE user_id = ? AND expense_date BETWEEN ? AND ?
         GROUP BY category
         ORDER BY total DESC`,
        [userId, startDate, endDate]
      );

      return expenses;
    } finally {
      connection.release();
    }
  }

  async getMonthlyExpensesSummary(userId, month, year) {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        `SELECT COUNT(*) as count, SUM(amount) as total
         FROM expenses
         WHERE user_id = ? AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?`,
        [userId, month, year]
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

module.exports = new ExpenseService();
