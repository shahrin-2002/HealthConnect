const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: [true, 'Patient name is required']
    },
    disease: {
        type: String,
        required: [true, 'Disease/Reason is required']
    },
    bloodType: {
        type: String,
        required: [true, 'Blood type is required'],
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    dateNeeded: {
        type: Date,
        required: [true, 'Date needed is required']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required']
    },
    additionalInfo: {
        type: String
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional to allow unauthenticated requests if desired, but spec says "post giver can also delete post", implying ownership. Spec also says "if anyone dosen't login they can also see post". Creating usually requires login. I'll make it required but handle authentication in controller.
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
