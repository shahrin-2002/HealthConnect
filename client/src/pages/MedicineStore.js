import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/MedicineStore.css';

const MedicineStore = () => {
    const { user } = useAuth();
    const [medicines, setMedicines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [cart, setCart] = useState([]);
    const [showCheckout, setShowCheckout] = useState(false);
    const [orderForm, setOrderForm] = useState({
        shippingAddress: '',
        phoneNumber: user?.phone || ''
    });
    const [success, setSuccess] = useState(false);
    const [myOrders, setMyOrders] = useState([]);

    useEffect(() => {
        fetchMedicines();
        fetchCategories();
        fetchMyOrders();
    }, [category, search]);

    const fetchMedicines = async () => {
        try {
            const res = await axios.get(`http://localhost:9358/api/medicines?category=${category}&search=${search}`);
            setMedicines(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching medicines:', err);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:9358/api/medicines/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchMyOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:9358/api/medicine-orders/mine', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyOrders(res.data);
        } catch (err) {
            console.error('Error fetching my orders:', err);
        }
    };

    const addToCart = (med) => {
        const existing = cart.find(item => item.medicine === med._id);
        if (existing) {
            setCart(cart.map(item =>
                item.medicine === med._id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, {
                medicine: med._id,
                name: med.name,
                price: med.price,
                quantity: 1
            }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.medicine !== id));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:9358/api/medicine-orders', {
                items: cart,
                shippingAddress: orderForm.shippingAddress,
                phoneNumber: orderForm.phoneNumber,
                totalAmount
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCart([]);
            setShowCheckout(false);
            setSuccess(true);
            fetchMyOrders();
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            alert('Failed to place order');
        }
    };

    return (
        <div className="medicine-store-container">
            <div className="store-header">
                <div>
                    <h1>Medicine Store</h1>
                    <p>Order medicines for home delivery (Cash on Delivery)</p>
                </div>
                {success && <div className="status-badge status-delivered">Order placed successfully!</div>}
            </div>

            <div className="search-filter-section">
                <input
                    type="text"
                    placeholder="Search medicines..."
                    className="medicine-search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="category-filter"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div>Loading medicines...</div>
            ) : (
                <div className="medicines-grid">
                    {medicines.map(med => (
                        <div key={med._id} className="medicine-card">
                            <div className="medicine-image-placeholder">💊</div>
                            <div className="medicine-info">
                                <div className="medicine-category">{med.category}</div>
                                <div className="medicine-name">{med.name}</div>
                                <div className="medicine-description">{med.description}</div>
                                <div className="medicine-price-row">
                                    <div className="medicine-price">৳{med.price}</div>
                                    <button
                                        className="add-to-cart-btn"
                                        onClick={() => addToCart(med)}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '50px' }}>
                <h2>My Orders</h2>
                <div className="admin-orders-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myOrders.map(order => (
                                <tr key={order._id}>
                                    <td>#{order._id.slice(-6)}</td>
                                    <td>{order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
                                    <td>৳{order.totalAmount}</td>
                                    <td>
                                        <span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {cart.length > 0 && (
                <div className="cart-floating-btn" onClick={() => setShowCheckout(true)}>
                    🛒
                    <div className="cart-count">{cart.length}</div>
                </div>
            )}

            {showCheckout && (
                <div className="checkout-modal">
                    <div className="checkout-card">
                        <h2>Checkout Summary</h2>
                        <div style={{ margin: '20px 0' }}>
                            {cart.map(item => (
                                <div key={item.medicine} className="cart-item">
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>৳{item.price * item.quantity}</span>
                                    <button onClick={() => removeFromCart(item.medicine)} style={{ color: 'red', border: 'none', background: 'none' }}>Remove</button>
                                </div>
                            ))}
                            <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '20px', fontWeight: '800' }}>
                                Total: ৳{totalAmount}
                            </div>
                        </div>

                        <form className="order-form" onSubmit={handlePlaceOrder}>
                            <label>Delivery Address</label>
                            <textarea
                                required
                                value={orderForm.shippingAddress}
                                onChange={(e) => setOrderForm({ ...orderForm, shippingAddress: e.target.value })}
                                placeholder="House no, Street, Area..."
                            />

                            <label>Phone Number</label>
                            <input
                                type="text"
                                required
                                value={orderForm.phoneNumber}
                                onChange={(e) => setOrderForm({ ...orderForm, phoneNumber: e.target.value })}
                                placeholder="Phone number for delivery"
                            />

                            <div className="checkout-actions">
                                <button type="submit" className="btn-submit" style={{ flex: 1, backgroundColor: '#27ae60' }}>
                                    Confirm Order (COD)
                                </button>
                                <button
                                    type="button"
                                    className="btn-submit"
                                    style={{ flex: 1, backgroundColor: '#eee', color: '#333' }}
                                    onClick={() => setShowCheckout(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicineStore;
