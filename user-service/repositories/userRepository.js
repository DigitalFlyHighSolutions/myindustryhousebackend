const db = require('../db');

const findAll = (filters) => {
    let query = db('users');
    if (filters.email) {
        query = query.where({ email: filters.email });
    }
    if (filters.passwordResetToken) {
        query = query.where({ passwordResetToken: filters.passwordResetToken });
    }
    return query.select('*');
};

const findById = (id) => {
    return db('users').where({ id }).first();
};

const findByEmail = (email) => {
    return db('users').where({ email }).first();
};

const create = (userData) => {
    return db('users').insert(userData).returning('*');
};

const update = (id, userData) => {
    return db('users').where({ id }).update(userData).returning('*');
};

const remove = async (id) => {
  const deletedCount = await db('users').where({ id }).del();
  return deletedCount > 0; // ✅ return true/false explicitly
};

module.exports = {
    findAll,
    findById,
    findByEmail,
    create,
    update,
    remove,
};
