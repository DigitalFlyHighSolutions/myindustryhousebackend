// backend/routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const { verifyGstAndPan } = require('../controllers/verificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// This route is protected, so only a logged-in user can attempt verification.
router.post('/verify/documents', verifyToken, verifyGstAndPan);

module.exports = router;