// backend/models/User.js
const mongoose = require('mongoose');

// ✅ REVERTED: Sub-document schema for addresses
const addressSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Billing', 'Shipping'],
        required: true
    },
    details: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit contact number!`
        }
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    },
    onboardingComplete: {
        type: Boolean,
        default: false
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    // ✅ REVERTED: Field to store multiple addresses for a user
    addresses: [addressSchema]
}, { timestamps: true });

userSchema.virtual('sellerProfile', {
    ref: 'SellerProfile',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;