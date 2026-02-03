const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
    requestId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    verifierDid: {
        type: String,
        required: true
    },
    userDid: {
        type: String,
        required: true,
        index: true
    },
    purpose: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
