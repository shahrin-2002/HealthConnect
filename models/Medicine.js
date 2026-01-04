const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Antibiotics', 'Painkillers', 'Vitamins', 'First Aid', 'Chronic Care', 'General', 'Other']
    },
    stock: {
        type: Number,
        required: true,
        default: 100
    },
    image: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for search
medicineSchema.index({ name: 'text', description: 'text' });
medicineSchema.index({ category: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
