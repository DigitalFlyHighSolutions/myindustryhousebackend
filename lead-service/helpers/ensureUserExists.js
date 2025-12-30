const knex = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * HARD FK GUARANTEE
 * Ensures user exists in lead-service DB
 */
async function ensureUserExists(userId, role = 'buyer') {
  if (!userId) return;

  const exists = await knex('users').where({ id: userId }).first();
  if (exists) return;

  console.warn('[LEAD-SERVICE] User missing, inserting stub:', userId);

  await knex('users').insert({
    id: userId,
    name: 'Unknown User',
    email: `${userId}@stub.local`,
    role,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });
}

module.exports = ensureUserExists;
