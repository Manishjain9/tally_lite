import client from './client';

export const customerAPI = {
  create: async (data) => {
    const result = await client.post('/customers', data);
    return result.data;
  },
  getAll: async (page = 1, limit = 20) => {
    const result = await client.get('/customers', { params: { page, limit } });
    return result.data;
  },
  search: async (search, limit = 20) => {
    const result = await client.get('/customers/search', { params: { search, limit } });
    return result.data;
  },
  getRecent: async (limit = 10) => {
    const result = await client.get('/customers/recent', { params: { limit } });
    return result.data;
  },
  getById: async (id) => {
    const result = await client.get(`/customers/${id}`);
    return result.data;
  },
  getTransactions: async (id) => {
    const result = await client.get(`/customers/${id}/transactions`);
    return result.data;
  },
  getOutstandingBalance: async (id) => {
    const result = await client.get(`/customers/${id}/outstanding-balance`);
    return result.data;
  },
  update: async (id, data) => {
    const result = await client.put(`/customers/${id}`, data);
    return result.data;
  },
  delete: async (id) => {
    const result = await client.delete(`/customers/${id}`);
    return result.data;
  },
};
