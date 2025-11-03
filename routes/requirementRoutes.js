// backend/routes/requirementRoutes.js
const express = require('express');
const router = express.Router();
const { postRequirement, getBuyerRequirements, getRequirementDetails, getAvailableLeads, updateRequirementStatus } = require('../controllers/requirementController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// ✅ FIX: Simplified the route path since '/requirements' is now handled in server.js
// OLD: /requirements/leads -> NEW: /leads
router.get('/leads', getAvailableLeads);

// ✅ FIX: Simplified all requirement routes
router.post('/', postRequirement);
router.get('/', getBuyerRequirements);
router.get('/:id', getRequirementDetails);
router.put('/:id/status', updateRequirementStatus);

module.exports = router;
