// backend/routes/buyerRoutes.js
const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { getBuyerStats, getPublicBuyerProfile } = require("../controllers/buyerController");

const router = express.Router();

// ✅ FIXED: The problematic /:buyerId/profile route has been removed.
// All profile requests are now handled by the more general route in userRoutes.js,
// which correctly uses the unified getPublicUserProfile controller.

router.get("/:buyerId/stats", verifyToken, getBuyerStats);

module.exports = router;