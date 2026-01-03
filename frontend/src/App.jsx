import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";

// Member-2 Modules
import TwoFactorPage from "./pages/TwoFactorPage"; // Module 1 - 2FA
import DoctorAvailabilityPage from "./pages/DoctorAvailabilityPage"; // Module 2
import EPrescriptionPage from "./pages/EPrescriptionPage"; // Module 3
import AmbulanceBookingPage from "./pages/AmbulanceBookingPage"; // Module 3

// Styles
import "./styles/global.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Member 2 Modules */}
        <Route path="/2fa" element={<TwoFactorPage />} />
        <Route path="/doctor-availability" element={<DoctorAvailabilityPage />} />
        <Route path="/eprescription" element={<EPrescriptionPage />} />
        <Route path="/ambulance-booking" element={<AmbulanceBookingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
