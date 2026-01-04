const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
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
    turnaroundTime: {
        type: String,
        required: true,
        default: '24 hours'
    },
    category: {
        type: String,
        required: true,
        enum: ['Blood', 'Urine', 'Radiology', 'Pathology', 'Microbiology', 'Biochemistry', 'Other']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better search performance
labTestSchema.index({ name: 'text', description: 'text' });
labTestSchema.index({ category: 1 });
labTestSchema.index({ isActive: 1 });

module.exports = mongoose.model('LabTest', labTestSchema);
