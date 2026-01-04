const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTestController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Public/Patient routes
router.get('/', labTestController.getAllTests);
router.get('/categories', labTestController.getCategories);
router.get('/category/:category', labTestController.getTestsByCategory);
router.get('/:id', labTestController.getTestById);

// Admin routes
router.post('/', authenticateToken, isAdmin, labTestController.createTest);
router.put('/:id', authenticateToken, isAdmin, labTestController.updateTest);
router.delete('/:id', authenticateToken, isAdmin, labTestController.deleteTest);

module.exports = router;
