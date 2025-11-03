// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { 
    verifyGst, 
    getDuplicateGst, 
    toggleUserStatus, 
    deleteUser,
    getAllUsers,
    getAllProducts,
    updateProductStatus,
    getPendingGstSellers,
    adminDeleteProduct,
    getDashboardStats,
    getAllRequirements,
    getAcceptedRequirements,
    getAllConversations,
    getConversationDetailsForAdmin
} = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin);

// --- Dashboard Stats ---
router.get('/stats', getDashboardStats);

// --- User Management ---
router.get('/users', getAllUsers);
router.put('/users/:userId/status', toggleUserStatus);
router.delete('/users/:userId', deleteUser);

// --- Product Management ---
router.get('/products', getAllProducts);
router.put('/products/:productId/status', updateProductStatus);
router.delete('/products/:productId', adminDeleteProduct);

// --- GST Management ---
router.get('/pending-gst', getPendingGstSellers);
router.get('/duplicate-gst', getDuplicateGst);
router.put('/verify-gst/:sellerProfileId', verifyGst);

// --- Requirement & Inquiry Management ---
router.get('/requirements', getAllRequirements);
router.get('/accepted-requirements', getAcceptedRequirements);

// --- Conversation Management ---
router.get('/conversations', getAllConversations);
router.get('/conversations/:convoId', getConversationDetailsForAdmin);


module.exports = router;
