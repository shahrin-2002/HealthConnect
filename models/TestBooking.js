const mongoose = require('mongoose');

const testBookingSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tests: [{
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LabTest',
            required: true
        },
        testName: String,
        price: Number
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    collectionMethod: {
        type: String,
        enum: ['hospital', 'home'],
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    scheduledTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['booked', 'sample_collected', 'in_progress', 'completed'],
        default: 'booked'
    },
    homeCollectionDetails: {
        phone: {
            type: String,
            validate: {
                validator: function (v) {
                    // Only validate if collection method is home
                    if (this.collectionMethod === 'home') {
                        return /^\+?[\d\s-()]+$/.test(v);
                    }
                    return true;
                },
                message: 'Please provide a valid phone number'
            }
        },
        address: {
            type: String,
            validate: {
                validator: function (v) {
                    // Only require if collection method is home
                    if (this.collectionMethod === 'home') {
                        return v && v.length > 0;
                    }
                    return true;
                },
                message: 'Address is required for home collection'
            }
        }
    },
    reportUrl: {
        type: String,
        default: null
    },
    reportUploadedAt: {
        type: Date,
        default: null
    },
    sampleCollectedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better query performance
testBookingSchema.index({ patientId: 1, createdAt: -1 });
testBookingSchema.index({ status: 1 });
testBookingSchema.index({ collectionMethod: 1 });
testBookingSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('TestBooking', testBookingSchema);
