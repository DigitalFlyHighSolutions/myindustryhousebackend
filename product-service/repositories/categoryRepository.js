// product-service/repositories/categoryRepository.js
const axios = require('axios');

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://admin-service:5004';

// 🟢 Fetch all main categories from admin-service
async function getAllMainCategories() {
  try {
    const response = await axios.get(`${ADMIN_SERVICE_URL}/admin/categories/main-categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching main categories from admin-service:', error.message);
    // Be tolerant: return empty array when admin-service is unreachable.
    // Controller will treat missing category as invalid input instead of 500.
    return [];
  }
}

// 🟢 Fetch a single main category by ID (using list endpoint)
async function getMainCategoryById(mainCategoryId) {
  const categories = await getAllMainCategories();
  if (!Array.isArray(categories)) return null;
  return categories.find((c) => String(c.id) === String(mainCategoryId)) || null;
}

module.exports = {
  getAllMainCategories,
  getMainCategoryById,
};
