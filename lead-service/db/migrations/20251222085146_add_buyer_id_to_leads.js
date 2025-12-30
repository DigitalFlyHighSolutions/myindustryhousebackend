exports.up = function (knex) {
  return knex.schema.hasColumn('leads', 'buyer_id').then((exists) => {
    if (!exists) {
      return knex.schema.alterTable('leads', (table) => {
        table
          .uuid('buyer_id')
          .notNullable()
          .references('id')
          .inTable('users')
          .onDelete('CASCADE')
          .index();
      });
    }
  });
};

exports.down = function (knex) {
  return knex.schema.hasColumn('leads', 'buyer_id').then((exists) => {
    if (exists) {
      return knex.schema.alterTable('leads', (table) => {
        table.dropColumn('buyer_id');
      });
    }
  });
};
