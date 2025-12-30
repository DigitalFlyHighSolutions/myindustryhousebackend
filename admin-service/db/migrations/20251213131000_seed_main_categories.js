// admin-service/db/migrations/20251213131000_seed_main_categories.js

// 🔴 CRITICAL FIX
exports.config = { transaction: false };

const MAIN_CATEGORIES = [
  'Industrial Plants & Machinery',
  'Gems, Jewelry & Astrology',
  'Apparel & Garments',
  'Building & Construction',
  'Cosmetics & Personal Care',
  'Lab Instruments & Supplies',
  'Drugs & Pharmaceuticals',
  'Mechanical Parts & Spares',
  'Packaging Machines & Goods',
  'Chemicals, Dyes & Solvents',
  'Electrical Equipment',
  'Metals, Alloys & Minerals',
  'Agriculture & Farming',
  'Handicrafts & Decoratives',
  'Security, Safety System & Service',
  'Home Textile & Furnishing',
  'Bags, Belts & Wallets',
  'Paper & Paper Products',
  'Marble, Granite & Stones',
  'Food & Beverages',
  'Kitchen Utensils & Appliances',
  'Textiles, Yarn & Fabrics',
  'Industrial Supplies',
  'Medical & Healthcare',
  'Electronics Supplies',
  'Business & Audit Services',
  'Hospital, Clinic and Consultation',
  'Stationery & Office Supplies',
  'Herbal & Ayurvedic Product',
  'Hand, Power & Machine Tools',
  'IT & Telecom Services',
  'Electronics & Electrical',
  'Housewares & Supplies',
  'Fashion Accessories & Gear',
  'Computer & IT Solutions',
  'Furniture & Supplies',
  'Transportation & Logistics'
];

exports.up = async function (knex) {
  await knex('main_categories')
    .insert(
      MAIN_CATEGORIES.map((name) => ({
        name: name.trim(),
        is_active: true,
      }))
    )
    .onConflict('name')
    .ignore();
};

exports.down = async function (knex) {
  await knex('main_categories')
    .whereIn('name', MAIN_CATEGORIES)
    .del();
};