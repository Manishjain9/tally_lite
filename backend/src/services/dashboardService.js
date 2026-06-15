const pool = require('../config/database');
const helpers = require('../utils/helpers');

class DashboardService {
  async getTodaysSummary(userId) {
    const connection = await pool.getConnection();

    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`[Dashboard] Querying for userId: ${userId}, today: ${today}`);

      // Today's sales
      const [salesResult] = await connection.execute(
        `SELECT COUNT(*) as count, SUM(total_amount) as total
         FROM sales_entries WHERE user_id = ? AND DATE(sale_date) = ?`,
        [userId, today]
      );
      console.log(`[Dashboard] Sales result:`, salesResult[0]);

      // Today's expenses
      const [expenseResult] = await connection.execute(
        `SELECT COUNT(*) as count, SUM(amount) as total
         FROM expenses WHERE user_id = ? AND DATE(expense_date) = ?`,
        [userId, today]
      );

      // Today's cash in hand
      const [cashResult] = await connection.execute(
        `SELECT closing_balance FROM cash_book
         WHERE user_id = ? AND DATE(entry_date) = ?`,
        [userId, today]
      );

      // Outstanding payments
      const [paymentResult] = await connection.execute(
        `SELECT SUM(balance_amount) as total
         FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         WHERE s.user_id = ? AND pt.payment_status IN ('Pending', 'Partially Paid')`,
        [userId]
      );

      return {
        today_sales: {
          count: salesResult[0].count || 0,
          total: salesResult[0].total || 0,
        },
        today_expenses: {
          count: expenseResult[0].count || 0,
          total: expenseResult[0].total || 0,
        },
        cash_in_hand: cashResult[0]?.closing_balance || 0,
        outstanding_payments: paymentResult[0].total || 0,
        today_profit_loss: (salesResult[0].total || 0) - (expenseResult[0].total || 0),
      };
    } finally {
      connection.release();
    }
  }

  async getMonthlySummary(userId, month, year) {
    const connection = await pool.getConnection();

    try {
      // Monthly sales
      const [salesResult] = await connection.execute(
        `SELECT COUNT(*) as count, SUM(total_amount) as total
         FROM sales_entries WHERE user_id = ? AND MONTH(sale_date) = ? AND YEAR(sale_date) = ?`,
        [userId, month, year]
      );

      // Monthly expenses
      const [expenseResult] = await connection.execute(
        `SELECT COUNT(*) as count, SUM(amount) as total
         FROM expenses WHERE user_id = ? AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?`,
        [userId, month, year]
      );

      // Top customers
      const [topCustomers] = await connection.execute(
        `SELECT c.customer_id, c.name, SUM(s.total_amount) as total
         FROM sales_entries s
         INNER JOIN customers c ON s.customer_id = c.customer_id
         WHERE s.user_id = ? AND MONTH(s.sale_date) = ? AND YEAR(s.sale_date) = ?
         GROUP BY c.customer_id
         ORDER BY total DESC
         LIMIT 5`,
        [userId, month, year]
      );

      return {
        monthly_sales: {
          count: salesResult[0].count || 0,
          total: salesResult[0].total || 0,
        },
        monthly_expenses: {
          count: expenseResult[0].count || 0,
          total: expenseResult[0].total || 0,
        },
        monthly_profit: (salesResult[0].total || 0) - (expenseResult[0].total || 0),
        profit_margin: helpers.calculateProfitMargin(
          salesResult[0].total || 0,
          expenseResult[0].total || 0
        ),
        top_customers: topCustomers,
      };
    } finally {
      connection.release();
    }
  }

  async getChartData(userId, type, period) {
    const connection = await pool.getConnection();

    try {
      const { startDate, endDate } = helpers.getDateRange(period);

      if (type === 'sales') {
        const [data] = await connection.execute(
          `SELECT DATE(sale_date) as date, SUM(total_amount) as total, COUNT(*) as count
           FROM sales_entries
           WHERE user_id = ? AND DATE(sale_date) BETWEEN ? AND ?
           GROUP BY DATE(sale_date)
           ORDER BY DATE(sale_date) ASC`,
          [userId, startDate, endDate]
        );
        return data;
      }

      if (type === 'expenses') {
        const [data] = await connection.execute(
          `SELECT DATE(expense_date) as date, SUM(amount) as total, COUNT(*) as count
           FROM expenses
           WHERE user_id = ? AND DATE(expense_date) BETWEEN ? AND ?
           GROUP BY DATE(expense_date)
           ORDER BY DATE(expense_date) ASC`,
          [userId, startDate, endDate]
        );
        return data;
      }

      if (type === 'expense_category') {
        const [data] = await connection.execute(
          `SELECT category, SUM(amount) as total
           FROM expenses
           WHERE user_id = ? AND DATE(expense_date) BETWEEN ? AND ?
           GROUP BY category
           ORDER BY total DESC`,
          [userId, startDate, endDate]
        );
        return data;
      }

      return [];
    } finally {
      connection.release();
    }
  }

  async getRecentTransactions(userId, limit = 10) {
    const connection = await pool.getConnection();

    try {
      const [transactions] = await connection.execute(
        `SELECT s.sale_id, c.name as customer_name, s.total_amount, s.sale_date, pt.payment_status, 'sale' as type
         FROM sales_entries s
         LEFT JOIN customers c ON s.customer_id = c.customer_id
         LEFT JOIN payment_tracking pt ON s.sale_id = pt.sale_id
         WHERE s.user_id = ?
         ORDER BY s.sale_date DESC
         LIMIT ?`,
        [userId, limit]
      );

      return transactions;
    } finally {
      connection.release();
    }
  }

  async getDashboardMetrics(userId) {
    const connection = await pool.getConnection();

    try {
      // Total customers
      const [customers] = await connection.execute(
        'SELECT COUNT(*) as count FROM customers WHERE user_id = ?',
        [userId]
      );

      // Total transactions
      const [sales] = await connection.execute(
        'SELECT COUNT(*) as count, SUM(total_amount) as total FROM sales_entries WHERE user_id = ?',
        [userId]
      );

      // Total expenses
      const [expenses] = await connection.execute(
        'SELECT COUNT(*) as count, SUM(amount) as total FROM expenses WHERE user_id = ?',
        [userId]
      );

      // Average transaction value
      const avgTransactionValue =
        sales[0].count > 0 ? (sales[0].total || 0) / sales[0].count : 0;

      return {
        total_customers: customers[0].count || 0,
        total_transactions: sales[0].count || 0,
        total_sales: sales[0].total || 0,
        total_expenses: expenses[0].total || 0,
        total_profit: (sales[0].total || 0) - (expenses[0].total || 0),
        avg_transaction_value: helpers.roundToTwo(avgTransactionValue),
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new DashboardService();
