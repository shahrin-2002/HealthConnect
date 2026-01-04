/**
 * Dashboard Page - After successful login
 * Updated to include Doctor Availability Button
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to check if user is a doctor (handles case sensitivity)
  const isDoctor = user?.role?.toLowerCase() === 'doctor';

  return (
    <div className="auth-container">
      {/* Header */}
      <div className="auth-header">
        <button className="hamburger-menu">☰</button>
        <h1>HealthConnect</h1>
        <div></div>
      </div>

      {/* Navigation */}
      <nav className="auth-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/hospitals">Hospitals</Link></li>
          <li><Link to="/doctors">Doctors</Link></li>
          <li className="nav-dropdown">
            <span className="nav-dropdown-toggle">
              Booking <span className="dropdown-arrow">▼</span>
            </span>
            <ul className="nav-dropdown-menu">
              <li><Link to="/booking/icu">ICU</Link></li>
              <li><Link to="/booking/general-bed">General Bed</Link></li>
              <li><Link to="/booking/cabin">Cabin</Link></li>
            </ul>
          </li>
          <li><Link to="/appointments">Appointments</Link></li>
        </ul>
        <div className="nav-buttons">
          <button className="btn-outline" onClick={() => navigate('/blood-donation')} style={{ marginRight: '10px' }}>
            Blood
          </button>
          <button className="btn-outline" onClick={() => navigate('/health-tips')} style={{ marginRight: '10px' }}>
            Tips
          </button>
          <button className="btn-dark" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-content">
        <div className="auth-card">
          <h2>Welcome to HealthConnect!</h2>

          {user && (
            <div style={{ marginTop: '30px' }}>
              <div className="success-message">
                Successfully logged in as {user.role}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                <h3 style={{ marginBottom: '15px', color: '#2B2B2B' }}>
                  Your Profile
                </h3>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                {user.gender && <p><strong>Gender:</strong> {user.gender}</p>}
                {user.date_of_birth && (
                  <p><strong>Date of Birth:</strong> {user.date_of_birth}</p>
                )}
                {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
                {user.address && <p><strong>Address:</strong> {user.address}</p>}
              </div>

              {/* Quick Links */}
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#2B2B2B' }}>Quick Links</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

                  {/* Doctor-only buttons */}
                  {isDoctor && (
                    <>
                      <Link to="/doctor/online-appointments">
                        <button className="btn-submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white' }}>
                          📹 Online Appointments
                        </button>
                      </Link>
                      <Link to="/doctor/schedule">
                        <button className="btn-submit" style={{ padding: '10px 20px', backgroundColor: '#2B2B2B', color: 'white' }}>
                          🕒 Manage Availability
                        </button>
                      </Link>
                    </>
                  )}

                  <Link to="/hospitals">
                    <button className="btn-submit" style={{ padding: '10px 20px' }}>
                      🏥 Find Hospitals
                    </button>
                  </Link>
                  <Link to="/doctors">
                    <button className="btn-submit" style={{ padding: '10px 20px' }}>
                      👨‍⚕️ Find Doctors
                    </button>
                  </Link>
                  <Link to="/appointments">
                    <button className="btn-submit" style={{ padding: '10px 20px' }}>
                      📅 My Appointments
                    </button>
                  </Link>
                  <Link to="/lab-tests">
                    <button className="btn-submit" style={{ padding: '10px 20px', backgroundColor: '#8e44ad', color: 'white' }}>
                      🧪 Lab Tests
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;