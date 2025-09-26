// backend/models/SellerProfile.js
const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    companyLogo: {
        url: { type: String, default: 'https://placehold.co/100x100?text=Logo' },
        public_id: { type: String }
    },
    aboutUs: {
        type: String,
        trim: true
    },
    fullAddress: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    gstNumber: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(v);
            },
            message: props => `${props.value} is not a valid GST number!`
        }
    },
    gstVerified: {
        type: Boolean,
        default: false
    },
    // ✅ NEW: Field to store the legal company type
    companyType: {
        type: String
    },
    businessType: {
        type: String,
        required: true
    },
    yearOfEstablishment: {
        type: Number,
        required: true
    },
    gstCertificate: {
        url: { type: String },
        public_id: { type: String }
    },
    panCard: {
        url: { type: String },
        public_id: { type: String }
    },
    bankAccountName: {
        type: String,
        required: true
    },
    bankAccountNumber: {
        type: String,
        required: true
    },
    ifscCode: {
        type: String,
        required: true
    },
}, { timestamps: true });

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);

module.exports = SellerProfile;