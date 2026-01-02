/**
 * Manage Schedule Page
 * Updated: Now includes Navigation and is CENTER ALIGNED
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const ManageSchedule = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState([]);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Default empty schedule
  const defaultSchedule = [
    { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Saturday', startTime: '10:00', endTime: '14:00', isAvailable: false },
    { day: 'Sunday', startTime: '00:00', endTime: '00:00', isAvailable: false },
  ];

  useEffect(() => {
    loadMyProfile();
    // eslint-disable-next-line
  }, []);

  const loadMyProfile = async () => {
    try {
      const { data } = await doctorAPI.getMyProfile();
      if (data.availability && data.availability.length > 0) {
        setSchedule(data.availability);
      } else {
        setSchedule(defaultSchedule);
      }
      if (data.slotDuration) setDuration(data.slotDuration);
    } catch (error) {
      console.error('Error loading profile:', error);
      setSchedule(defaultSchedule);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await doctorAPI.updateAvailability({
        slotDuration: duration,
        availability: schedule
      });
      setMessage('Schedule updated successfully!');
    } catch (error) {
      setMessage('Failed to update schedule.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="auth-container">Loading...</div>;

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
          <li><Link to="/appointments">Appointments</Link></li>
        </ul>
        <div className="nav-buttons">
          <Link to="/dashboard">
            <button className="btn-submit" style={{ marginRight: '10px' }}>Dashboard</button>
          </Link>
          <button className="btn-dark" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content - CENTERED */}
      <div className="auth-content" style={{ display: 'flex', justifyContent: 'center', paddingBottom: '50px' }}>
        <div className="auth-card" style={{ width: '100%', maxWidth: '800px' }}>
          <h2>Manage My Availability</h2>
          
          <p style={{marginBottom: '20px', color: '#666'}}>
            Set your weekly recurring schedule here. This will be visible to patients when booking appointments.
          </p>

          {message && <div className="success-message">{message}</div>}
          
          <div className="form-group">
            <label>Appointment Duration (minutes)</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value="15">15 mins</option>
              <option value="30">30 mins</option>
              <option value="45">45 mins</option>
              <option value="60">1 hour</option>
            </select>
          </div>

          <div className="schedule-grid">
            {schedule.map((day, index) => (
              <div key={day.day} style={{ 
                display: 'grid', 
                gridTemplateColumns: '100px 50px 1fr', 
                gap: '10px', 
                alignItems: 'center', 
                marginBottom: '15px',
                borderBottom: '1px solid #eee',
                paddingBottom: '10px'
              }}>
                <div style={{ fontWeight: 'bold' }}>{day.day}</div>
                
                <input 
                  type="checkbox" 
                  checked={day.isAvailable} 
                  onChange={(e) => handleChange(index, 'isAvailable', e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />

                {day.isAvailable ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="time" 
                      value={day.startTime} 
                      onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                      className="form-control"
                    />
                    <span>to</span>
                    <input 
                      type="time" 
                      value={day.endTime} 
                      onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                      className="form-control"
                    />
                  </div>
                ) : (
                  <span style={{color: '#888'}}>Off Day</span>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSave} className="btn-submit btn-submit-dark" style={{ marginTop: '20px' }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageSchedule;