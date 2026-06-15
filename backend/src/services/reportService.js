const pool = require('../config/database');
const helpers = require('../utils/helpers');

class ReportService {
  async getDailyReport(userId, date) {
    const connection = await pool.getConnection();

    try {
      // Sales
      const [sales] = await connection.execute(
        `SELECT s.*, c.name as customer_name, pt.payment_status
         FROM sales_entries s
         LEFT JOIN customers c ON s.customer_id = c.customer_id
         LEFT JOIN payment_tracking pt ON s.sale_id = pt.sale_id
         WHERE s.user_id = ? AND s.sale_date = ?
         ORDER BY s.created_at DESC`,
        [userId, date]
      );

      // Expenses
      const [expenses] = await connection.execute(
        'SELECT * FROM expenses WHERE user_id = ? AND expense_date = ? ORDER BY created_at DESC',
        [userId, date]
      );

      // Cash book
      const [cashBook] = await connection.execute(
        'SELECT * FROM cash_book WHERE user_id = ? AND entry_date = ?',
        [userId, date]
      );

      const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        date,
        sales: {
          count: sales.length,
          total: helpers.roundToTwo(totalSales),
          transactions: sales,
        },
        expenses: {
          count: expenses.length,
          total: helpers.roundToTwo(totalExpenses),
          transactions: expenses,
        },
        cash_book: cashBook[0] || null,
        summary: {
          total_sales: helpers.roundToTwo(totalSales),
          total_expenses: helpers.roundToTwo(totalExpenses),
          profit_loss: helpers.roundToTwo(totalSales - totalExpenses),
        },
      };
    } finally {
      connection.release();
    }
  }

  async getMonthlyReport(userId, month, year) {
    const connection = await pool.getConnection();

    try {
      // Sales
      const [sales] = await connection.execute(
        `SELECT s.sale_date, SUM(s.total_amount) as daily_total, COUNT(*) as count
         FROM sales_entries s
         WHERE s.user_id = ? AND MONTH(s.sale_date) = ? AND YEAR(s.sale_date) = ?
         GROUP BY s.sale_date
         ORDER BY s.sale_date ASC`,
        [userId, month, year]
      );

      // Expenses
      const [expenses] = await connection.execute(
        `SELECT e.expense_date, SUM(e.amount) as daily_total, COUNT(*) as count
         FROM expenses e
         WHERE e.user_id = ? AND MONTH(e.expense_date) = ? AND YEAR(e.expense_date) = ?
         GROUP BY e.expense_date
         ORDER BY e.expense_date ASC`,
        [userId, month, year]
      );

      // Expense by category
      const [expenseByCategory] = await connection.execute(
        `SELECT e.category, SUM(e.amount) as total, COUNT(*) as count
         FROM expenses e
         WHERE e.user_id = ? AND MONTH(e.expense_date) = ? AND YEAR(e.expense_date) = ?
         GROUP BY e.category
         ORDER BY total DESC`,
        [userId, month, year]
      );

      const totalSales = sales.reduce((sum, s) => sum + s.daily_total, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.daily_total, 0);

      return {
        month,
        year,
        sales: {
          daily_breakdown: sales,
          total: helpers.roundToTwo(totalSales),
        },
        expenses: {
          daily_breakdown: expenses,
          by_category: expenseByCategory,
          total: helpers.roundToTwo(totalExpenses),
        },
        summary: {
          total_sales: helpers.roundToTwo(totalSales),
          total_expenses: helpers.roundToTwo(totalExpenses),
          profit_loss: helpers.roundToTwo(totalSales - totalExpenses),
          profit_margin: helpers.calculateProfitMargin(totalSales, totalExpenses),
        },
      };
    } finally {
      connection.release();
    }
  }

  async getCustomerReport(userId, customerId) {
    const connection = await pool.getConnection();

    try {
      // Customer info
      const [customer] = await connection.execute(
        'SELECT * FROM customers WHERE customer_id = ? AND user_id = ?',
        [customerId, userId]
      );

      if (customer.length === 0) {
        throw {
          statusCode: 404,
          message: 'Customer not found',
        };
      }

      // Transactions
      const [transactions] = await connection.execute(
        `SELECT s.*, pt.payment_status, pt.balance_amount
         FROM sales_entries s
         LEFT JOIN payment_tracking pt ON s.sale_id = pt.sale_id
         WHERE s.customer_id = ? AND s.user_id = ?
         ORDER BY s.sale_date DESC`,
        [customerId, userId]
      );

      const totalAmount = transactions.reduce((sum, t) => sum + t.total_amount, 0);
      const outstandingBalance = transactions.reduce((sum, t) => {
        return sum + (t.balance_amount || 0);
      }, 0);

      return {
        customer: customer[0],
        transactions: {
          count: transactions.length,
          data: transactions,
          total_amount: helpers.roundToTwo(totalAmount),
          outstanding_balance: helpers.roundToTwo(outstandingBalance),
        },
      };
    } finally {
      connection.release();
    }
  }

  async getCashReport(userId, startDate, endDate) {
    const connection = await pool.getConnection();

    try {
      const [cashBook] = await connection.execute(
        `SELECT * FROM cash_book
         WHERE user_id = ? AND entry_date BETWEEN ? AND ?
         ORDER BY entry_date ASC`,
        [userId, startDate, endDate]
      );

      const totalCashReceived = cashBook.reduce((sum, c) => sum + c.cash_received, 0);
      const totalCashPaid = cashBook.reduce((sum, c) => sum + c.cash_paid, 0);

      return {
        period: {
          start_date: startDate,
          end_date: endDate,
        },
        cash_book_entries: cashBook,
        summary: {
          opening_balance: cashBook[0]?.opening_balance || 0,
          total_cash_received: helpers.roundToTwo(totalCashReceived),
          total_cash_paid: helpers.roundToTwo(totalCashPaid),
          closing_balance: cashBook[cashBook.length - 1]?.closing_balance || 0,
        },
      };
    } finally {
      connection.release();
    }
  }

  async getOutstandingPaymentReport(userId) {
    const connection = await pool.getConnection();

    try {
      const [payments] = await connection.execute(
        `SELECT pt.*, s.sale_date, s.customer_id, c.name as customer_name
         FROM payment_tracking pt
         INNER JOIN sales_entries s ON pt.sale_id = s.sale_id
         LEFT JOIN customers c ON s.customer_id = c.customer_id
         WHERE s.user_id = ? AND pt.payment_status IN ('Pending', 'Partially Paid')
         ORDER BY s.sale_date ASC`,
        [userId]
      );

      const totalOutstanding = payments.reduce((sum, p) => sum + p.balance_amount, 0);

      // Group by customer
      const byCustomer = {};
      payments.forEach((p) => {
        if (!byCustomer[p.customer_name]) {
          byCustomer[p.customer_name] = {
            customer_id: p.customer_id,
            total: 0,
            count: 0,
            transactions: [],
          };
        }
        byCustomer[p.customer_name].total += p.balance_amount;
        byCustomer[p.customer_name].count += 1;
        byCustomer[p.customer_name].transactions.push(p);
      });

      return {
        outstanding_payments: {
          count: payments.length,
          total: helpers.roundToTwo(totalOutstanding),
        },
        by_customer: byCustomer,
        all_transactions: payments,
      };
    } finally {
      connection.release();
    }
  }

  async getExpenseReport(userId, startDate, endDate) {
    const connection = await pool.getConnection();

    try {
      const [expenses] = await connection.execute(
        `SELECT * FROM expenses
         WHERE user_id = ? AND expense_date BETWEEN ? AND ?
         ORDER BY expense_date DESC`,
        [userId, startDate, endDate]
      );

      // By category
      const [byCategory] = await connection.execute(
        `SELECT category, SUM(amount) as total, COUNT(*) as count
         FROM expenses
         WHERE user_id = ? AND expense_date BETWEEN ? AND ?
         GROUP BY category
         ORDER BY total DESC`,
        [userId, startDate, endDate]
      );

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        period: {
          start_date: startDate,
          end_date: endDate,
        },
        total_expenses: helpers.roundToTwo(totalExpenses),
        count: expenses.length,
        by_category: byCategory,
        all_transactions: expenses,
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new ReportService();
