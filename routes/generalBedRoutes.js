/**
 * General Bed Routes
 * API endpoints for General Bed management
 */

const express = require('express');
const router = express.Router();
const generalBedController = require('../controllers/generalBedController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/locations', generalBedController.getLocations);
router.get('/', generalBedController.getHospitalsWithBeds);
router.get('/hospital/:hospitalId', generalBedController.getBedsByHospital);

// Protected routes (require authentication)
router.post('/book', verifyToken, generalBedController.bookBed);
router.post('/waitlist', verifyToken, generalBedController.joinWaitlist);
router.get('/my-bookings', verifyToken, generalBedController.getMyBookings);
router.delete('/booking/:bookingId', verifyToken, generalBedController.cancelBooking);

module.exports = router;
