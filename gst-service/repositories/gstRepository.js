const knex = require('../db');

function findByGstNumber(gstNumber) {
  return knex('gst_details').where({ gst_number: gstNumber }).first();
}

module.exports = {
  findByGstNumber,
};
