exports.up = async function (knex) {
  const hasConversations = await knex.schema.hasTable('conversations');
  if (hasConversations) return;

  await knex.schema
    .createTable('conversations', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('gen_random_uuid()'));

      table.uuid('requirement_id').notNullable();
      table.uuid('product_id').nullable();
      table.uuid('seller_id').notNullable();
      table.uuid('buyer_id').notNullable();

      table.timestamps(true, true);

      table.index(['requirement_id']);
      table.index(['product_id']);
      table.index(['seller_id']);
      table.index(['buyer_id']);
    })
    .createTable('participants', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('gen_random_uuid()'));

      table
        .uuid('conversation_id')
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE');

      table.uuid('user_id').notNullable();
      table.timestamps(true, true);
      table.unique(['conversation_id', 'user_id']);
    })
    .createTable('messages', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('gen_random_uuid()'));

      table
        .uuid('conversation_id')
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE');

      table.uuid('sender_id').notNullable();
      table.uuid('recipient_id').notNullable();
      table.text('message').notNullable();
      table.timestamps(true, true);

      table.index(['conversation_id']);
      table.index(['sender_id']);
      table.index(['recipient_id']);
    });
};

exports.down = async function (knex) {
  await knex.schema
    .dropTableIfExists('messages')
    .dropTableIfExists('participants')
    .dropTableIfExists('conversations');
};
