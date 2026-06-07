import axios from 'axios';

// Create an Axios instance with a custom config
const api = axios.create({
  // The base URL of our Django backend API
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically attach the token to every request
api.interceptors.request.use(
    (config) => {
      // Get the token from localStorage
      const token = localStorage.getItem('access_token');
      
      // If token exists, add it to the Authorization header
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

export default api;