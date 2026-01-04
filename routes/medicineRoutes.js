const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', medicineController.getAllMedicines);
router.get('/categories', medicineController.getCategories);
router.get('/:id', medicineController.getMedicineById);

// Admin only
router.post('/', authenticateToken, isAdmin, medicineController.createMedicine);

module.exports = router;
