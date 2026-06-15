import client from './client';

export const reportAPI = {
  async getDailyReport(date) {
    const result = await client.get('/reports/daily', { params: { date } });
    return result.data;
  },

  async getMonthlyReport(month, year) {
    const result = await client.get('/reports/monthly', { params: { month, year } });
    return result.data;
  },

  async getCustomerReport(customerId) {
    const result = await client.get('/reports/customer', { params: { customerId } });
    return result.data;
  },

  async getCashReport(startDate, endDate) {
    const result = await client.get('/reports/cash', { params: { startDate, endDate } });
    return result.data;
  },

  async getOutstandingPaymentReport() {
    const result = await client.get('/reports/outstanding-payments');
    return result.data;
  },

  async getExpenseReport(startDate, endDate) {
    const result = await client.get('/reports/expenses', { params: { startDate, endDate } });
    return result.data;
  },
};
