import client from './client';

export const paymentAPI = {
  recordPayment: async (saleId, data) => {
    const result = await client.put(`/payments/${saleId}/record`, data);
    return result.data;
  },

  getOutstanding: async () => {
    const result = await client.get('/payments/outstanding');
    return result.data;
  },

  getOutstandingSummary: async () => {
    const result = await client.get('/payments/outstanding-summary');
    return result.data;
  },

  getStatus: async (saleId) => {
    const result = await client.get(`/payments/${saleId}`);
    return result.data;
  },

  getDue: async (daysOverdue = 30) => {
    const result = await client.get('/payments/due', { params: { daysOverdue } });
    return result.data;
  },

  getHistory: async (saleId) => {
    const result = await client.get(`/payments/${saleId}/history`);
    return result.data;
  },

  updatePayment: async (paymentId, data) => {
    const result = await client.put(`/payments/${paymentId}`, data);
    return result.data;
  },

  deletePayment: async (paymentId) => {
    const result = await client.delete(`/payments/${paymentId}`);
    return result.data;
  },

  getAllPayments: async (page = 1, limit = 50) => {
    const result = await client.get('/payments', { params: { page, limit } });
    return result.data;
  },
};
