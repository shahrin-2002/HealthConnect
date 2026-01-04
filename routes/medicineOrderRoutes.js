const express = require('express');
const router = express.Router();
const medicineOrderController = require('../controllers/medicineOrderController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Patient routes (Protected)
router.post('/', authenticateToken, medicineOrderController.placeOrder);
router.get('/mine', authenticateToken, medicineOrderController.getMyOrders);

// Admin routes (Protected + Admin check)
router.get('/', authenticateToken, isAdmin, medicineOrderController.getAllOrders);
router.patch('/:id/status', authenticateToken, isAdmin, medicineOrderController.updateOrderStatus);

module.exports = router;
