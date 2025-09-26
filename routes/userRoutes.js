// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
    sellerOnboarding, 
    updateSellerProfile, 
    getSellerProfile, 
    getUserProfile, 
    getAllSuppliers,
    getPublicUserProfile // ✅ NEW: Import the new controller
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { sellerUpload } = require('../config/cloudinary'); 

// --- Public Routes ---
router.get('/suppliers', getAllSuppliers);
router.get('/seller-profile/:userId', getSellerProfile);
router.get('/user-profile/:userId', getUserProfile);

// --- Protected Routes ---
// ✅ NEW: Unified route for fetching any user's public profile
router.get('/users/:userId/profile', verifyToken, getPublicUserProfile);

router.post(
    '/onboarding/seller', 
    verifyToken, 
    sellerUpload.fields([
        { name: 'companyLogo', maxCount: 1 },
        { name: 'gstCertificate', maxCount: 1 },
        { name: 'panCard', maxCount: 1 }
    ]), 
    sellerOnboarding
);

router.put(
    '/seller-profile/:userId',
    verifyToken,
    sellerUpload.single('companyLogo'),
    updateSellerProfile
);

module.exports = router;
