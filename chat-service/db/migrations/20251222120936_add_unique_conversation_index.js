exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('conversations');
  if (!hasTable) return;

  const idxExists = await knex.raw(`
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'conversations'
      AND indexname = 'unique_conversation'
  `);

  if (idxExists.rows.length === 0) {
    await knex.raw(`
      CREATE UNIQUE INDEX unique_conversation
      ON conversations (requirement_id, seller_id, buyer_id)
    `);
  }
};

exports.down = async function (knex) {
  await knex.raw(`DROP INDEX IF EXISTS unique_conversation`);
};
