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
  (error) => Promise.reject(error)
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

// =======================
// Auth API endpoints
// =======================
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  getProfile: () => api.get('/auth/profile'),
};

// =======================
// Hospital API endpoints
// =======================
export const hospitalAPI = {
  getAll: (params) => api.get('/hospitals', { params }),
  getById: (id) => api.get(`/hospitals/${id}`),
  create: (hospitalData) => api.post('/hospitals', hospitalData),
  update: (id, hospitalData) => api.put(`/hospitals/${id}`, hospitalData),
};

// =======================
// Doctor API endpoints
// =======================
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (doctorData) => api.post('/doctors', doctorData),
  update: (id, doctorData) => api.put(`/doctors/${id}`, doctorData),
  getSlots: (doctorId, date) => api.get(`/doctors/${doctorId}/slots?date=${date}`),
  updateAvailability: (data) => api.put('/doctors/availability/me', data),
  getMyProfile: () => api.get('/doctors/profile/me'),
};

// =======================
// Appointment API endpoints
// =======================
export const appointmentsAPI = {
  book: (payload) => api.post('/appointments/book', payload),
  reschedule: (id, payload) => api.patch(`/appointments/${id}/reschedule`, payload),
  cancel: (id) => api.delete(`/appointments/${id}/cancel`),
  mine: () => api.get('/appointments/mine'),
  doctor: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
  approve: (id) => api.patch(`/appointments/${id}/approve`),
  complete: (id) => api.patch(`/appointments/${id}/complete`),
};

// =======================
// Medical Record API endpoints
// =======================
export const medicalRecordAPI = {
  // Patient: view own records
  mine: () => api.get('/records/mine'),

  // Doctor: create new record
  create: (payload) => api.post('/records', payload),

  // Doctor: view patient records
  forPatient: (patientId) => api.get(`/records/${patientId}`),

  // Doctor: update record
  update: (id, payload) => api.patch(`/records/${id}`, payload),

  // Doctor: add attachment (metadata only)
  addAttachment: (id, payload) => api.post(`/records/${id}/attachments`, payload),

  // Doctor: remove attachment
  removeAttachment: (id, attachmentId) => api.delete(`/records/${id}/attachments/${attachmentId}`),
};

// =======================
// ICU API endpoints
// =======================
export const icuAPI = {
  // Get all hospitals with ICU (with optional filters)
  getAll: (params) => api.get('/icu', { params }),

  // Get available locations
  getLocations: () => api.get('/icu/locations'),

  // Get ICU details for specific hospital
  getByHospital: (hospitalId) => api.get(`/icu/hospital/${hospitalId}`),

  // Book an ICU (requires auth)
  book: (payload) => api.post('/icu/book', payload),

  // Join waitlist (requires auth)
  joinWaitlist: (payload) => api.post('/icu/waitlist', payload),

  // Get user's ICU bookings
  myBookings: () => api.get('/icu/my-bookings'),

  // Get user's waitlist entries
  myWaitlist: () => api.get('/icu/my-waitlist'),

  // Cancel ICU booking
  cancelBooking: (bookingId) => api.delete(`/icu/booking/${bookingId}`),
};

// =======================
// General Bed API endpoints
// =======================
export const generalBedAPI = {
  // Get all hospitals with General Beds (with optional filters)
  getAll: (params) => api.get('/general-bed', { params }),

  // Get available locations
  getLocations: () => api.get('/general-bed/locations'),

  // Get General Bed details for specific hospital
  getByHospital: (hospitalId) => api.get(`/general-bed/hospital/${hospitalId}`),

  // Book a General Bed (requires auth)
  book: (payload) => api.post('/general-bed/book', payload),

  // Join waitlist (requires auth)
  joinWaitlist: (payload) => api.post('/general-bed/waitlist', payload),

  // Get user's General Bed bookings
  myBookings: () => api.get('/general-bed/my-bookings'),

  // Cancel General Bed booking
  cancelBooking: (bookingId) => api.delete(`/general-bed/booking/${bookingId}`),
};

// =======================
// Cabin API endpoints
// =======================
export const cabinAPI = {
  // Get all hospitals with Cabins (with optional filters)
  getAll: (params) => api.get('/cabin', { params }),

  // Get available locations
  getLocations: () => api.get('/cabin/locations'),

  // Get Cabin details for specific hospital
  getByHospital: (hospitalId) => api.get(`/cabin/hospital/${hospitalId}`),

  // Book a Cabin (requires auth)
  book: (payload) => api.post('/cabin/book', payload),

  // Join waitlist (requires auth)
  joinWaitlist: (payload) => api.post('/cabin/waitlist', payload),

  // Get user's Cabin bookings
  myBookings: () => api.get('/cabin/my-bookings'),

  // Cancel Cabin booking
  cancelBooking: (bookingId) => api.delete(`/cabin/booking/${bookingId}`),
};

export default api;
