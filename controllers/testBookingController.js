const TestBooking = require('../models/TestBooking');
const LabTest = require('../models/LabTest');
const path = require('path');
const fs = require('fs');

class TestBookingController {
    // Create new booking (Patient)
    async createBooking(req, res) {
        try {
            const {
                tests,
                collectionMethod,
                scheduledDate,
                scheduledTime,
                homeCollectionDetails
            } = req.body;

            // Validation
            if (!tests || tests.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Please select at least one test'
                });
            }

            if (!collectionMethod || !scheduledDate || !scheduledTime) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide all required booking details'
                });
            }

            // Validate home collection details if method is home
            if (collectionMethod === 'home') {
                if (!homeCollectionDetails || !homeCollectionDetails.phone || !homeCollectionDetails.address) {
                    return res.status(400).json({
                        success: false,
                        error: 'Phone number and address are required for home collection'
                    });
                }
            }

            // Fetch test details and calculate total
            const testIds = tests.map(t => t.testId);
            const testDetails = await LabTest.find({ _id: { $in: testIds }, isActive: true });

            if (testDetails.length !== tests.length) {
                return res.status(400).json({
                    success: false,
                    error: 'Some selected tests are not available'
                });
            }

            // Build tests array with details and calculate total
            const testsWithDetails = testDetails.map(test => ({
                testId: test._id,
                testName: test.name,
                price: test.price
            }));

            const totalAmount = testsWithDetails.reduce((sum, test) => sum + test.price, 0);

            // Create booking
            const booking = await TestBooking.create({
                patientId: req.user.id,
                tests: testsWithDetails,
                totalAmount,
                collectionMethod,
                scheduledDate,
                scheduledTime,
                homeCollectionDetails: collectionMethod === 'home' ? homeCollectionDetails : undefined,
                status: 'booked'
            });

            await booking.populate('patientId', 'name email');

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                booking
            });
        } catch (error) {
            console.error('Error creating booking:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create booking'
            });
        }
    }

    // Get patient's own bookings
    async getMyBookings(req, res) {
        try {
            const bookings = await TestBooking.find({ patientId: req.user.id })
                .sort({ createdAt: -1 })
                .populate('tests.testId', 'name category');

            res.json({
                success: true,
                count: bookings.length,
                bookings
            });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch bookings'
            });
        }
    }

    // Get all bookings (Admin)
    async getAllBookings(req, res) {
        try {
            const { status, collectionMethod, startDate, endDate, search } = req.query;

            let query = {};

            // Status filter
            if (status) {
                query.status = status;
            }

            // Collection method filter
            if (collectionMethod) {
                query.collectionMethod = collectionMethod;
            }

            // Date range filter
            if (startDate || endDate) {
                query.scheduledDate = {};
                if (startDate) query.scheduledDate.$gte = new Date(startDate);
                if (endDate) query.scheduledDate.$lte = new Date(endDate);
            }

            const bookings = await TestBooking.find(query)
                .sort({ createdAt: -1 })
                .populate('patientId', 'name email phone')
                .populate('tests.testId', 'name category');

            // Search by patient name if provided
            let filteredBookings = bookings;
            if (search) {
                const searchLower = search.toLowerCase();
                filteredBookings = bookings.filter(booking =>
                    booking.patientId?.name?.toLowerCase().includes(searchLower) ||
                    booking.patientId?.email?.toLowerCase().includes(searchLower)
                );
            }

            res.json({
                success: true,
                count: filteredBookings.length,
                bookings: filteredBookings
            });
        } catch (error) {
            console.error('Error fetching all bookings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch bookings'
            });
        }
    }

    // Update booking status (Admin)
    async updateBookingStatus(req, res) {
        try {
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: 'Status is required'
                });
            }

            const booking = await TestBooking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking not found'
                });
            }

            booking.status = status;

            // Update timestamps based on status
            if (status === 'sample_collected' && !booking.sampleCollectedAt) {
                booking.sampleCollectedAt = new Date();
            }
            if (status === 'completed' && !booking.completedAt) {
                booking.completedAt = new Date();
            }

            await booking.save();

            res.json({
                success: true,
                message: 'Booking status updated successfully',
                booking
            });
        } catch (error) {
            console.error('Error updating booking status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update booking status'
            });
        }
    }

    // Upload report (Admin)
    async uploadReport(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Please upload a PDF file'
                });
            }

            const booking = await TestBooking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking not found'
                });
            }

            // Delete old report if exists
            if (booking.reportUrl) {
                const oldPath = path.join(__dirname, '..', booking.reportUrl);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            booking.reportUrl = `/uploads/reports/${req.file.filename}`;
            booking.reportUploadedAt = new Date();
            booking.status = 'completed';
            booking.completedAt = new Date();

            await booking.save();

            res.json({
                success: true,
                message: 'Report uploaded successfully',
                booking
            });
        } catch (error) {
            console.error('Error uploading report:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload report'
            });
        }
    }

    // Download report (Patient/Admin)
    async downloadReport(req, res) {
        try {
            const booking = await TestBooking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking not found'
                });
            }

            // Check authorization (patient can only download their own reports)
            if (req.user.role !== 'Hospital_Admin' && booking.patientId.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to access this report'
                });
            }

            if (!booking.reportUrl) {
                return res.status(404).json({
                    success: false,
                    error: 'Report not available yet'
                });
            }

            const filePath = path.join(__dirname, '..', booking.reportUrl);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Report file not found'
                });
            }

            res.download(filePath);
        } catch (error) {
            console.error('Error downloading report:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to download report'
            });
        }
    }

    // Get home collection requests (Admin)
    async getHomeCollections(req, res) {
        try {
            const { status, date } = req.query;

            let query = { collectionMethod: 'home' };

            if (status) {
                query.status = status;
            }

            if (date) {
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
            }

            const collections = await TestBooking.find(query)
                .sort({ scheduledDate: 1, scheduledTime: 1 })
                .populate('patientId', 'name email')
                .populate('tests.testId', 'name');

            res.json({
                success: true,
                count: collections.length,
                collections
            });
        } catch (error) {
            console.error('Error fetching home collections:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch home collections'
            });
        }
    }

    // Get single booking details
    async getBookingById(req, res) {
        try {
            const booking = await TestBooking.findById(req.params.id)
                .populate('patientId', 'name email phone')
                .populate('tests.testId', 'name category description');

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking not found'
                });
            }

            // Check authorization
            if (req.user.role !== 'Hospital_Admin' && booking.patientId._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to access this booking'
                });
            }

            res.json({
                success: true,
                booking
            });
        } catch (error) {
            console.error('Error fetching booking:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch booking details'
            });
        }
    }
}

module.exports = new TestBookingController();
