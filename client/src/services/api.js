/**
 * API Service - Handles all HTTP requests to backend
 */

import axios from 'axios';

// Base API URL - update this to match your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9358/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  // User registration
  signup: (userData) => api.post('/auth/signup', userData),

  // User login
  login: (credentials) => api.post('/auth/login', credentials),

  // Get user profile
  getProfile: () => api.get('/auth/profile'),
};

// Hospital API endpoints
export const hospitalAPI = {
  // Get all hospitals with filters
  getAll: (params) => api.get('/hospitals', { params }),

  // Get hospital by ID
  getById: (id) => api.get(`/hospitals/${id}`),

  // Create hospital (admin only)
  create: (hospitalData) => api.post('/hospitals', hospitalData),

  // Update hospital (admin only)
  update: (id, hospitalData) => api.put(`/hospitals/${id}`, hospitalData),
};

// Doctor API endpoints
export const doctorAPI = {
  // Get all doctors with filters
  getAll: (params) => api.get('/doctors', { params }),

  // Get doctor by ID
  getById: (id) => api.get(`/doctors/${id}`),

  // Create doctor (admin only)
  create: (doctorData) => api.post('/doctors', doctorData),

  // Update doctor (admin only)
  update: (id, doctorData) => api.put(`/doctors/${id}`, doctorData),
};

export default api;
