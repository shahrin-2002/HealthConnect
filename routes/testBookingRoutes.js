const express = require('express');
const router = express.Router();
const testBookingController = require('../controllers/testBookingController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for report uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/reports');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Patient routes
router.post('/', authenticateToken, testBookingController.createBooking);
router.get('/my-bookings', authenticateToken, testBookingController.getMyBookings);
router.get('/:id', authenticateToken, testBookingController.getBookingById);
router.get('/:id/report', authenticateToken, testBookingController.downloadReport);

// Admin routes
router.get('/', authenticateToken, isAdmin, testBookingController.getAllBookings);
router.patch('/:id/status', authenticateToken, isAdmin, testBookingController.updateBookingStatus);
router.post('/:id/report', authenticateToken, isAdmin, upload.single('report'), testBookingController.uploadReport);
router.get('/admin/home-collections', authenticateToken, isAdmin, testBookingController.getHomeCollections);

module.exports = router;
