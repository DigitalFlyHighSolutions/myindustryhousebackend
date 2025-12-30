// 🔥 NO TRANSACTIONS
exports.config = { transaction: false };

exports.up = async function (knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS public.sub_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      main_category_id uuid NOT NULL,
      name varchar(255) NOT NULL,
      is_active boolean DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT sub_categories_unique UNIQUE (main_category_id, name),
      CONSTRAINT sub_categories_main_fk
        FOREIGN KEY (main_category_id)
        REFERENCES public.main_categories(id)
        ON DELETE CASCADE
    );
  `);
};

exports.down = async function (knex) {
  await knex.raw(`DROP TABLE IF EXISTS public.sub_categories`);
};
