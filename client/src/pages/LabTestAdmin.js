import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/LabTest.css';

const LabTestAdmin = () => {
    const [activeTab, setActiveTab] = useState('tests');

    // Test Management State
    const [tests, setTests] = useState([]);
    const [showTestForm, setShowTestForm] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [testForm, setTestForm] = useState({
        name: '',
        description: '',
        price: '',
        turnaroundTime: '24 hours',
        category: 'Blood'
    });

    // Booking Management State
    const [bookings, setBookings] = useState([]);
    const [bookingFilters, setBookingFilters] = useState({
        status: '',
        collectionMethod: '',
        startDate: '',
        endDate: ''
    });

    // Home Collection State
    const [homeCollections, setHomeCollections] = useState([]);

    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'tests') {
            fetchTests();
        } else if (activeTab === 'bookings') {
            fetchBookings();
        } else if (activeTab === 'home-collections') {
            fetchHomeCollections();
        }
    }, [activeTab]);

    const fetchTests = async () => {
        try {
            const response = await api.get('/lab-tests?active=false');
            setTests(response.data.tests || []);
        } catch (error) {
            console.error('Error fetching tests:', error);
        }
    };

    const fetchBookings = async () => {
        try {
            const params = new URLSearchParams(bookingFilters);
            const response = await api.get(`/test-bookings?${params.toString()}`);
            setBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const fetchHomeCollections = async () => {
        try {
            const response = await api.get('/test-bookings/admin/home-collections');
            setHomeCollections(response.data.collections || []);
        } catch (error) {
            console.error('Error fetching home collections:', error);
        }
    };

    const handleTestSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingTest) {
                await api.put(`/lab-tests/${editingTest._id}`, testForm);
                setMessage({ type: 'success', text: 'Test updated successfully' });
            } else {
                await api.post('/lab-tests', testForm);
                setMessage({ type: 'success', text: 'Test created successfully' });
            }

            setShowTestForm(false);
            setEditingTest(null);
            setTestForm({
                name: '',
                description: '',
                price: '',
                turnaroundTime: '24 hours',
                category: 'Blood'
            });
            fetchTests();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Operation failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleEditTest = (test) => {
        setEditingTest(test);
        setTestForm({
            name: test.name,
            description: test.description,
            price: test.price,
            turnaroundTime: test.turnaroundTime,
            category: test.category
        });
        setShowTestForm(true);
    };

    const handleDeleteTest = async (testId) => {
        if (!window.confirm('Are you sure you want to deactivate this test?')) return;

        try {
            await api.delete(`/lab-tests/${testId}`);
            setMessage({ type: 'success', text: 'Test deactivated successfully' });
            fetchTests();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to deactivate test' });
        }
    };

    const handleToggleActive = async (test) => {
        try {
            await api.put(`/lab-tests/${test._id}`, { isActive: !test.isActive });
            setMessage({ type: 'success', text: `Test ${test.isActive ? 'deactivated' : 'activated'}` });
            fetchTests();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update test status' });
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            await api.patch(`/test-bookings/${bookingId}/status`, { status: newStatus });
            setMessage({ type: 'success', text: 'Status updated successfully' });
            fetchBookings();
            if (activeTab === 'home-collections') {
                fetchHomeCollections();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update status' });
        }
    };

    const handleReportUpload = async (bookingId, file) => {
        if (!file || file.type !== 'application/pdf') {
            setMessage({ type: 'error', text: 'Please select a PDF file' });
            return;
        }

        const formData = new FormData();
        formData.append('report', file);

        try {
            await api.post(`/test-bookings/${bookingId}/report`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Report uploaded successfully' });
            fetchBookings();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload report' });
        }
    };

    const formatStatus = (status) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="lab-test-admin">
            <h1>Lab Test Administration</h1>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                    <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
                </div>
            )}

            <div className="admin-tabs">
                <button
                    className={activeTab === 'tests' ? 'active' : ''}
                    onClick={() => setActiveTab('tests')}
                >
                    Test Management
                </button>
                <button
                    className={activeTab === 'bookings' ? 'active' : ''}
                    onClick={() => setActiveTab('bookings')}
                >
                    Bookings
                </button>
                <button
                    className={activeTab === 'home-collections' ? 'active' : ''}
                    onClick={() => setActiveTab('home-collections')}
                >
                    Home Collections
                </button>
            </div>

            {/* Test Management Tab */}
            {activeTab === 'tests' && (
                <div className="admin-content">
                    <div className="content-header">
                        <h2>Manage Tests</h2>
                        <button className="btn-add" onClick={() => {
                            setShowTestForm(true);
                            setEditingTest(null);
                            setTestForm({
                                name: '',
                                description: '',
                                price: '',
                                turnaroundTime: '24 hours',
                                category: 'Blood'
                            });
                        }}>
                            + Add New Test
                        </button>
                    </div>

                    {showTestForm && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>{editingTest ? 'Edit Test' : 'Add New Test'}</h3>
                                <form onSubmit={handleTestSubmit}>
                                    <div className="form-group">
                                        <label>Test Name:</label>
                                        <input
                                            type="text"
                                            value={testForm.name}
                                            onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Description:</label>
                                        <textarea
                                            value={testForm.description}
                                            onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                                            rows="3"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Price (৳):</label>
                                        <input
                                            type="number"
                                            value={testForm.price}
                                            onChange={(e) => setTestForm({ ...testForm, price: e.target.value })}
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Turnaround Time:</label>
                                        <input
                                            type="text"
                                            value={testForm.turnaroundTime}
                                            onChange={(e) => setTestForm({ ...testForm, turnaroundTime: e.target.value })}
                                            placeholder="e.g., 24 hours, 2 days"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Category:</label>
                                        <select
                                            value={testForm.category}
                                            onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                                            required
                                        >
                                            <option value="Blood">Blood</option>
                                            <option value="Urine">Urine</option>
                                            <option value="Radiology">Radiology</option>
                                            <option value="Pathology">Pathology</option>
                                            <option value="Microbiology">Microbiology</option>
                                            <option value="Biochemistry">Biochemistry</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="modal-actions">
                                        <button type="submit" className="btn-confirm" disabled={loading}>
                                            {loading ? 'Saving...' : (editingTest ? 'Update' : 'Create')}
                                        </button>
                                        <button type="button" onClick={() => setShowTestForm(false)} className="btn-cancel">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Turnaround</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tests.map(test => (
                                <tr key={test._id}>
                                    <td>{test.name}</td>
                                    <td>{test.category}</td>
                                    <td>৳{test.price}</td>
                                    <td>{test.turnaroundTime}</td>
                                    <td>
                                        <span className={test.isActive ? 'badge-active' : 'badge-inactive'}>
                                            {test.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="action-buttons">
                                        <button onClick={() => handleEditTest(test)} className="btn-edit">Edit</button>
                                        <button
                                            onClick={() => handleToggleActive(test)}
                                            className={test.isActive ? 'btn-deactivate' : 'btn-activate'}
                                        >
                                            {test.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="admin-content">
                    <h2>Manage Bookings</h2>

                    <div className="filters-section">
                        <select
                            value={bookingFilters.status}
                            onChange={(e) => setBookingFilters({ ...bookingFilters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="booked">Booked</option>
                            <option value="sample_collected">Sample Collected</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>

                        <select
                            value={bookingFilters.collectionMethod}
                            onChange={(e) => setBookingFilters({ ...bookingFilters, collectionMethod: e.target.value })}
                        >
                            <option value="">All Methods</option>
                            <option value="hospital">Hospital</option>
                            <option value="home">Home</option>
                        </select>

                        <button onClick={fetchBookings} className="btn-apply-filters">Apply Filters</button>
                    </div>

                    <div className="bookings-grid">
                        {bookings.map(booking => (
                            <div key={booking._id} className="booking-admin-card">
                                <div className="booking-info">
                                    <h3>Patient: {booking.patientId?.name || 'N/A'}</h3>
                                    <p>Email: {booking.patientId?.email}</p>
                                    <p>Booking Date: {new Date(booking.createdAt).toLocaleDateString()}</p>
                                    <p>Scheduled: {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}</p>
                                    <p>Method: {booking.collectionMethod === 'home' ? 'Home Collection' : 'Hospital Visit'}</p>

                                    {booking.collectionMethod === 'home' && booking.homeCollectionDetails && (
                                        <div className="home-details">
                                            <p><strong>Phone:</strong> {booking.homeCollectionDetails.phone}</p>
                                            <p><strong>Address:</strong> {booking.homeCollectionDetails.address}</p>
                                        </div>
                                    )}

                                    <div className="tests-list">
                                        <strong>Tests:</strong>
                                        <ul>
                                            {booking.tests.map((test, idx) => (
                                                <li key={idx}>{test.testName} - ৳{test.price}</li>
                                            ))}
                                        </ul>
                                        <p><strong>Total: ৳{booking.totalAmount}</strong></p>
                                    </div>
                                </div>

                                <div className="booking-actions">
                                    <div className="form-group">
                                        <label>Status:</label>
                                        <select
                                            value={booking.status}
                                            onChange={(e) => handleStatusUpdate(booking._id, e.target.value)}
                                        >
                                            <option value="booked">Booked</option>
                                            <option value="sample_collected">Sample Collected</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Upload Report (PDF):</label>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => handleReportUpload(booking._id, e.target.files[0])}
                                        />
                                    </div>

                                    {booking.reportUrl && (
                                        <p className="report-status">✓ Report uploaded</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Home Collections Tab */}
            {activeTab === 'home-collections' && (
                <div className="admin-content">
                    <h2>Home Collection Requests</h2>

                    <div className="collections-list">
                        {homeCollections.map(collection => (
                            <div key={collection._id} className="collection-card">
                                <div className="collection-header">
                                    <h3>{collection.patientId?.name || 'N/A'}</h3>
                                    <span className={`status-badge status-${collection.status}`}>
                                        {formatStatus(collection.status)}
                                    </span>
                                </div>

                                <div className="collection-details">
                                    <p><strong>Phone:</strong> {collection.homeCollectionDetails?.phone}</p>
                                    <p><strong>Address:</strong> {collection.homeCollectionDetails?.address}</p>
                                    <p><strong>Scheduled:</strong> {new Date(collection.scheduledDate).toLocaleDateString()} at {collection.scheduledTime}</p>

                                    <div className="tests-summary">
                                        <strong>Tests ({collection.tests.length}):</strong>
                                        <ul>
                                            {collection.tests.map((test, idx) => (
                                                <li key={idx}>{test.testName}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="collection-actions">
                                    <select
                                        value={collection.status}
                                        onChange={(e) => handleStatusUpdate(collection._id, e.target.value)}
                                    >
                                        <option value="booked">Pending</option>
                                        <option value="sample_collected">Collected</option>
                                        <option value="in_progress">Processing</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTestAdmin;
