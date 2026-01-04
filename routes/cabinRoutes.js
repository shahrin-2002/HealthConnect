/**
 * Cabin Routes
 * API endpoints for Cabin management
 */

const express = require('express');
const router = express.Router();
const cabinController = require('../controllers/cabinController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/locations', cabinController.getLocations);
router.get('/', cabinController.getHospitalsWithCabins);
router.get('/hospital/:hospitalId', cabinController.getCabinsByHospital);

// Protected routes (require authentication)
router.post('/book', verifyToken, cabinController.bookCabin);
router.post('/waitlist', verifyToken, cabinController.joinWaitlist);
router.get('/my-bookings', verifyToken, cabinController.getMyBookings);
router.delete('/booking/:bookingId', verifyToken, cabinController.cancelBooking);

module.exports = router;
