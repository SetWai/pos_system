import axios from 'axios';

// Create an Axios instance with a custom config
const api = axios.create({
  // The base URL of our Django backend API
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;