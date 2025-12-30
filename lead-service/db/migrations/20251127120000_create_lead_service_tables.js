exports.up = async function (knex) {

  // ======================
  // USERS
  // ======================
  if (!(await knex.schema.hasTable('users'))) {
    await knex.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.string('role').notNullable();
      table.timestamps(true, true);
    });
  }

  // ======================
  // CATEGORIES
  // ======================
  if (!(await knex.schema.hasTable('categories'))) {
    await knex.schema.createTable('categories', (table) => {
      table.uuid('id').primary();
      table.string('name').notNullable().unique();
      table.timestamps(true, true);
    });
  }

  // ======================
  // PRODUCTS
  // ======================
  if (!(await knex.schema.hasTable('products'))) {
    await knex.schema.createTable('products', (table) => {
      table.uuid('id').primary();
      table.string('name').notNullable();
      table.text('description');

      table
        .uuid('category_id')
        .nullable()
        .references('id')
        .inTable('categories')
        .onDelete('SET NULL');

      table.text('brand');

      table
        .uuid('seller_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.string('status').defaultTo('draft');
      table.integer('stock_quantity').defaultTo(0);
      table.boolean('is_lead_placeholder').defaultTo(false);
      table.timestamps(true, true);
    });
  }

  // ======================
  // REQUIREMENTS
  // ======================
  if (!(await knex.schema.hasTable('requirements'))) {
    await knex.schema.createTable('requirements', (table) => {
      table.uuid('id').primary();

      table
        .uuid('buyer_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.string('product_name');
      table.text('details');
      table.string('quantity');
      table.string('location_preference');
      table.string('city');
      table.string('status').defaultTo('open');
      table.timestamps(true, true);
    });
  }

  // ======================
  // LEADS  ✅ REQUIRED
  // ======================
  if (!(await knex.schema.hasTable('leads'))) {
    await knex.schema.createTable('leads', (table) => {
      table.uuid('id').primary();

      table
        .uuid('requirement_id')
        .notNullable()
        .references('id')
        .inTable('requirements')
        .onDelete('CASCADE');

      table
        .uuid('seller_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.string('status').defaultTo('active');
      table.timestamps(true, true);

      table.unique(['requirement_id', 'seller_id']);
    });
  }

  // ======================
  // CONVERSATIONS
  // ======================
  if (!(await knex.schema.hasTable('conversations'))) {
    await knex.schema.createTable('conversations', (table) => {
      table.uuid('id').primary();

      table
        .uuid('requirement_id')
        .notNullable()
        .references('id')
        .inTable('requirements')
        .onDelete('CASCADE');

      table
        .uuid('product_id')
        .nullable()
        .references('id')
        .inTable('products')
        .onDelete('SET NULL');

      table.timestamps(true, true);

      table.unique(['requirement_id']);
    });
  }

  // ======================
  // REQUIREMENT ↔ SELLERS
  // ======================
  if (!(await knex.schema.hasTable('requirement_contacted_sellers'))) {
    await knex.schema.createTable('requirement_contacted_sellers', (table) => {
      table
        .uuid('requirement_id')
        .notNullable()
        .references('id')
        .inTable('requirements')
        .onDelete('CASCADE');

      table
        .uuid('seller_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.primary(['requirement_id', 'seller_id']);
      table.timestamps(true, true);
    });
  }

  // ======================
  // CONVERSATION PARTICIPANTS
  // ======================
  if (!(await knex.schema.hasTable('conversation_participants'))) {
    await knex.schema.createTable('conversation_participants', (table) => {
      table
        .uuid('conversation_id')
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE');

      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.primary(['conversation_id', 'user_id']);
      table.timestamps(true, true);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('conversation_participants');
  await knex.schema.dropTableIfExists('requirement_contacted_sellers');
  await knex.schema.dropTableIfExists('leads');
  await knex.schema.dropTableIfExists('conversations');
  await knex.schema.dropTableIfExists('requirements');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('users');
};
