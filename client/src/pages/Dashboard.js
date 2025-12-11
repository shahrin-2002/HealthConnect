/**
 * Dashboard Page - After successful login
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        <div className="nav-buttons">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
