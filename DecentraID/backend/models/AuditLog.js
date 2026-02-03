const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    did: {
        type: String,
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    txHash: {
        type: String,
        default: 'OFF-CHAIN'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
