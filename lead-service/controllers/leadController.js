// controllers/leadController.js
const ensureUserExists = require('../helpers/ensureUserExists');
const leadRepository = require('../repositories/leadRepository');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const axios = require('axios');
const knex = require('../db'); // ✅ ADD THIS

/**
 * Get user id from Krakend
 */
const getUserId = (req) =>
  req.headers['x-user-id'] || req.headers['X-User-ID'];

/* ===========================================================
   BUYER: CREATE REQUIREMENT
   POST /leads/requirements
   =========================================================== */
exports.createRequirement = async (req, res) => {
  try {
    const buyerId = getUserId(req);
    if (!buyerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      product_requirement,
      category,
      quantity,
      budget_min,
      budget_max,
      delivery_location,
      buyer_name,
      buyer_phone,
      buyer_email,
      additional_details,
    } = req.body;

    if (!product_requirement?.trim()) {
      return res.status(400).json({
        message: 'product_requirement is required',
      });
    }

    await ensureUserExists(buyerId, 'buyer');

    const requirementData = {
      id: uuidv4(),
      buyer_id: buyerId,
      product_name: product_requirement.trim(),
      details: JSON.stringify({
        description: additional_details || null,
        meta: {
          category,
          budget_min,
          budget_max,
          buyer_name,
          buyer_phone,
          buyer_email,
        },
      }),
      quantity: quantity || null,
      location_preference: delivery_location || null,
      city: delivery_location || null,
      status: 'Open',
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    };

    const requirement =
      await leadRepository.createRequirement(requirementData);

    return res.status(201).json({
      message: 'Requirement created successfully',
      data: requirement,
    });
  } catch (err) {
    console.error('[CREATE REQUIREMENT ERROR]', err);
    return res.status(500).json({
      message: 'Server Error',
    });
  }
};

/* ===========================================================
   GET REQUIREMENT BY ID
   =========================================================== */
exports.getRequirementById = async (req, res) => {
  try {
    const { id } = req.params;

    const requirement = await db('requirements')
      .where({ id })
      .first();

    if (!requirement) {
      return res.status(404).json({ message: 'Requirement not found' });
    }

    return res.json(requirement);
  } catch (err) {
    console.error('[GET REQUIREMENT ERROR]', err);
    return res.status(500).json({
      message: 'Failed to fetch requirement',
    });
  }
};


/* ===========================================================
   GET REQUIREMENTS
   - /leads/requirements        → PUBLIC (Open only)
   - /leads/requirements/me     → BUYER (all statuses)
   =========================================================== */
