import client from './client';

export const authAPI = {
  register: async (email, password, name) => {
    const result = await client.post('/auth/register', { email, password, name });
    return result.data;
  },

  login: async (email, password) => {
    const result = await client.post('/auth/login', { email, password });
    return result.data;
  },

  refreshToken: async (refreshToken) => {
    const result = await client.post('/auth/refresh', { refreshToken });
    return result.data;
  },

  logout: async () => {
    const result = await client.post('/auth/logout');
    return result.data;
  },
};
