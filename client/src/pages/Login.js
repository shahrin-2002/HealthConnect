/**
 * Login Page Component
 * Matches the login.jpeg design
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Redirect to dashboard or home page
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Header */}
      <div className="auth-header">
        <button className="hamburger-menu">☰</button>
        <h1>HealthConnect</h1>
        <div></div> {/* Spacer for flex layout */}
      </div>

      {/* Navigation */}
      <nav className="auth-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/hospitals">Hospitals</Link></li>
          <li><Link to="/ambulance">Ambulance</Link></li>
          <li><Link to="/doctors">Doctors</Link></li>
          <li><Link to="/locations">Locations</Link></li>
          <li><Link to="/booking">Booking</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/link">Link</Link></li>
          <li><Link to="/blood-donation">Blood</Link></li>
          <li><Link to="/health-tips">Tips</Link></li>
        </ul>
        <div className="nav-buttons">
          <Link to="/register">
            <button className="btn-dark">Register</button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-link-top">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </div>

          <h2>Log In</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="your@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-submit btn-submit-dark"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="forgot-password">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
