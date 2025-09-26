// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
    getPublicProductById,
    getProductsBySeller,
    getPublicProductsBySeller,
    getAllPublicProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    getAcceptedLeads // ✅ NEW
} = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const { productUpload } = require('../config/cloudinary');

// --- Public Routes ---
router.get('/products', getAllPublicProducts);
router.get('/products/public/:productId', getPublicProductById);
router.get('/products/public/seller/:sellerId', getPublicProductsBySeller);
router.get('/categories', getCategories);

// --- Protected Routes (Require Token) ---
router.get('/products/seller/:sellerId', verifyToken, getProductsBySeller);

// ✅ NEW: Route specifically for fetching accepted leads (placeholder products)
router.get('/products/seller/:sellerId/leads', verifyToken, getAcceptedLeads);

router.post('/products', verifyToken, productUpload.single('image'), createProduct);
router.put('/products/:productId', verifyToken, productUpload.single('image'), updateProduct);
router.delete('/products/:productId', verifyToken, deleteProduct);

module.exports = router;