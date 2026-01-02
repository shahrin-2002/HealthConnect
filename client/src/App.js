/**
 * Main App Component
 * Updated with Member-2 Feature: Doctor Schedule Management Route
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientAppointments from './pages/PatientAppointments';
import DoctorSlots from './pages/DoctorSlots';
import HospitalSearch from './pages/HospitalSearch';
import DoctorSearch from './pages/DoctorSearch';
// ✅ Member-2: Import the new Manage Schedule page
import ManageSchedule from './pages/ManageSchedule';
// Doctor Online Appointments
import DoctorOnlineAppointments from './pages/DoctorOnlineAppointments';
// Booking Pages
import ICUBooking from './pages/ICUBooking';
import GeneralBedBooking from './pages/GeneralBedBooking';
import CabinBooking from './pages/CabinBooking';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check both context state and localStorage to handle race condition
  const hasToken = isAuthenticated || localStorage.getItem('token');
  return hasToken ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check both context state and localStorage for consistency
  const hasToken = isAuthenticated || localStorage.getItem('token');
  return !hasToken ? children : <Navigate to="/dashboard" />;
};

// Role Guard Component (for role-based routes)
const RoleGuard = ({ role, children }) => {
  const { user } = useAuth();
  // Allow if user matches role (case-insensitive), otherwise deny
  const userRole = user?.role?.toLowerCase();
  const requiredRole = role?.toLowerCase();
  return userRole === requiredRole ? children : <div>Access denied</div>;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard role="Hospital_Admin">
                <AdminDashboard />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Hospital and Doctor Search */}
        <Route path="/hospitals" element={<HospitalSearch />} />
        <Route path="/doctors" element={<DoctorSearch />} />

        {/* Booking Routes */}
        <Route path="/booking/icu" element={<ICUBooking />} />
        <Route path="/booking/general-bed" element={<GeneralBedBooking />} />
        <Route path="/booking/cabin" element={<CabinBooking />} />

        {/* Appointment routes */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <PatientAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute>
              <RoleGuard role="Doctor">
                <DoctorSlots />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ✅ Member-2: Doctor Schedule Management Route */}
        <Route
          path="/doctor/schedule"
          element={
            <ProtectedRoute>
              <RoleGuard role="doctor">
                <ManageSchedule />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Doctor Online Appointments */}
        <Route
          path="/doctor/online-appointments"
          element={
            <ProtectedRoute>
              <RoleGuard role="doctor">
                <DoctorOnlineAppointments />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* 404 - Catch all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;