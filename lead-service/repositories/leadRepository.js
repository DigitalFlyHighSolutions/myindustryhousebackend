// repositories/leadRepository.js

const knex = require('../db');

/* ===========================================================
   REQUIREMENTS (BUYER SIDE)
   =========================================================== */

/**
 * Create requirement
 */
async function createRequirement(data) {
  if (!data || !data.buyer_id) {
    throw new Error('createRequirement requires buyer_id');
  }

  const [row] = await knex('requirements')
    .insert(data)
    .returning('*');

  return row;
}

/**
 * Find requirements (public / buyer)
 */
function findRequirements(filters = {}) {
  const q = knex('requirements').select('*');

  if (filters.status) {
    q.whereRaw('LOWER(status) = ?', [filters.status.toLowerCase()]);
  }

  if (filters.buyer_id) {
    q.where({ buyer_id: filters.buyer_id });
  }

  return q.orderBy('created_at', 'desc');
}

/**
 * Find single requirement
 */
async function findRequirementById(id) {
  if (!id) return null;
  return knex('requirements').where({ id }).first();
}

/**
 * Update requirement (buyer only)
 */
async function updateRequirement(id, buyerId, updateData) {
  const [row] = await knex('requirements')
    .where({ id, buyer_id: buyerId })
    .update(updateData)
    .returning('*');

  return row;
}

/**
 * Delete single requirement
 */
async function removeRequirement(id, buyerId) {
  return knex('requirements')
    .where({ id, buyer_id: buyerId })
    .del();
}

/**
 * Delete all requirements of buyer
 */
async function removeAllRequirementsByBuyer(buyerId) {
  if (!buyerId) {
    throw new Error('buyerId required');
  }

  return knex('requirements')
    .where({ buyer_id: buyerId })
    .del();
}

/**
 * Update requirement status (seller actions)
 */
async function updateRequirementStatus(id, status) {
  const [row] = await knex('requirements')
    .where({ id })
    .update({
      status,
      updated_at: knex.fn.now(),
    })
    .returning('*');

  return row;
}

/* ===========================================================
   LEADS (SELLER SIDE)
   =========================================================== */

/**
 * Seller stats
 */
async function getSellerLeadStats(sellerId) {
  if (!sellerId) {
    return { total: 0, open: 0, accepted: 0 };
  }

  const [{ cnt: open = 0 }] = await knex('requirements')
    .where({ status: 'Open' })
    .count('* as cnt');

  const [{ cnt: accepted = 0 }] = await knex('leads')
    .where({
      seller_id: sellerId,
      status: 'Processing',
    })
    .count('* as cnt');

  return {
    open: Number(open),
    accepted: Number(accepted),
    total: Number(open) + Number(accepted),
  };
}

/**
 * Seller contacted requirements
 */
async function findContactedRequirementsBySeller(sellerId) {
  if (!sellerId) return [];

  return knex('leads as l')
    .join('requirements as r', 'r.id', 'l.requirement_id')
    .leftJoin('users as u', 'u.id', 'r.buyer_id')
    .where('l.seller_id', sellerId)
    .select(
      'l.id as lead_id',
      'l.buyer_id as buyer_id',
      'l.status as lead_status',
      'l.created_at as lead_created_at',

      'r.id as requirement_id',
      'r.product_name',
      'r.details',
      'r.quantity',
      'r.location_preference',
      'r.city',
      'r.status as requirement_status',
      'r.created_at',
      'r.updated_at',

      'u.id as buyer_id',
      'u.name as buyer_name',
      'u.email as buyer_email'

    )
    .orderBy('l.created_at', 'desc');
}

/* ===========================================================
   USER FK SAFETY (LOCAL SHADOW USER)
   =========================================================== */

/**
 * Ensures buyer exists locally for FK safety
 */
async function syncUserToLocalDB(userId) {
  if (!userId) return null;

  const exists = await knex('users').where({ id: userId }).first();
  if (exists) return exists;

  const user = {
    id: userId,
    name: 'Synced User',
    email: `synced_${userId}@example.com`,
    role: 'buyer',
  };

  await knex('users')
    .insert(user)
    .onConflict('id')
    .ignore();

  return knex('users').where({ id: userId }).first();
}




async function selectSellerForRequirement(requirementId, selectedLeadId) {
  return knex.transaction(async (trx) => {
    // 1️⃣ Close requirement
    await trx('requirements')
      .where({ id: requirementId })
      .update({
        status: 'Closed',
        updated_at: trx.fn.now(),
      });

    // 2️⃣ Reject all leads of this requirement
    await trx('leads')
      .where({ requirement_id: requirementId })
      .update({
        status: 'Rejected',
        updated_at: trx.fn.now(),
      });

    // 3️⃣ Accept selected lead
    const [acceptedLead] = await trx('leads')
      .where({ id: selectedLeadId })
      .update({
        status: 'Accepted',
        updated_at: trx.fn.now(),
      })
      .returning('*');

    return acceptedLead;
  });
}


/* ===========================================================
   EXPORTS
   =========================================================== */

module.exports = {
  // requirements
  createRequirement,
  findRequirements,
  findRequirementById,
  updateRequirement,
  removeRequirement,
  removeAllRequirementsByBuyer,
  updateRequirementStatus,
  selectSellerForRequirement, // ✅ ADD THIS

  // seller
  getSellerLeadStats,
  findContactedRequirementsBySeller,
  selectSellerForRequirement,

  // fk safety
  syncUserToLocalDB,
};
