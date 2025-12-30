// product-service/repositories/productRepository.js
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  // ==================================================
  // PUBLIC
  // ==================================================

  findPublicProducts: async () => {
    return db('products')
      .where({ status: 'published' })
      .select('*');
  },

  findPublicProductsByMainCategory: async (mainCategoryId) => {
    return db('products')
      .where('status', 'published')
      .andWhere('mainCategoryId', mainCategoryId)
      .select('*');
  },

  findPublicProductById: async (productId) => {
    return db('products')
      .where({ id: productId, status: 'published' })
      .first();
  },

  // ==================================================
  // SELLER
  // ==================================================

  findProductsBySellerId: async (sellerId) => {
    return db('products')
      .where('seller_id', sellerId)
      .select('*');
  },

  findProductsBySellerIdAndMainCategory: async (sellerId, mainCategoryId) => {
    return db('products')
      .where('seller_id', sellerId)
      .andWhere('mainCategoryId', mainCategoryId)
      .select('*');
  },

  findProductById: async (productId) => {
    return db('products')
      .where({ id: productId })
      .first();
  },

  // ==================================================
  // CREATE
  // ==================================================

  create: async (payload) => {
    const [row] = await db('products')
      .insert({
        // 🔐 PK guarantee
        id: payload.id || uuidv4(),
        seller_id: payload.sellerId,

        name: payload.name,
        description: payload.description,
        brand: payload.brand,

        // ✅ PRICE & UNIT (FIX)
        price: payload.price,
        unit: payload.unit,

        status: payload.status ?? 'published',
        is_public: payload.isPublic ?? true,

        stock_quantity: payload.stockQuantity ?? 0,

        mainCategoryId: payload.mainCategoryId,
        subCategory: payload.subCategory,

        // ✅ jsonb safe
        image: JSON.stringify(payload.image || []),
      })
      .returning('*');

    return [row];
  },

  // ==================================================
  // UPDATE
  // ==================================================

  update: async (productId, payload) => {
    const updatePayload = {};

    if (payload.name !== undefined) updatePayload.name = payload.name;
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.brand !== undefined) updatePayload.brand = payload.brand;

    // ✅ PRICE & UNIT (FIX)
    if (payload.price !== undefined) updatePayload.price = payload.price;
    if (payload.unit !== undefined) updatePayload.unit = payload.unit;

    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.isPublic !== undefined) updatePayload.is_public = payload.isPublic;

    if (payload.stockQuantity !== undefined)
      updatePayload.stock_quantity = payload.stockQuantity;

    if (payload.mainCategoryId !== undefined)
      updatePayload.mainCategoryId = payload.mainCategoryId;

    if (payload.subCategory !== undefined)
      updatePayload.subCategory = payload.subCategory;

    if (payload.image !== undefined)
      updatePayload.image = JSON.stringify(payload.image || []);

    const [row] = await db('products')
      .where({ id: productId })
      .update(updatePayload)
      .returning('*');

    return [row];
  },

  // ==================================================
  // DELETE
  // ==================================================

  remove: async (productId) => {
    return db('products')
      .where({ id: productId })
      .del();
  },

  // ==================================================
  // STATS
  // ==================================================

  countAllPublic: async () => {
    const row = await db('products')
      .where({ status: 'published' })
      .count('id as count')
      .first();

    return Number(row.count) || 0;
  },

  countByStatus: async () => {
    const rows = await db('products')
      .select('status')
      .count('id as count')
      .groupBy('status');

    return rows.reduce((acc, r) => {
      acc[r.status] = Number(r.count);
      return acc;
    }, {});
  },

  countLowStock: async (threshold = 5) => {
    const row = await db('products')
      .where('stock_quantity', '<=', threshold)
      .count('id as count')
      .first();

    return Number(row.count) || 0;
  },

  countByBrand: async (limit = 10) => {
    const rows = await db('products')
      .select('brand')
      .count('id as count')
      .groupBy('brand')
      .orderBy('count', 'desc')
      .limit(limit);

    return rows.map(r => ({
      brand: r.brand,
      count: Number(r.count),
    }));
  },

  countByCategory: async (limit = 10) => {
    const rows = await db('products')
      .select('mainCategoryId')
      .count('id as count')
      .groupBy('mainCategoryId')
      .orderBy('count', 'desc')
      .limit(limit);

    return rows.map(r => ({
      mainCategoryId: r.mainCategoryId,
      count: Number(r.count),
    }));
  },

  countBySeller: async (sellerId) => {
    const total = await db('products')
      .where('seller_id', sellerId)
      .count('id as count')
      .first();

    const lowStock = await db('products')
      .where('seller_id', sellerId)
      .andWhere('stock_quantity', '<=', 5)
      .count('id as count')
      .first();

    const byStatusRows = await db('products')
      .where('seller_id', sellerId)
      .select('status')
      .count('id as count')
      .groupBy('status');

    return {
      total: Number(total.count) || 0,
      lowStock: Number(lowStock.count) || 0,
      byStatus: byStatusRows.reduce((acc, r) => {
        acc[r.status] = Number(r.count);
        return acc;
      }, {}),
    };
  },
};
