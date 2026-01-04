import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/MedicineStore.css';

const MedicineAdmin = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllOrders();
    }, []);

    const fetchAllOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:9358/api/medicine-orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching all orders:', err);
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:9358/api/medicine-orders/${orderId}/status`, {
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAllOrders();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="medicine-store-container">
            <div className="store-header">
                <div>
                    <h1>Medicine Inventory & Orders</h1>
                    <p>Manage patient medicine orders and delivery status</p>
                </div>
            </div>

            {loading ? (
                <div>Loading orders...</div>
            ) : (
                <div className="admin-orders-table" style={{ marginTop: '20px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Patient</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Address & Contact</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id}>
                                    <td>#{order._id.slice(-6)}</td>
                                    <td>
                                        <strong>{order.user?.name}</strong><br />
                                        <small>{order.user?.email}</small>
                                    </td>
                                    <td>
                                        {order.items.map(i => (
                                            <div key={i.medicine} style={{ fontSize: '13px' }}>
                                                • {i.name} (x{i.quantity})
                                            </div>
                                        ))}
                                    </td>
                                    <td>৳{order.totalAmount}</td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>
                                            📍 {order.shippingAddress}<br />
                                            📞 {order.phoneNumber}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            className="status-badge"
                                            value={order.status}
                                            onChange={(e) => updateStatus(order._id, e.target.value)}
                                            style={{ backgroundColor: 'white', border: '1px solid #ccc', cursor: 'pointer' }}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Out for Delivery">Out for Delivery</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MedicineAdmin;
