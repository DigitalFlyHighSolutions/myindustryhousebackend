// admin-service/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// ===========================================================
// 🧭 ADMIN DASHBOARD
// ===========================================================
router.get('/dashboard', adminController.getAdminDashboard);

// ===========================================================
// 🗂️ MAIN CATEGORY MANAGEMENT (Admin Only)
// ===========================================================

// Create a new main category
router.post('/categories/main-categories', adminController.createMainCategory);

// Get all main categories
router.get('/categories/main-categories', adminController.getMainCategories);

// Toggle category active/inactive
router.put('/categories/main-categories/:id/status', adminController.toggleMainCategoryStatus);

// Delete a main category
router.delete('/categories/main-categories/:id', adminController.deleteMainCategory);

// Get sub-categories by main category (Public)
router.get(
  '/categories/main/:id/sub-categories',
  adminController.getSubCategoriesByMainCategory
);

router.post(
  '/categories/main/:id/sub-categories',
  adminController.createSubCategory
);

module.exports = router;
