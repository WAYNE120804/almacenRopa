import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || error.message;
    return Promise.reject(new Error(message));
  }
);

export default client;