exports.getRequirements = async (req, res) => {
  try {
    const userId = getUserId(req);
    const filters = { ...req.query };

    if (req.originalUrl.endsWith('/requirements/me')) {
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      filters.buyer_id = userId;
      delete filters.status;
    } else {
      filters.status = filters.status || 'Open';
    }

    const requirements = await leadRepository.findRequirements(filters);
    return res.json(requirements);
  } catch (err) {
    console.error('[GET REQUIREMENTS ERROR]', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

/* ===========================================================
   BUYER: UPDATE REQUIREMENT
   PUT /leads/requirements/:id
   =========================================================== */
exports.updateRequirement = async (req, res) => {
  try {
    const buyerId = getUserId(req);
    if (!buyerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    const allowedFields = [
      'product_name',
      'details',
      'quantity',
      'location_preference',
      'city',
      'status',
    ];

    const updateData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({
        message: 'No valid fields provided',
      });
    }

    updateData.updated_at = db.fn.now();

    const updated =
      await leadRepository.updateRequirement(id, buyerId, updateData);

    if (!updated) {
      return res.status(404).json({
        message: 'Requirement not found or forbidden',
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error('[UPDATE REQUIREMENT ERROR]', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

/* ===========================================================
   BUYER: DELETE REQUIREMENT
   =========================================================== */
exports.deleteRequirement = async (req, res) => {
  try {
    const buyerId = getUserId(req);
    if (!buyerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    const deleted =
      await leadRepository.removeRequirement(id, buyerId);

    if (!deleted) {
      return res.status(404).json({
        message: 'Requirement not found or forbidden',
      });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('[DELETE REQUIREMENT ERROR]', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

/* ===========================================================
   SELLER: BUY / ACCEPT LEAD
   =========================================================== */
exports.buyLead = async (req, res) => {
  const trx = await db.transaction();

  try {
    const sellerId = getUserId(req);
    const { requirementId, message } = req.body;

    if (!sellerId || !requirementId || !message?.trim()) {
      await trx.rollback();
      return res.status(400).json({
        message: 'sellerId, requirementId and message are required',
      });
    }

    const requirement = await trx('requirements')
      .where({ id: requirementId })
      .first();

    if (!requirement) {
      await trx.rollback();
      return res.status(404).json({ message: 'Requirement not found' });
    }

    if (String(requirement.status).toLowerCase() === 'closed') {
      await trx.rollback();
      return res.status(409).json({
        message: 'Requirement already closed',
      });
    }

    // ============================
    // FETCH SELLER DETAILS
    // ============================
    let seller;
    try {
      const resUser = await axios.get(
        `http://user-service:5006/users/${sellerId}`,
        { timeout: 5000 }
      );
      seller = resUser.data;
    } catch (err) {
      await trx.rollback();
      return res.status(404).json({
        message: 'Seller not found',
      });
    }

    if (seller.role !== 'seller') {
      await trx.rollback();
      return res.status(403).json({
        message: 'Invalid seller account',
      });
    }

    // 🔐 HARD FK GUARANTEE (CRITICAL FIX)
    await ensureUserExists(sellerId, 'seller');

    // ============================
    // FETCH BUYER DETAILS (FOR CHAT)
    // ============================
    let buyer;
    try {
      const resBuyer = await axios.get(
        `http://user-service:5006/users/${requirement.buyer_id}`,
        { timeout: 5000 }
      );
      buyer = resBuyer.data;
    } catch (err) {
      await trx.rollback();
      return res.status(404).json({
        message: 'Buyer not found',
      });
    }

    // ============================
    // DUPLICATE CONTACT CHECK
    // ============================
    const exists = await trx('leads')
      .where({
        seller_id: sellerId,
        requirement_id: requirementId,
      })
      .first();

    if (exists) {
      await trx.rollback();
      return res.status(409).json({
        message: 'Already contacted',
      });
    }

    // ============================
    // UPDATE REQUIREMENT STATUS
    // ============================
    // NOTE:
    // Pehle hum yahan requirement ka status 'Processing' kar rahe the.
    // Isse problem yeh aayi ki jaise hi ek seller lead accept karta hai,
    // requirement 'Open' list se gayab ho jaati hai aur baaki sellers ko
    // woh lead dikhti hi nahi.
    //
    // Ab hum status yahin par change Nahi kar rahe, taaki multiple sellers
    // ek hi requirement ko dekh sakein aur accept kar sakein.
    // Final close buyer karega, tab closeRequirement status 'Closed' set karega.
    //
    // Agar future mein per-requirement state chahiye ho, to ek separate
    // field/flag use kar sakte ho instead of status toggle on first accept.

    const leadId = uuidv4();

    // ============================
    // INSERT LEAD (BUYER ID KEPT)
    // ============================
    await trx('leads').insert({
      id: leadId,
      seller_id: sellerId,
      buyer_id: requirement.buyer_id,
      requirement_id: requirementId,
      status: 'Processing',
      created_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });

    // ============================
    // CHAT SERVICE (FULL CONTEXT)
    // ============================
    await axios.post(
      'http://chat-service:5008/messages',
      {
        sender: sellerId,
        recipient: requirement.buyer_id,

        requirementId,
        requirementName: requirement.product_name,

        // ✅ REQUIRED BY CHAT SERVICE
        sellerName: seller.name,
        buyerName: buyer.name,

        message,
      },
      { timeout: 15000 }
    );

    await trx.commit();

    return res.json({
      message: 'Lead accepted & message sent',
      leadId,
    });
  } catch (err) {
    await trx.rollback();
    console.error('[BUY LEAD ERROR]', err);
    return res.status(500).json({
      message: 'Failed to accept lead',
    });
  }
};


/* ===========================================================
   SELLER: CONTACTED LEADS
   =========================================================== */
exports.getSellerContactedRequirements = async (req, res) => {
  try {
    const sellerId = getUserId(req);
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const leads =
      await leadRepository.findContactedRequirementsBySeller(sellerId);

    return res.json(leads);
  } catch (err) {
    console.error('[SELLER CONTACTED ERROR]', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

exports.deleteAllRequirements = async (req, res) => {
  const buyerId = getUserId(req);
  if (!buyerId) return res.status(401).json({ message: 'Unauthorized' });

  const deletedCount =
    await leadRepository.removeAllRequirementsByBuyer(buyerId);

  if (!deletedCount) {
    return res.status(404).json({ message: 'No requirements found' });
  }

  return res.status(200).json({
    message: 'All requirements deleted successfully',
    deletedCount
  });
};

/* ===========================================================
   BUYER: CLOSE DEAL
   =========================================================== */
exports.closeRequirement = async (req, res) => {
  const trx = await db.transaction();

  try {
    const buyerId = getUserId(req);
    const { id } = req.params;

    if (!buyerId) {
      await trx.rollback();
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Allow Open + Processing
    const requirement = await trx('requirements')
      .where({ id, buyer_id: buyerId })
      .whereIn('status', ['Open', 'Processing'])
      .first();

    if (!requirement) {
      await trx.rollback();
      return res.status(404).json({
        message: 'Requirement not found or already closed',
      });
    }

    // ✅ Close requirement
    await trx('requirements')
      .where({ id })
      .update({
        status: 'Closed',
        updated_at: trx.fn.now(),
      });

    // ✅ Close all related leads (if any)
    await trx('leads')
      .where({ requirement_id: id })
      .update({
        status: 'Closed',
        updated_at: trx.fn.now(),
      });

    await trx.commit();

    return res.json({ message: 'Requirement closed successfully' });
  } catch (err) {
    await trx.rollback();
    console.error('[CLOSE DEAL ERROR]', err);
    return res.status(500).json({
      message: 'Failed to close requirement',
    });
  }
};

/* ===========================================================
   SELLER: CANCEL LEAD
   =========================================================== */
exports.cancelLead = async (req, res) => {
  const trx = await db.transaction();

  try {
    const sellerId = getUserId(req);
    const { id } = req.params;

    if (!sellerId) {
      await trx.rollback();
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lead = await trx('leads')
      .where({ id, seller_id: sellerId, status: 'Processing' })
      .first();

    if (!lead) {
      await trx.rollback();
      return res.status(404).json({
        message: 'Lead not found or cannot be cancelled',
      });
    }

    await trx('leads')
      .where({ id })
      .update({
        status: 'Cancelled',
        updated_at: trx.fn.now(),
      });

    await trx('requirements')
      .where({ id: lead.requirement_id })
      .update({
        status: 'Open',
        updated_at: trx.fn.now(),
      });

    await trx.commit();
    return res.json({ message: 'Lead cancelled successfully' });
  } catch (err) {
    await trx.rollback();
    console.error('[CANCEL LEAD ERROR]', err);
    return res.status(500).json({
      message: 'Failed to cancel lead',
    });
  }
};


// ================================
// SELLER LEADS STATS
// GET /leads/stats
// ================================
exports.getSellerLeadsStats = async (req, res) => {
  try {
    const sellerId = req.headers['x-user-id'];

    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const total = await db('leads')
      .where({ seller_id: sellerId })
      .count('id as count')
      .first();

    const open = await db('leads')
      .where({ seller_id: sellerId })
      .whereIn('status', ['Open'])
      .count('id as count')
      .first();

    const processing = await db('leads')
      .where({ seller_id: sellerId, status: 'Processing' })
      .count('id as count')
      .first();

    const closed = await db('leads')
      .where({ seller_id: sellerId, status: 'Closed' })
      .count('id as count')
      .first();

    const cancelled = await db('leads')
      .where({ seller_id: sellerId, status: 'Cancelled' })
      .count('id as count')
      .first();

    return res.json({
      total: Number(total.count) || 0,
      open: Number(open.count) || 0,
      accepted: Number(processing.count) || 0, // 👈 THIS IS PROCESSING
      closed: Number(closed.count) || 0,
      cancelled: Number(cancelled.count) || 0,
    });
  } catch (err) {
    console.error('[getSellerLeadsStats]', err);
    res.status(500).json({ message: 'Failed to fetch lead stats' });
  }
};



exports.selectSellerForRequirement = async (req, res) => {
  const buyerId = req.user.id;
  const { requirementId, sellerId } = req.body;

  if (!requirementId || !sellerId) {
    return res.status(400).json({ message: 'requirementId and sellerId required' });
  }

  const trx = await knex.transaction();

  try {
    // 🔐 Buyer owns requirement check
    const requirement = await trx('requirements')
      .where({ id: requirementId, buyer_id: buyerId })
      .first();

    if (!requirement) {
      await trx.rollback();
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ❌ Reject ALL sellers for this requirement
    await trx('leads')
      .where({ requirement_id: requirementId })
      .update({
        status: 'rejected',
        updated_at: knex.fn.now(),
      });

    // ✅ Accept ONLY selected seller
    const updated = await trx('leads')
      .where({
        requirement_id: requirementId,
        seller_id: sellerId,
      })
      .update({
        status: 'accepted',
        updated_at: knex.fn.now(),
      });

    if (!updated) {
      await trx.rollback();
      return res.status(404).json({ message: 'Seller lead not found' });
    }

    // 🔒 Close requirement
    await trx('requirements')
      .where({ id: requirementId })
      .update({
        status: 'closed',
        updated_at: knex.fn.now(),
      });

    await trx.commit();

    return res.json({ message: 'Seller selected successfully' });
  } catch (err) {
    await trx.rollback();
    console.error('[SELECT SELLER ERROR]', err);
    return res.status(500).json({ message: 'Internal error' });
  }
};






