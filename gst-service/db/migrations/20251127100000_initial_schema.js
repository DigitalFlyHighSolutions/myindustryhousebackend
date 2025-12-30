
exports.up = function(knex) {
  return knex.schema.createTable('gst_details', function(table) {
    table.increments('id').primary();
    table.string('gst_number').notNullable().unique();
    table.string('company_name').notNullable();
    table.string('company_address').notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('gst_details');
};
