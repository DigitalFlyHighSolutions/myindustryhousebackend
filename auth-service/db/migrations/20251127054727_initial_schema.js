exports.up = function(knex) {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable('seller_profiles', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('userId').notNullable().unique();
      table.string('companyName').notNullable();
      table.string('companyLogo');
      table.text('aboutUs');
      table.string('fullAddress').notNullable();
      table.string('pincode').notNullable();
      table.string('city').notNullable();
      table.string('state').notNullable();
      table.string('gstNumber').notNullable();
      table.string('panNumber').notNullable();
      table.boolean('gstVerified').defaultTo(false);
      table.string('companyType');
      table.string('businessType').notNullable();
      table.integer('yearOfEstablishment').notNullable();
      table.string('gstCertificate');
      table.string('panCard');
      table.string('bankAccountName').notNullable();
      table.string('bankAccountNumber').notNullable();
      table.string('ifscCode').notNullable();
      table.timestamps(true, true);
    })
    .createTable('plans', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name').notNullable();
      table.enu('tier', ['silver', 'gold', 'platinum']);
      table.enu('type', ['free', 'monthly', 'yearly']);
      table.integer('price').notNullable();
      table.string('interval');
      table.integer('durationDays');
      table.boolean('isFreePlan').defaultTo(false);
      table.string('razorpayPlanId');
      table.jsonb('features');
      table.boolean('isActive').defaultTo(true);
      table.enu('forRole', ['buyer', 'seller', 'admin']).defaultTo('seller');
      table.timestamps(true, true);
    })
    .createTable('subscriptions', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('userId');
      table.uuid('planId').references('id').inTable('plans');
      table.string('razorpaySubscriptionId');
      table.enu('status', ['pending', 'active', 'cancelled', 'expired', 'past_due']);
      table.timestamp('startDate');
      table.timestamp('endDate');
      table.boolean('autoRenew').defaultTo(true);
      table.boolean('isTrial').defaultTo(false);
      table.jsonb('metadata');
      table.timestamps(true, true);
    })
    .createTable('payments', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('userId');
      table.uuid('subscriptionId').references('id').inTable('subscriptions');
      table.string('razorpayPaymentId');
      table.string('razorpayOrderId');
      table.integer('amount').notNullable();
      table.string('currency').defaultTo('INR');
      table.string('method');
      table.enu('status', ['created', 'authorized', 'captured', 'failed', 'refunded']);
      table.jsonb('notes');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('payments')
    .dropTable('subscriptions')
    .dropTable('plans')
    .dropTable('seller_profiles');
};