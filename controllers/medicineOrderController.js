const MedicineOrder = require('../models/MedicineOrder');
const Medicine = require('../models/Medicine');

// Place a new order
exports.placeOrder = async (req, res) => {
    try {
        const { items, shippingAddress, phoneNumber, totalAmount } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        const order = new MedicineOrder({
            user: req.user.id,
            items,
            totalAmount,
            shippingAddress,
            phoneNumber,
            status: 'Pending'
        });

        await order.save();

        // Update stock levels
        for (const item of items) {
            await Medicine.findByIdAndUpdate(item.medicine, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json({ message: 'Order placed successfully', order });
    } catch (error) {
        res.status(400).json({ message: 'Error placing order', error: error.message });
    }
};

// Get logged-in user's orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await MedicineOrder.find({ user: req.user.id })
            .sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// Admin: Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await MedicineOrder.find()
            .populate('user', 'name email')
            .sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// Admin: Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await MedicineOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        if (status === 'Delivered') {
            order.deliveryDate = Date.now();
        }

        await order.save();
        res.json({ message: 'Order status updated', order });
    } catch (error) {
        res.status(400).json({ message: 'Error updating status', error: error.message });
    }
};
