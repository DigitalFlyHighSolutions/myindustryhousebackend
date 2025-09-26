const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    details: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: String,
        required: true
    },
    locationPreference: {
        type: String,
        enum: ['anywhere', 'specific'],
        required: true
    },
    city: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
    // ✅ NEW: Array to track which sellers have contacted the buyer for this lead
    contactedSellers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

const Requirement = mongoose.model('Requirement', requirementSchema);

module.exports = Requirement;