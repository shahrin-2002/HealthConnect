import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

const BloodDonation = () => {
    const { user, isAuthenticated } = useAuth(); // Assuming AuthContext provides this
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        patientName: '',
        disease: '',
        bloodType: '',
        dateNeeded: '',
        contactNumber: '',
        additionalInfo: ''
    });

    // Helper to get token (if stored in localStorage/Context)
    // Assuming axios interceptor handles it or we manually get it.
    // Checking AuthContext.js will help, but for now I'll assume localStorage 'token' or context.
    // I'll add a header manually if needed.

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('http://localhost:9358/api/blood-requests');
            setRequests(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching blood requests:', err);
            setError('Failed to load blood requests.');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const token = localStorage.getItem('token'); // Common pattern
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            await axios.post('http://localhost:9358/api/blood-requests', formData, config);

            // Reset form and reload list
            setFormData({
                patientName: '',
                disease: '',
                bloodType: '',
                dateNeeded: '',
                contactNumber: '',
                additionalInfo: ''
            });
            setShowForm(false);
            fetchRequests();
            alert('Blood request posted successfully!');
        } catch (err) {
            console.error('Error creating request:', err);
            setError(err.response?.data?.message || 'Failed to create request');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            await axios.delete(`http://localhost:9358/api/blood-requests/${id}`, config);
            fetchRequests(); // Reload list
        } catch (err) {
            console.error('Error deleting request:', err);
            alert('Failed to delete request. You might not be authorized.');
        }
    };

    return (
        <div className="auth-container">
            {/* Header */}
            <div className="auth-header">
                <button className="hamburger-menu">☰</button>
                <h1>HealthConnect - Blood Donation</h1>
                <div></div>
            </div>

            {/* Navigation */}
            <nav className="auth-nav">
                <div className="nav-logo">
                    <span>🩸</span>
                </div>
                <div className="nav-buttons">
                    <Link to="/dashboard">
                        <button className="btn-outline">Dashboard</button>
                    </Link>
                    {!user && (
                        <Link to="/login">
                            <button className="btn-dark">Login</button>
                        </Link>
                    )}
                </div>
            </nav>

            <div className="auth-content" style={{ flexDirection: 'column', alignItems: 'flex-start', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '20px', alignItems: 'center' }}>
                    <h2 style={{ color: '#2B2B2B', margin: 0 }}>Active Blood Requests</h2>
                    <button
                        className="btn-dark"
                        onClick={() => {
                            if (!user) {
                                navigate('/login');
                            } else {
                                setShowForm(!showForm);
                            }
                        }}
                    >
                        {showForm ? 'Cancel Request' : 'Request Blood'}
                    </button>
                </div>

                {error && <div className="error-message" style={{ width: '100%' }}>{error}</div>}

                {/* Request Form */}
                {showForm && (
                    <div className="auth-card" style={{ marginBottom: '30px', maxWidth: '800px', margin: '0 auto' }}>
                        <h3>Create New Blood Request</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Patient Name</label>
                                <input type="text" name="patientName" value={formData.patientName} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group" style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>Disease/Reason</label>
                                    <input type="text" name="disease" value={formData.disease} onChange={handleInputChange} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>Blood Type</label>
                                    <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #E0E0E0' }}>
                                        <option value="">Select Type</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>Date Needed</label>
                                    <input type="date" name="dateNeeded" value={formData.dateNeeded} onChange={handleInputChange} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>Contact Number</label>
                                    <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Additional Info</label>
                                <input type="text" name="additionalInfo" value={formData.additionalInfo} onChange={handleInputChange} />
                            </div>
                            <button type="submit" className="btn-submit btn-submit-dark">Post Request</button>
                        </form>
                    </div>
                )}

                {/* Requests List */}
                {loading ? (
                    <p>Loading requests...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', width: '100%' }}>
                        {requests.map(request => (
                            <div key={request._id} className="auth-card" style={{ padding: '20px', maxWidth: 'none', margin: 0, borderTop: `5px solid ${getRequestColor(request.bloodType)}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{request.bloodType}</h3>
                                    <span style={{ fontSize: '12px', color: '#666' }}>{new Date(request.createdAt).toLocaleDateString()}</span>
                                </div>

                                <p><strong>Patient:</strong> {request.patientName}</p>
                                <p><strong>Disease:</strong> {request.disease}</p>
                                <p><strong>Needed By:</strong> {new Date(request.dateNeeded).toLocaleDateString()}</p>
                                <p><strong>Phone:</strong> {request.contactNumber}</p>
                                {request.additionalInfo && <p><strong>Info:</strong> {request.additionalInfo}</p>}

                                {user && request.creator === user.id && ( // Assuming user.id is available from AuthContext
                                    <button
                                        onClick={() => handleDelete(request._id)}
                                        style={{
                                            backgroundColor: '#ff5252',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 15px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            marginTop: '10px'
                                        }}
                                    >
                                        Delete Post
                                    </button>
                                )}
                            </div>
                        ))}
                        {requests.length === 0 && <p>No active blood requests found.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper for color coding cards
const getRequestColor = (type) => {
    return '#ff5252'; // Red for all for now
};

export default BloodDonation;
