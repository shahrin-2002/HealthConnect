/**
 * General Bed Booking Page Component
 * Allows users to view General Bed availability by location and book/join waitlist
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generalBedAPI } from '../services/api';
import '../styles/ICU.css';

const GeneralBedBooking = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  // State
  const [hospitalsData, setHospitalsData] = useState({});
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    check_in_date: '',
    patient_name: '',
    patient_phone: '',
    notes: ''
  });

  // Waitlist form state
  const [waitlistForm, setWaitlistForm] = useState({
    email: '',
    patient_name: '',
    phone: ''
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
    fetchHospitals();
  }, []);

  // Fetch hospitals when location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchHospitals(selectedLocation);
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await generalBedAPI.getLocations();
      setLocations(response.data.locations || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const fetchHospitals = async (location = '', hospital = '') => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (location) params.location = location;
      if (hospital) params.hospital = hospital;
      if (searchQuery) params.search = searchQuery;

      const response = await generalBedAPI.getAll(params);
      setHospitalsData(response.data.data || {});
    } catch (err) {
      setError('Failed to load General Bed data');
      console.error('Fetch General Bed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHospitals(selectedLocation, searchQuery);
  };

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
    setSearchQuery('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Open booking modal
  const openBookingModal = (hospital) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedHospital(hospital);
    setBookingForm({
      check_in_date: '',
      patient_name: user?.name || '',
      patient_phone: user?.phone || '',
      notes: ''
    });
    setShowBookingModal(true);
    setSuccessMessage('');
  };

  // Open waitlist modal
  const openWaitlistModal = (hospital) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedHospital(hospital);
    setWaitlistForm({
      email: user?.email || '',
      patient_name: user?.name || '',
      phone: user?.phone || ''
    });
    setShowWaitlistModal(true);
    setSuccessMessage('');
  };

  // Handle booking submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.check_in_date || !bookingForm.patient_name || !bookingForm.patient_phone) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitLoading(true);
    setError('');
    try {
      const response = await generalBedAPI.book({
        hospital_id: selectedHospital.hospital_id,
        check_in_date: bookingForm.check_in_date,
        patient_name: bookingForm.patient_name,
        patient_phone: bookingForm.patient_phone,
        notes: bookingForm.notes
      });

      // Store booking confirmation details
      setBookingConfirmation({
        booking_id: response.data.data.booking_id,
        hospital_name: response.data.data.hospital_name,
        location: response.data.data.location,
        check_in_date: response.data.data.check_in_date,
        price_per_day: response.data.data.price_per_day,
        patient_name: bookingForm.patient_name,
        patient_phone: bookingForm.patient_phone
      });

      setShowBookingModal(false);
      setShowSuccessPopup(true);
      fetchHospitals(selectedLocation);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book General Bed');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle waitlist submission
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistForm.email) {
      setError('Please enter your email');
      return;
    }

    setSubmitLoading(true);
    setError('');
    try {
      const response = await generalBedAPI.joinWaitlist({
        hospital_id: selectedHospital.hospital_id,
        email: waitlistForm.email,
        patient_name: waitlistForm.patient_name,
        phone: waitlistForm.phone
      });
      setSuccessMessage(`Added to waitlist at position ${response.data.data.position}`);
      setShowWaitlistModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="icu-container">
      {/* Header */}
      <div className="icu-header">
        <button className="hamburger-menu">☰</button>
        <h1>HealthConnect</h1>
        <div></div>
      </div>

      {/* Navigation */}
      <nav className="icu-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/hospitals">Hospitals</Link></li>
          <li><Link to="/doctors">Doctors</Link></li>
          <li className="nav-dropdown">
            <span className="nav-dropdown-toggle active">
              Booking <span className="dropdown-arrow">▼</span>
            </span>
            <ul className="nav-dropdown-menu">
              <li><Link to="/booking/icu">ICU</Link></li>
              <li><Link to="/booking/general-bed" className="active">General Bed</Link></li>
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

      {/* Page Title */}
      <div className="icu-title-section">
        <h2>General Bed Booking</h2>
        <p>Find and book General Beds across hospitals in Dhaka</p>
      </div>

      {/* Search and Filter Section */}
      <div className="icu-search-section">
        <div className="icu-filters">
          <div className="filter-group">
            <label>Filter by Location</label>
            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Search Hospital</label>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Enter hospital name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn-search">Search</button>
            </form>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-banner">
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="icu-content">
        {loading ? (
          <div className="loading">Loading General Bed data...</div>
        ) : Object.keys(hospitalsData).length === 0 ? (
          <div className="no-results">
            <span>🛏️</span>
            <p>No General Bed data available</p>
          </div>
        ) : (
          Object.entries(hospitalsData).map(([location, hospitals]) => (
            <div key={location} className="location-section">
              <h3 className="location-title">
                <span className="location-icon">📍</span>
                {location}
              </h3>
              <div className="hospitals-grid">
                {hospitals.map((hospital) => (
                  <div key={hospital.bed_id} className="hospital-card">
                    <div className="hospital-card-header">
                      <div className="hospital-icon">🏥</div>
                      <div className="hospital-info">
                        <h4>{hospital.hospital_name}</h4>
                        <p className="hospital-location">{hospital.location}</p>
                      </div>
                    </div>

                    <div className="icu-stats">
                      <div className="stat available">
                        <span className="stat-number">{hospital.available_beds}</span>
                        <span className="stat-label">Available</span>
                      </div>
                      <div className="stat booked">
                        <span className="stat-number">{hospital.booked_beds}</span>
                        <span className="stat-label">Booked</span>
                      </div>
                      <div className="stat total">
                        <span className="stat-number">{hospital.total_beds}</span>
                        <span className="stat-label">Total</span>
                      </div>
                    </div>

                    <div className="hospital-card-footer">
                      <div className="price-info">
                        <span className="price-label">Price/Day:</span>
                        <span className="price-value">৳{hospital.price_per_day}</span>
                      </div>

                      {hospital.available_beds > 0 ? (
                        <button
                          className="btn-book"
                          onClick={() => openBookingModal(hospital)}
                        >
                          Book Bed
                        </button>
                      ) : (
                        <button
                          className="btn-waitlist"
                          onClick={() => openWaitlistModal(hospital)}
                        >
                          Join Waitlist
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedHospital && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book General Bed at {selectedHospital.hospital_name}</h3>
              <button className="modal-close" onClick={() => setShowBookingModal(false)}>×</button>
            </div>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Check-in Date *</label>
                <input
                  type="date"
                  value={bookingForm.check_in_date}
                  onChange={(e) => setBookingForm({...bookingForm, check_in_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  value={bookingForm.patient_name}
                  onChange={(e) => setBookingForm({...bookingForm, patient_name: e.target.value})}
                  placeholder="Enter patient name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={bookingForm.patient_phone}
                  onChange={(e) => setBookingForm({...bookingForm, patient_phone: e.target.value})}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                  placeholder="Any special requirements..."
                  rows="3"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-confirm" disabled={submitLoading}>
                  {submitLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {showWaitlistModal && selectedHospital && (
        <div className="modal-overlay" onClick={() => setShowWaitlistModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Join Waitlist at {selectedHospital.hospital_name}</h3>
              <button className="modal-close" onClick={() => setShowWaitlistModal(false)}>×</button>
            </div>
            <div className="waitlist-info">
              <p>No General Beds are currently available. Join the waitlist and we'll notify you when a bed becomes available.</p>
            </div>
            <form onSubmit={handleWaitlistSubmit}>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={waitlistForm.email}
                  onChange={(e) => setWaitlistForm({...waitlistForm, email: e.target.value})}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Name (Optional)</label>
                <input
                  type="text"
                  value={waitlistForm.patient_name}
                  onChange={(e) => setWaitlistForm({...waitlistForm, patient_name: e.target.value})}
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label>Phone (Optional)</label>
                <input
                  type="tel"
                  value={waitlistForm.phone}
                  onChange={(e) => setWaitlistForm({...waitlistForm, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowWaitlistModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-confirm" disabled={submitLoading}>
                  {submitLoading ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Confirmation Popup */}
      {showSuccessPopup && bookingConfirmation && (
        <div className="modal-overlay" onClick={() => setShowSuccessPopup(false)}>
          <div className="modal-content success-popup" onClick={(e) => e.stopPropagation()}>
            <div className="success-popup-header">
              <div className="success-icon">✓</div>
              <h2>Booking Confirmed!</h2>
            </div>
            <div className="success-popup-body">
              <p className="success-message">Your General Bed has been successfully booked.</p>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">Booking ID:</span>
                  <span className="detail-value">{bookingConfirmation.booking_id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Hospital:</span>
                  <span className="detail-value">{bookingConfirmation.hospital_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{bookingConfirmation.location}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Check-in Date:</span>
                  <span className="detail-value">
                    {new Date(bookingConfirmation.check_in_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Price/Day:</span>
                  <span className="detail-value">৳{bookingConfirmation.price_per_day}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Patient:</span>
                  <span className="detail-value">{bookingConfirmation.patient_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{bookingConfirmation.patient_phone}</span>
                </div>
              </div>

              <p className="email-notice">A confirmation email has been sent to your registered email address.</p>
            </div>
            <div className="success-popup-footer">
              <button className="btn-confirm" onClick={() => setShowSuccessPopup(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralBedBooking;
