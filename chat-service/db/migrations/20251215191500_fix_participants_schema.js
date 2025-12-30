exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('conversations');
  if (!hasTable) return;

  const { rows } = await knex.raw(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'conversations'
  `);

  const cols = rows.map((r) => r.column_name);

  await knex.schema.alterTable('conversations', (table) => {
    if (!cols.includes('requirement_name')) {
      table.text('requirement_name');
    }
    if (!cols.includes('seller_name')) {
      table.text('seller_name');
    }
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('conversations');
  if (!hasTable) return;

  await knex.schema.alterTable('conversations', (table) => {
    if (table.dropColumn) {
      table.dropColumn('requirement_name');
      table.dropColumn('seller_name');
    }
  });
};
