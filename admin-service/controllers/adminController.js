const axios = require('axios');
const adminRepository = require('../repositories/adminRepository');
const knex = require('../db');

// URL of User Service
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || 'http://user-service:5006';

// ===========================================================
// 🔐 Helper: Verify Admin from User Service
// ===========================================================
async function verifyAdmin(userId) {
  if (!userId) return false;
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
    return response.data?.role === 'admin';
  } catch (error) {
    console.error('verifyAdmin error:', error.message);
    return false;
  }
}

// ===========================================================
// 📊 ADMIN DASHBOARD
// ===========================================================
async function getAdminDashboard(req, res) {
  try {
    const stats = await adminRepository.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}

// ===========================================================
// 🗂️ MAIN CATEGORIES (Admin only)
// ===========================================================

// Create main category
async function createMainCategory(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    if (!(await verifyAdmin(userId))) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const exists = await knex('main_categories')
      .whereILike('name', name.trim())
      .first();

    if (exists) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const [category] = await knex('main_categories')
      .insert({
        name: name.trim(),
        is_active: true
      })
      .returning('*');

    res.status(201).json(category);
  } catch (error) {
    console.error('createMainCategory error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}

// Get all main categories
async function getMainCategories(req, res) {
  try {
    const categories = await knex('main_categories')
      .where({ is_active: true })
      .orderBy('name', 'asc');

    res.json(categories);
  } catch (error) {
    console.error('getMainCategories error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}

// Toggle main category status
async function toggleMainCategoryStatus(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    if (!(await verifyAdmin(userId))) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res
        .status(400)
        .json({ message: 'isActive must be boolean' });
    }

    const [updated] = await knex('main_categories')
      .where({ id })
      .update({
        is_active: isActive,
        updated_at: new Date()
      })
      .returning('*');

    if (!updated) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('toggleMainCategoryStatus error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}

// Delete main category
async function deleteMainCategory(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    if (!(await verifyAdmin(userId))) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { id } = req.params;
    const deleted = await knex('main_categories').where({ id }).del();

    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Main category deleted successfully' });
  } catch (error) {
    console.error('deleteMainCategory error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}

// ===========================================================
// 🧩 SUB-CATEGORIES (Public + Admin add-on-the-fly)
// ===========================================================

// Get sub-categories for a main category (dropdown)
async function getSubCategoriesByMainCategory(req, res) {
  try {
    const { id } = req.params;

    const subCategories = await knex('sub_categories')
      .select('id', 'name')
      .where({
        main_category_id: id,
        is_active: true
      })
      .orderBy('name', 'asc');

    res.json(subCategories);
  } catch (error) {
    console.error('getSubCategoriesByMainCategory error:', error);
    res.status(500).json({ message: 'Failed to fetch sub-categories' });
  }
}

// Create sub-category (add if not exists, return immediately)
async function createSubCategory(req, res) {
  try {
    const { id } = req.params; // main_category_id
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Sub-category name required' });
    }

    const [created] = await knex('sub_categories')
      .insert({
        main_category_id: id,
        name: name.trim(),
        is_active: true
      })
      .onConflict(['main_category_id', 'name'])
      .ignore()
      .returning(['id', 'name']);

    // Newly created
    if (created) {
      return res.status(201).json(created);
    }

    // Already exists → return existing
    const existing = await knex('sub_categories')
      .where({
        main_category_id: id,
        name: name.trim()
      })
      .first(['id', 'name']);

    return res.status(200).json(existing);
  } catch (error) {
    console.error('createSubCategory error:', error);
    res.status(500).json({ message: 'Failed to create sub-category' });
  }
}

// ===========================================================
// 📤 EXPORTS
// ===========================================================
module.exports = {
  getAdminDashboard,

  // Main categories
  createMainCategory,
  getMainCategories,
  toggleMainCategoryStatus,
  deleteMainCategory,

  // Sub-categories
  getSubCategoriesByMainCategory,
  createSubCategory
};
