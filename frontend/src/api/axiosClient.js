import axios from 'axios';

// In dev, VITE_API_URL is unset, so this falls back to '/api' and uses the Vite proxy.
// In production, set VITE_API_URL to your deployed backend URL.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
