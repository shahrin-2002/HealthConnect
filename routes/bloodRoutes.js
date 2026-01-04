const express = require('express');
const router = express.Router();
const bloodController = require('../controllers/bloodController');
const { verifyToken } = require('../middleware/auth');

// Public access
router.get('/', bloodController.getAllRequests);

// Protected access
// Note: verifyToken attaches user to req.user
router.post('/', verifyToken, bloodController.createRequest);
router.delete('/:id', verifyToken, bloodController.deleteRequest);

module.exports = router;
