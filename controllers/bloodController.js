const BloodRequest = require('../models/BloodRequest');

// Get all blood requests
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await BloodRequest.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blood requests', error: error.message });
    }
};

// Create a new blood request
exports.createRequest = async (req, res) => {
    try {
        const { patientName, disease, bloodType, dateNeeded, contactNumber, additionalInfo } = req.body;

        const newRequest = new BloodRequest({
            patientName,
            disease,
            bloodType,
            dateNeeded,
            contactNumber,
            additionalInfo,
            creator: req.user ? req.user.id : null // req.user comes from auth middleware
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (error) {
        res.status(400).json({ message: 'Error creating blood request', error: error.message });
    }
};

// Delete a blood request
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await BloodRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: 'Blood request not found' });
        }

        // Check ownership
        // Assuming unauthenticated users can't delete, and admin can delete all (optional)
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (request.creator && request.creator.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this request' });
        }

        await request.deleteOne();
        res.status(200).json({ message: 'Blood request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blood request', error: error.message });
    }
};
