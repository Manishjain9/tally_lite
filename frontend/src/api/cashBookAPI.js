import client from './client';

export const cashBookAPI = {
  create: async (data) => {
    const result = await client.post('/cash-book', data);
    return result.data;
  },
  getAll: async (page = 1, limit = 20, filters = {}) => {
    const result = await client.get('/cash-book', { params: { page, limit, ...filters } });
    return result.data;
  },
  getByDate: async (date) => {
    const result = await client.get(`/cash-book/${date}`);
    return result.data;
  },
  getByDateRange: async (startDate, endDate) => {
    const result = await client.get('/cash-book/date-range', { params: { startDate, endDate } });
    return result.data;
  },
  getSummary: async () => {
    const result = await client.get('/cash-book/summary');
    return result.data;
  },
  reconcile: async (date) => {
    const result = await client.get(`/cash-book/reconcile/${date}`);
    return result.data;
  },
  update: async (date, data) => {
    const result = await client.put(`/cash-book/${date}`, data);
    return result.data;
  },
};
