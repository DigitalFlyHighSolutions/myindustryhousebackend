exports.up = function(knex) {
    return knex.schema
        .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
        .createTable('users', function(table) {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.string('name').notNullable();
            table.string('email').notNullable().unique();
            table.string('password').notNullable();
            table.string('contactNumber').notNullable();
            table.enu('role', ['buyer', 'seller', 'admin']).notNullable();
            table.enu('status', ['active', 'suspended']).defaultTo('active');
            table.boolean('onboardingComplete').defaultTo(false);
            table.string('passwordResetToken');
            table.timestamp('passwordResetExpires');
            table.string('razorpayCustomerId');
            table.timestamps(true, true);
        })
        .createTable('user_addresses', function(table) {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.enu('type', ['Billing', 'Shipping']);
            table.string('details').notNullable();
            table.boolean('isDefault').defaultTo(false);
            table.uuid('userId').references('id').inTable('users').onDelete('CASCADE');
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTable('user_addresses')
        .dropTable('users');
};