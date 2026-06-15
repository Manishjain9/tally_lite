import client from './client';

export const dashboardAPI = {
  getTodaysSummary: async () => {
    const result = await client.get('/dashboard/today');
    return result.data;
  },
  getMonthlySummary: async (month, year) => {
    const result = await client.get('/dashboard/monthly', { params: { month, year } });
    return result.data;
  },
  getChartData: async (type, period = 'month') => {
    const result = await client.get('/dashboard/chart', { params: { type, period } });
    return result.data;
  },
  getRecentTransactions: async (limit = 10) => {
    const result = await client.get('/dashboard/transactions', { params: { limit } });
    return result.data;
  },
  getMetrics: async () => {
    const result = await client.get('/dashboard/metrics');
    return result.data;
  },
};
