const mongoose = require('mongoose');

const gaslessIdentitySchema = new mongoose.Schema({
    shareHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    did: {
        type: String,
        required: true
    },
    encryptedData: {
        type: String,
        required: true
    },
    ipfsHash: {
        type: String,
        required: true
    },
    onChainStatus: {
        type: String,
        enum: ['PENDING', 'ANCHORED'],
        default: 'PENDING'
    },
    anchoredBy: {
        type: String,
        default: null
    },
    txHash: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    anchoredAt: {
        type: Date,
        default: null
    },
    accessCount: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('GaslessIdentity', gaslessIdentitySchema);
