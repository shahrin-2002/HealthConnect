const HealthTip = require('../models/HealthTip');

// Get all health tips
exports.getAllTips = async (req, res) => {
    try {
        // Populate author name for display
        const tips = await HealthTip.find()
            .populate('author', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(tips);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching health tips', error: error.message });
    }
};

// Create a new health tip (Doctor only)
exports.createTip = async (req, res) => {
    try {
        const { title, content, category } = req.body;

        // Server-side role check
        // Assuming req.user is populated by auth middleware
        if (req.user.role !== 'doctor' && req.user.role !== 'Doctor') { // Case insensitive check just in case
            return res.status(403).json({ message: 'Access denied. Only doctors can post health tips.' });
        }

        const newTip = new HealthTip({
            title,
            content,
            category,
            author: req.user.id
        });

        const savedTip = await newTip.save();

        // Populate author info for the response
        await savedTip.populate('author', 'name');

        res.status(201).json(savedTip);
    } catch (error) {
        res.status(400).json({ message: 'Error creating health tip', error: error.message });
    }
};

// Delete a health tip
exports.deleteTip = async (req, res) => {
    try {
        const { id } = req.params;
        const tip = await HealthTip.findById(id);

        if (!tip) {
            return res.status(404).json({ message: 'Health tip not found' });
        }

        // Check ownership
        if (tip.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this tip' });
        }

        await tip.deleteOne();
        res.status(200).json({ message: 'Health tip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting health tip', error: error.message });
    }
};
