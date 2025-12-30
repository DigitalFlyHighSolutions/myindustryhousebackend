// routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const knex = require('../db'); // ✅ THIS WAS MISSING

// -----------------------------------------------------
// Simple auth mock:
// - Agar client x-user-id bhejega -> wahi use hoga
// - Agar nahi bhejega -> 401 (force karo ki hamesha valid UUID bhejo)
// -----------------------------------------------------
const verifyToken = (req, res, next) => {
  console.log('verifyToken called'); // verifyToken call check
  console.log('Headers:', req.headers); // headers check
  const userId = req.headers['x-user-id'];
  console.log('userId:', userId); // userId check

  if (!userId) {
    return res.status(401).json({
      message: 'Unauthorized: x-user-id header is required',
    });
  }

  req.user = { id: userId };
  next();
};


// debug: show what was actually imported from controller
console.log('leadController loaded with keys:', Object.keys(leadController || {}));

function assertHandler(fn, name) {
  if (typeof fn === 'function') return fn;

  // fallback handler that returns 501 — avoids Express crash and gives clear runtime message
  return (req, res) => {
    console.error(`Missing controller handler: ${name}`);
    res.status(501).json({ message: `Handler not implemented: ${name}` });
  };
}

// ========================================================
// NEW: Buyer Requirement Routes (Mounted under /leads)
// ========================================================

// POST /leads/requirements (Create a new requirement - Buyer protected)
router.post(
  '/requirements',
  verifyToken,
  assertHandler(leadController.createRequirement, 'createRequirement')
);

// GET /leads/requirements/me (View buyer's own requirements - Buyer protected)
router.get(
  '/requirements/me',
  verifyToken,
  assertHandler(leadController.getRequirements, 'getRequirements')
);

// GET /leads/requirements/:id (Get single requirement by ID)
router.get(
  '/requirements/:id',
  assertHandler(leadController.getRequirementById, 'getRequirementById')
);


// GET /leads/requirements (View open requirements for discovery - Public)
router.get(
  '/requirements',
  assertHandler(leadController.getRequirements, 'getRequirements')
);

// PUT /leads/requirements/:id (Update - Buyer protected)
router.put(
  '/requirements/:id',
  verifyToken,
  assertHandler(leadController.updateRequirement, 'updateRequirement')
);

// DELETE /leads/requirements/:id (Delete - Buyer protected)
router.delete(
  '/requirements/:id',
  verifyToken,
  assertHandler(leadController.deleteRequirement, 'deleteRequirement')
);

// ========================================================
// Existing Lead Routes
// ========================================================

// POST /leads/buy (Seller protected)
// Yahan seller ka UUID x-user-id header se aayega.
// leadController.buyLead already uses:
//   const sellerId = req.headers['x-user-id'];
//   const buyerId  = requirement.buyerid;
// phir buyerId ko recipient ke तौर पे chat-service ko bhejta hai.
// [file:1]
router.post(
  '/buy',
  verifyToken,
  assertHandler(leadController.buyLead, 'buyLead')
);

// GET /leads/seller/stats (Seller protected)
router.get(
  '/seller/stats',
  verifyToken,
  assertHandler(leadController.getSellerLeadsStats, 'getSellerLeadsStats')
);

// Alias /leads/stats
router.get(
  '/stats',
  verifyToken,
  assertHandler(leadController.getSellerLeadsStats, 'getSellerLeadsStats')
);

console.log(
  '🔥 leadController keys:',
  Object.keys(leadController)
);

// GET /leads/seller/contacted (Seller Lead Manager)
router.get(
  '/seller/contacted',
  verifyToken,
  assertHandler(
    leadController.getSellerContactedRequirements,
    'getSellerContactedRequirements'
  )
);

router.delete(
  '/requirements',
  verifyToken,
  leadController.deleteAllRequirements
);

// ========================================================
// BUYER: CLOSE DEAL
// PUT /leads/requirements/:id/close
// ========================================================
router.put(
  '/requirements/:id/close',
  verifyToken,
  assertHandler(leadController.closeRequirement, 'closeRequirement')
);


// ========================================================
// SELLER: CANCEL LEAD
// PUT /leads/:id/cancel
// ========================================================
router.put(
  '/:id/cancel',
  verifyToken,
  assertHandler(leadController.cancelLead, 'cancelLead')
);

router.put(
  '/select',
  verifyToken,
  assertHandler(
    leadController.selectSellerForRequirement,
    'selectSellerForRequirement'
  )
);


module.exports = router;