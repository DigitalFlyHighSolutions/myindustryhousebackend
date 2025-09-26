// backend/routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const { buyLead } = require('../controllers/leadController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/leads/buy', verifyToken, buyLead);

module.exports = router;