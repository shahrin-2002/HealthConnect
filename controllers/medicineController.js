const Medicine = require('../models/Medicine');

// Get all active medicines
exports.getAllMedicines = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = { isActive: true };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const medicines = await Medicine.find(query).sort({ name: 1 });
        res.json(medicines);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching medicines', error: error.message });
    }
};

// Get single medicine
exports.getMedicineById = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.json(medicine);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching medicine details', error: error.message });
    }
};

// Admin: Create medicine
exports.createMedicine = async (req, res) => {
    try {
        const medicine = new Medicine(req.body);
        await medicine.save();
        res.status(201).json(medicine);
    } catch (error) {
        res.status(400).json({ message: 'Error creating medicine', error: error.message });
    }
};

// Get categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Medicine.distinct('category', { isActive: true });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};
