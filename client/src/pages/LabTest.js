import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/LabTest.css';

const LabTest = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State for tests catalog
    const [tests, setTests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Cart and booking states
    const [cart, setCart] = useState([]);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [collectionMethod, setCollectionMethod] = useState('hospital');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Bookings state
    const [myBookings, setMyBookings] = useState([]);
    const [showBookings, setShowBookings] = useState(false);

    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch tests and categories
    useEffect(() => {
        fetchTests();
        fetchCategories();
        if (user) {
            fetchMyBookings();
        }
    }, [user]);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory) params.append('category', selectedCategory);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);

            const response = await api.get(`/lab-tests?${params.toString()}`);
            setTests(response.data.tests || []);
        } catch (error) {
            console.error('Error fetching tests:', error);
            setMessage({ type: 'error', text: 'Failed to load tests' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/lab-tests/categories');
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchMyBookings = async () => {
        try {
            const response = await api.get('/test-bookings/my-bookings');
            setMyBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const handleSearch = () => {
        fetchTests();
    };

    const addToCart = (test) => {
        if (!cart.find(item => item._id === test._id)) {
            setCart([...cart, test]);
            setMessage({ type: 'success', text: `${test.name} added to cart` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const removeFromCart = (testId) => {
        setCart(cart.filter(item => item._id !== testId));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, test) => sum + test.price, 0);
    };

    const handleBooking = async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            setMessage({ type: 'error', text: 'Please add tests to cart' });
            return;
        }

        if (!user) {
            setMessage({ type: 'error', text: 'Please login to book tests' });
            navigate('/login');
            return;
        }

        if (collectionMethod === 'home' && (!phone || !address)) {
            setMessage({ type: 'error', text: 'Phone and address required for home collection' });
            return;
        }

        try {
            const bookingData = {
                tests: cart.map(test => ({ testId: test._id })),
                collectionMethod,
                scheduledDate,
                scheduledTime,
                homeCollectionDetails: collectionMethod === 'home' ? { phone, address } : undefined
            };

            await api.post('/test-bookings', bookingData);

            setMessage({ type: 'success', text: 'Booking created successfully!' });
            setCart([]);
            setShowBookingForm(false);
            setCollectionMethod('hospital');
            setScheduledDate('');
            setScheduledTime('');
            setPhone('');
            setAddress('');
            fetchMyBookings();
        } catch (error) {
            console.error('Error creating booking:', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Booking failed' });
        }
    };

    const downloadReport = async (bookingId) => {
        try {
            const response = await api.get(`/test-bookings/${bookingId}/report`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `test-report-${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading report:', error);
            setMessage({ type: 'error', text: 'Failed to download report' });
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'booked': return 'status-booked';
            case 'sample_collected': return 'status-collected';
            case 'in_progress': return 'status-progress';
            case 'completed': return 'status-completed';
            default: return '';
        }
    };

    const formatStatus = (status) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="lab-test-container">
            <div className="lab-test-header">
                <h1>Lab Test Services</h1>
                <button className="btn-my-bookings" onClick={() => setShowBookings(!showBookings)}>
                    {showBookings ? 'Browse Tests' : 'My Bookings'}
                </button>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {!showBookings ? (
                <>
                    {/* Search and Filters */}
                    <div className="filters-section">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search tests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button onClick={handleSearch}>Search</button>
                        </div>

                        <div className="filters">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <input
                                type="number"
                                placeholder="Min Price"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                            />

                            <input
                                type="number"
                                placeholder="Max Price"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />

                            <button onClick={handleSearch} className="btn-apply-filters">Apply Filters</button>
                        </div>
                    </div>

                    {/* Cart Section */}
                    {cart.length > 0 && (
                        <div className="cart-section">
                            <h2>Selected Tests ({cart.length})</h2>
                            <div className="cart-items">
                                {cart.map(test => (
                                    <div key={test._id} className="cart-item">
                                        <span>{test.name}</span>
                                        <span>৳{test.price}</span>
                                        <button onClick={() => removeFromCart(test._id)}>Remove</button>
                                    </div>
                                ))}
                            </div>
                            <div className="cart-total">
                                <strong>Total: ৳{calculateTotal()}</strong>
                            </div>
                            <button
                                className="btn-proceed-booking"
                                onClick={() => setShowBookingForm(true)}
                            >
                                Proceed to Book
                            </button>
                        </div>
                    )}

                    {/* Booking Form Modal */}
                    {showBookingForm && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Complete Your Booking</h2>
                                <form onSubmit={handleBooking}>
                                    <div className="form-group">
                                        <label>Collection Method:</label>
                                        <div className="radio-group">
                                            <label>
                                                <input
                                                    type="radio"
                                                    value="hospital"
                                                    checked={collectionMethod === 'hospital'}
                                                    onChange={(e) => setCollectionMethod(e.target.value)}
                                                />
                                                Visit Hospital
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    value="home"
                                                    checked={collectionMethod === 'home'}
                                                    onChange={(e) => setCollectionMethod(e.target.value)}
                                                />
                                                Home Collection
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Preferred Date:</label>
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Preferred Time:</label>
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {collectionMethod === 'home' && (
                                        <>
                                            <div className="form-group">
                                                <label>Phone Number:</label>
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="+880 1234567890"
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Complete Address:</label>
                                                <textarea
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="House/Flat, Road, Area, City"
                                                    rows="3"
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="booking-summary">
                                        <h3>Booking Summary</h3>
                                        {cart.map(test => (
                                            <div key={test._id} className="summary-item">
                                                <span>{test.name}</span>
                                                <span>৳{test.price}</span>
                                            </div>
                                        ))}
                                        <div className="summary-total">
                                            <strong>Total Amount: ৳{calculateTotal()}</strong>
                                        </div>
                                    </div>

                                    <div className="modal-actions">
                                        <button type="submit" className="btn-confirm">Confirm Booking</button>
                                        <button type="button" onClick={() => setShowBookingForm(false)} className="btn-cancel">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Tests Catalog */}
                    <div className="tests-catalog">
                        <h2>Available Tests</h2>
                        {loading ? (
                            <p>Loading tests...</p>
                        ) : tests.length === 0 ? (
                            <p>No tests found</p>
                        ) : (
                            <div className="test-grid">
                                {tests.map(test => (
                                    <div key={test._id} className="test-card">
                                        <div className="test-category">{test.category}</div>
                                        <h3>{test.name}</h3>
                                        <p className="test-description">{test.description}</p>
                                        <div className="test-details">
                                            <span className="test-price">৳{test.price}</span>
                                            <span className="test-time">{test.turnaroundTime}</span>
                                        </div>
                                        <button
                                            className="btn-add-cart"
                                            onClick={() => addToCart(test)}
                                            disabled={cart.find(item => item._id === test._id)}
                                        >
                                            {cart.find(item => item._id === test._id) ? 'Added to Cart' : 'Add to Cart'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* My Bookings Section */
                <div className="my-bookings-section">
                    <h2>My Test Bookings</h2>
                    {myBookings.length === 0 ? (
                        <p>No bookings found</p>
                    ) : (
                        <div className="bookings-list">
                            {myBookings.map(booking => (
                                <div key={booking._id} className="booking-card">
                                    <div className="booking-header">
                                        <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                                            {formatStatus(booking.status)}
                                        </span>
                                        <span className="booking-date">
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="booking-tests">
                                        <strong>Tests:</strong>
                                        <ul>
                                            {booking.tests.map((test, idx) => (
                                                <li key={idx}>{test.testName} - ৳{test.price}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="booking-details">
                                        <p><strong>Total Amount:</strong> ৳{booking.totalAmount}</p>
                                        <p><strong>Collection:</strong> {booking.collectionMethod === 'home' ? 'Home Collection' : 'Hospital Visit'}</p>
                                        <p><strong>Scheduled:</strong> {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}</p>
                                        {booking.collectionMethod === 'home' && booking.homeCollectionDetails && (
                                            <>
                                                <p><strong>Phone:</strong> {booking.homeCollectionDetails.phone}</p>
                                                <p><strong>Address:</strong> {booking.homeCollectionDetails.address}</p>
                                            </>
                                        )}
                                    </div>

                                    {booking.reportUrl && (
                                        <button
                                            className="btn-download-report"
                                            onClick={() => downloadReport(booking._id)}
                                        >
                                            Download Report
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LabTest;
