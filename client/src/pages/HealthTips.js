import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

const HealthTips = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: ''
    });

    useEffect(() => {
        fetchTips();
    }, []);

    const fetchTips = async () => {
        try {
            const response = await axios.get('http://localhost:9358/api/health-tips');
            setTips(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching health tips:', err);
            setError('Failed to load health tips.');
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
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            await axios.post('http://localhost:9358/api/health-tips', formData, config);

            // Reset form and reload list
            setFormData({
                title: '',
                content: '',
                category: ''
            });
            setShowForm(false);
            fetchTips();
            alert('Health tip posted successfully!');
        } catch (err) {
            console.error('Error creating tip:', err);
            setError(err.response?.data?.message || 'Failed to create tip');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this tip?')) return;

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            await axios.delete(`http://localhost:9358/api/health-tips/${id}`, config);
            fetchTips(); // Reload list
        } catch (err) {
            console.error('Error deleting tip:', err);
            alert('Failed to delete tip. You might not be authorized.');
        }
    };

    const isDoctor = user && (user.role === 'doctor' || user.role === 'Doctor');

    return (
        <div className="auth-container">
            {/* Header */}
            <div className="auth-header">
                <button className="hamburger-menu">☰</button>
                <h1>HealthConnect - Health Tips</h1>
                <div></div>
            </div>

            {/* Navigation */}
            <nav className="auth-nav">
                <div className="nav-logo">
                    <span>💡</span>
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
                    <h2 style={{ color: '#2B2B2B', margin: 0 }}>Health Tips & Advice</h2>
                    {isDoctor && (
                        <button
                            className="btn-dark"
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? 'Cancel Post' : 'Post New Tip'}
                        </button>
                    )}
                </div>

                {error && <div className="error-message" style={{ width: '100%' }}>{error}</div>}

                {/* Request Form - Only for Doctors */}
                {showForm && isDoctor && (
                    <div className="auth-card" style={{ marginBottom: '30px', maxWidth: '800px', margin: '0 auto' }}>
                        <h3>Share Health Advice</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g., Benefits of Hydration" />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <input type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g., Nutrition, Lifestyle" />
                            </div>
                            <div className="form-group">
                                <label>Content</label>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    required
                                    rows="6"
                                    style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #E0E0E0', resize: 'vertical' }}
                                    placeholder="Write your health tip here..."
                                />
                            </div>
                            <button type="submit" className="btn-submit btn-submit-dark">Post Tip</button>
                        </form>
                    </div>
                )}

                {/* Tips List */}
                {loading ? (
                    <p>Loading tips...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', width: '100%' }}>
                        {tips.map(tip => (
                            <div key={tip._id} className="auth-card" style={{ padding: '30px', maxWidth: 'none', margin: 0, borderLeft: '5px solid #8BC9A8' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div>
                                        <h3 style={{ margin: '0', fontSize: '22px', color: '#2B2B2B' }}>{tip.title}</h3>
                                        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                                            By Dr. {tip.author?.name || 'Unknown'} • {new Date(tip.createdAt).toLocaleDateString()}
                                            {tip.category && <span style={{ marginLeft: '10px', background: '#e0f2f1', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{tip.category}</span>}
                                        </div>
                                    </div>

                                    {user && (tip.author?._id === user.id || user.role === 'admin') && (
                                        <button
                                            onClick={() => handleDelete(tip._id)}
                                            style={{
                                                color: '#ff5252',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '20px'
                                            }}
                                            title="Delete Tip"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>

                                <p style={{ lineHeight: '1.6', fontSize: '16px', color: '#333', whiteSpace: 'pre-wrap' }}>{tip.content}</p>
                            </div>
                        ))}
                        {tips.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px' }}>
                                <p>No health tips yet. Check back later!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthTips;
