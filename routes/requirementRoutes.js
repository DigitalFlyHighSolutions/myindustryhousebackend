// backend/routes/requirementRoutes.js
const express = require('express');
const router = express.Router();
const { postRequirement, getBuyerRequirements, getRequirementDetails, getAvailableLeads, updateRequirementStatus } = require('../controllers/requirementController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/requirements/leads', getAvailableLeads);

router.post('/requirements', postRequirement);
router.get('/requirements', getBuyerRequirements);
router.get('/requirements/:id', getRequirementDetails);
// ✅ NEW: Route to update the status of a requirement
router.put('/requirements/:id/status', updateRequirementStatus);

module.exports = router;