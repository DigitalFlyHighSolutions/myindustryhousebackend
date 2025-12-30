exports.up = function (knex) {
    return knex.schema.alterTable('requirements', function (table) {
        table.uuid('seller_id').references('id').inTable('users').onDelete('SET NULL');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('requirements', function (table) {
        table.dropColumn('seller_id');
    });
};
