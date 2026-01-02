const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth'); // JWT auth middleware
const appointmentController = require('../controllers/appointmentController');

// Patient endpoints
router.post('/book', verifyToken, appointmentController.book);
router.patch('/:id/reschedule', verifyToken, appointmentController.reschedule);
router.delete('/:id/cancel', verifyToken, appointmentController.cancel);
router.get('/mine', verifyToken, appointmentController.listMine);

// Doctor endpoints
router.get('/doctor/:doctorId', verifyToken, appointmentController.listForDoctor);
router.patch('/:id/approve', verifyToken, appointmentController.approve);
router.patch('/:id/complete', verifyToken, appointmentController.complete);

module.exports = router;
