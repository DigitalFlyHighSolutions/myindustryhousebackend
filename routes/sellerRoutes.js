const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { getSellerStats } = require("../controllers/sellerController");

const router = express.Router();

router.get("/:sellerId/stats", verifyToken, getSellerStats);

module.exports = router;
