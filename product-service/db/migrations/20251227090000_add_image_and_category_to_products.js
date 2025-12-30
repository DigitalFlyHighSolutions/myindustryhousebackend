// migrations/20251227090000_add_image_and_category_to_products.js

const TABLE = 'products';

exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable(TABLE);
  if (!hasTable) {
    console.warn(`[MIGRATION] ${TABLE} table does not exist, skipping`);
    return;
  }

  // image (jsonb)
  if (!(await knex.schema.hasColumn(TABLE, 'image'))) {
    await knex.schema.alterTable(TABLE, (t) => {
      t.jsonb('image').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    });
  }

  // mainCategoryId (uuid)
  if (!(await knex.schema.hasColumn(TABLE, 'mainCategoryId'))) {
    await knex.schema.alterTable(TABLE, (t) => {
      t.uuid('mainCategoryId').nullable();
    });
  }

  // subCategory (text)
  if (!(await knex.schema.hasColumn(TABLE, 'subCategory'))) {
    await knex.schema.alterTable(TABLE, (t) => {
      t.text('subCategory').nullable();
    });
  }

  // 🔥 ADD price (numeric)
  if (!(await knex.schema.hasColumn(TABLE, 'price'))) {
    await knex.schema.alterTable(TABLE, (t) => {
      t.numeric('price', 12, 2).nullable();
    });
  }

  // 🔥 ADD unit (text)
  if (!(await knex.schema.hasColumn(TABLE, 'unit'))) {
    await knex.schema.alterTable(TABLE, (t) => {
      t.text('unit').nullable();
    });
  }
};

exports.down = async function down(knex) {
  // non-destructive
};
