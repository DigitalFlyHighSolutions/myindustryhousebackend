// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number },
    unit: { type: String },
    image: {
        url: { type: String },
        public_id: { type: String }
    },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isLeadPlaceholder: {
        type: Boolean,
        default: false
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;