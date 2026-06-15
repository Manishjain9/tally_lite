import client from './client';

export const salesAPI = {
  create: async (data) => {
    const result = await client.post('/sales', data);
    return result.data;
  },
  getAll: async (page = 1, limit = 20, filters = {}) => {
    const result = await client.get('/sales', { params: { page, limit, ...filters } });
    return result.data;
  },
  getById: async (id) => {
    const result = await client.get(`/sales/${id}`);
    return result.data;
  },
  getByDateRange: async (startDate, endDate) => {
    const result = await client.get('/sales/date-range', { params: { startDate, endDate } });
    return result.data;
  },
  getDailyTotal: async (date) => {
    const result = await client.get('/sales/daily-total', { params: { date } });
    return result.data;
  },
  update: async (id, data) => {
    const result = await client.put(`/sales/${id}`, data);
    return result.data;
  },
  delete: async (id) => {
    const result = await client.delete(`/sales/${id}`);
    return result.data;
  },
};
