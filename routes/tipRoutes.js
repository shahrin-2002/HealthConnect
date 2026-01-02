const express = require('express');
const router = express.Router();
const tipController = require('../controllers/tipController');
const { verifyToken } = require('../middleware/auth');

// Public access
router.get('/', tipController.getAllTips);

// Protected access (Controller checks for 'doctor' role)
router.post('/', verifyToken, tipController.createTip);
router.delete('/:id', verifyToken, tipController.deleteTip);

module.exports = router;
