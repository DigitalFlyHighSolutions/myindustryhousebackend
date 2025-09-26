// backend/routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const { 
    updateUserContactDetails, 
    changePassword,
    manageAddress
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// All account routes are protected
router.use(verifyToken);

// --- General Account Management ---
router.put('/contact', updateUserContactDetails);
router.put('/password', changePassword);

// --- Buyer Specific ---
router.get('/addresses', (req, res) => manageAddress(req, res, 'get'));
router.post('/addresses', (req, res) => manageAddress(req, res, 'add'));
router.put('/addresses/:addressId', (req, res) => manageAddress(req, res, 'update'));
router.delete('/addresses/:addressId', (req, res) => manageAddress(req, res, 'delete'));
router.put('/addresses/:addressId/default', (req, res) => manageAddress(req, res, 'default'));

module.exports = router;