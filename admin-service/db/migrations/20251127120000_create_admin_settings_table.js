exports.up = function (knex) {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // 🟢 MAIN CATEGORIES TABLE (FIXED)
    .createTable('main_categories', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name').notNullable().unique();
      table.text('description');
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamps(true, true);
    })

    // 🟢 ADMIN SETTINGS TABLE
    .createTable('admin_settings', function (table) {
      table.increments('id').primary();
      table.string('setting_name').notNullable().unique();
      table.text('setting_value');
      table.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('admin_settings')
    .dropTableIfExists('main_categories');
};
