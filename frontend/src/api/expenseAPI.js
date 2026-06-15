import client from './client';

export const expenseAPI = {
  create: async (data) => {
    const result = await client.post('/expenses', data);
    return result.data;
  },
  getAll: async (page = 1, limit = 20, filters = {}) => {
    const result = await client.get('/expenses', { params: { page, limit, ...filters } });
    return result.data;
  },
  getById: async (id) => {
    const result = await client.get(`/expenses/${id}`);
    return result.data;
  },
  getByDateRange: async (startDate, endDate) => {
    const result = await client.get('/expenses/date-range', { params: { startDate, endDate } });
    return result.data;
  },
  getByCategory: async (startDate, endDate) => {
    const result = await client.get('/expenses/by-category', { params: { startDate, endDate } });
    return result.data;
  },
  getDailyTotal: async (date) => {
    const result = await client.get('/expenses/daily-total', { params: { date } });
    return result.data;
  },
  update: async (id, data) => {
    const result = await client.put(`/expenses/${id}`, data);
    return result.data;
  },
  delete: async (id) => {
    const result = await client.delete(`/expenses/${id}`);
    return result.data;
  },
};
