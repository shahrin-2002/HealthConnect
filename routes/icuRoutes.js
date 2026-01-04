/**
 * ICU Routes
 * Handles ICU booking, waitlist, and availability endpoints
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const icuController = require('../controllers/icuController');

// Public routes
router.get('/locations', icuController.getLocations);
router.get('/', icuController.getHospitalsWithICU);
router.get('/hospital/:hospitalId', icuController.getICUByHospital);

// Protected routes (require authentication)
router.post('/book', verifyToken, icuController.bookICU);
router.post('/waitlist', verifyToken, icuController.joinWaitlist);
router.get('/my-bookings', verifyToken, icuController.getMyBookings);
router.get('/my-waitlist', verifyToken, icuController.getMyWaitlist);
router.delete('/booking/:bookingId', verifyToken, icuController.cancelBooking);

module.exports = router;
