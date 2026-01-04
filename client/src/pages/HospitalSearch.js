/**
 * Hospital Search Page Component
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hospitalAPI } from '../services/api';
import '../styles/Search.css';

const HospitalSearch = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  // Fetch hospitals
  const fetchHospitals = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const params = { limit, offset };
      if (search) params.search = search;

      const response = await hospitalAPI.getAll(params);
      const data = response.data.data || response.data.hospitals || [];
      setHospitals(data);
      setTotal(response.data.total || data.length);

      // Auto-select first hospital if available
      if (data.length > 0 && !selectedHospital) {
        fetchHospitalDetails(data[0]._id || data[0].id);
      }
    } catch (err) {
      setError('Failed to load hospitals');
      console.error('Fetch hospitals error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hospital details
  const fetchHospitalDetails = async (id) => {
    try {
      const response = await hospitalAPI.getById(id);
      setSelectedHospital(response.data.data || response.data.hospital || response.data);
    } catch (err) {
      console.error('Fetch hospital details error:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHospitals();
  }, [offset]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setOffset(0);
    fetchHospitals(searchQuery);
  };

  // Handle hospital selection
  const handleSelectHospital = (hospital) => {
    fetchHospitalDetails(hospital._id || hospital.id);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="search-container">
      {/* Header */}
      <div className="search-header">
        <button className="hamburger-menu">☰</button>
        <h1>HealthConnect</h1>
        <div></div>
      </div>

      {/* Navigation */}
      <nav className="search-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/hospitals" className="active">Hospitals</Link></li>
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
          <li><Link to="/dashboard">Dashboard</Link></li>
        </ul>
        <div className="nav-buttons">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <button className="btn-outline">Dashboard</button>
              </Link>
              <button className="btn-dark" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn-outline">Sign in</button>
              </Link>
              <Link to="/register">
                <button className="btn-dark">Register</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Search Bar */}
      <div className="search-bar-container">
        <form onSubmit={handleSearch} className="search-form">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Find Hospitals"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-mic">🎤</button>
        </form>
      </div>

      {/* Main Content */}
      <div className="search-content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading hospitals...</div>
        ) : (
          <>
            {/* Hospital List (Left Side) */}
            <div className="search-list">
              {hospitals.map((hospital) => (
                <div
                  key={hospital._id || hospital.id}
                  className={`list-item ${(selectedHospital?._id || selectedHospital?.id) === (hospital._id || hospital.id) ? 'active' : ''}`}
                  onClick={() => handleSelectHospital(hospital)}
                >
                  <div className="list-item-image">
                    <span className="placeholder-icon">🏥</span>
                  </div>
                  <div className="list-item-info">
                    <h4>{hospital.name}</h4>
                    <p>{hospital.city}</p>
                    {hospital.specializations && (
                      <span className="specialization-tag">
                        {hospital.specializations.split(',')[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {hospitals.length === 0 && !loading && (
                <div className="no-results">No hospitals found</div>
              )}
            </div>

            {/* Hospital Details (Right Side) */}
            {selectedHospital && (
              <div className="search-details">
                <div className="details-card">
                  <div className="details-image">
                    <button className="favorite-btn">♡</button>
                    <div className="image-placeholder">
                      <span>🏥</span>
                    </div>
                  </div>

                  <div className="details-info">
                    <h2>{selectedHospital.name}</h2>

                    <div className="price-badge">
                      <span className="badge-label">Consultation</span>
                      <div className="price-value">
                        <span className="currency">taka</span>
                        <span className="amount">500</span>
                      </div>
                    </div>

                    <p className="details-instruction">
                      Please make sure to select a consultant and your available time
                      slot before booking for an appointment with our hospital.
                    </p>

                    <div className="booking-form">
                      <div className="form-row">
                        <div className="form-field">
                          <label>Consultant List</label>
                          <select className="form-select">
                            <option value="">Select Doctor</option>
                            {selectedHospital.doctors?.map((doctor) => (
                              <option key={doctor._id || doctor.id} value={doctor._id || doctor.id}>
                                {doctor.name} - {doctor.specialization}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-field">
                          <label>Date</label>
                          <input type="date" className="form-select" />
                        </div>
                      </div>

                      <button className="btn-booking">Book Appointment</button>
                    </div>

                    <div className="about-section">
                      <div className="about-header">
                        <span>About</span>
                        <span className="about-toggle">▲</span>
                      </div>
                      <h4>{selectedHospital.name} - {selectedHospital.city}</h4>
                      <p>
                        {selectedHospital.description ||
                          `${selectedHospital.name} is a leading healthcare facility located in ${selectedHospital.city}.
                          We provide comprehensive medical services with state-of-the-art facilities.`}
                      </p>
                      {selectedHospital.beds_total && (
                        <p><strong>Total Beds:</strong> {selectedHospital.beds_total}</p>
                      )}
                      {selectedHospital.phone && (
                        <p><strong>Phone:</strong> {selectedHospital.phone}</p>
                      )}
                      {selectedHospital.email && (
                        <p><strong>Email:</strong> {selectedHospital.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h3>Latest reviews</h3>
        <div className="reviews-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="review-card">
              <div className="review-stars">★★★★★</div>
              <h4 className="review-title">Great Service</h4>
              <p className="review-body">Excellent healthcare facility with caring staff.</p>
              <div className="reviewer-info">
                <div className="reviewer-avatar">👤</div>
                <div>
                  <p className="reviewer-name">Patient {i}</p>
                  <p className="reviewer-date">Dec 2024</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="newsletter-section">
        <h3>Follow the latest trends</h3>
        <p>With our daily newsletter</p>
        <div className="newsletter-form">
          <input type="email" placeholder="you@example.com" />
          <button className="btn-submit-newsletter">Submit</button>
        </div>
      </div>
    </div>
  );
};

export default HospitalSearch;
