const axios = require('axios');
const productRepository = require('../repositories/productRepository');
const categoryRepo = require('../repositories/categoryRepository');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:5006';

/* ===========================================================
   Helpers
=========================================================== */
async function fetchUserById(userId) {
  if (!userId) return null;

  try {
    const resp = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
    return resp.data;
  } catch {
    try {
      const resp = await axios.get(`http://localhost:5006/users/${userId}`);
      return resp.data;
    } catch (err) {
      console.error('fetchUserById error:', err.message);
      return null;
    }
  }
}

async function isSellerUser(userId, roleHeader) {
  if (roleHeader) return roleHeader.toLowerCase() === 'seller';
  const user = await fetchUserById(userId);
  return user?.role === 'seller';
}

/* ===========================================================
   PUBLIC — PRODUCTS
=========================================================== */
exports.getAllPublicProducts = async (req, res) => {
  try {
    const products = await productRepository.findPublicProducts();
    res.json(products);
  } catch (err) {
    console.error('getAllPublicProducts:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPublicProductsByMainCategory = async (req, res) => {
  try {
    const { mainCategoryId } = req.params;
    if (!mainCategoryId)
      return res.status(400).json({ message: 'mainCategoryId is required' });

    const mainCat = await categoryRepo.getMainCategoryById(mainCategoryId);
    if (!mainCat)
      return res.status(400).json({ message: 'Invalid mainCategoryId' });

    const products = await productRepository.findPublicProductsByMainCategory(mainCategoryId);
    res.json(products);
  } catch (err) {
    console.error('getPublicProductsByMainCategory:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPublicProductById = async (req, res) => {
  try {
    const product = await productRepository.findPublicProductById(req.params.productId);
    if (!product)
      return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('getPublicProductById:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ===========================================================
   PUBLIC — CATEGORIES
=========================================================== */
exports.getMainCategories = async (req, res) => {
  try {
    const categories = await categoryRepo.getAllMainCategories();
    res.json(categories);
  } catch (err) {
    console.error('getMainCategories:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ===========================================================
   SELLER — PRODUCTS
=========================================================== */
exports.getProductsBySeller = async (req, res) => {
  try {
    const sellerId = req.headers['x-user-id'];
    if (!sellerId)
      return res.status(401).json({ message: 'Missing X-User-ID header' });

    const products = await productRepository.findProductsBySellerId(sellerId);
    res.json(products);
  } catch (err) {
    console.error('getProductsBySeller:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getSellerProductsByMainCategory = async (req, res) => {
  try {
    const sellerId = req.headers['x-user-id'];
    const { mainCategoryId } = req.params;

    if (!sellerId)
      return res.status(401).json({ message: 'Missing X-User-ID header' });

    const mainCat = await categoryRepo.getMainCategoryById(mainCategoryId);
    if (!mainCat)
      return res.status(400).json({ message: 'Invalid mainCategoryId' });

    const products =
      await productRepository.findProductsBySellerIdAndMainCategory(
        sellerId,
        mainCategoryId
      );

    res.json(products);
  } catch (err) {
    console.error('getSellerProductsByMainCategory:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ===========================================================
   CREATE PRODUCT
=========================================================== */
exports.createProduct = async (req, res) => {
  try {
    const sellerId = req.headers['x-user-id'];
    const roleHeader = req.headers['x-user-role'];

    if (!sellerId)
      return res.status(401).json({ message: 'Missing X-User-ID header' });

    const isSeller = await isSellerUser(sellerId, roleHeader);
    if (!isSeller)
      return res.status(403).json({ message: 'Only sellers can create products' });

    const {
      name,
      description,
      brand,
      price,
      unit,
      stockQuantity,
      status,
      mainCategoryId,
      subCategory,
      image = []
    } = req.body;

    // Better validation: check for empty strings and missing values
    if (!name || !name.trim())
      return res.status(400).json({ message: 'name is required' });
    if (!description || !description.trim())
      return res.status(400).json({ message: 'description is required' });
    if (!brand || !brand.trim())
      return res.status(400).json({ message: 'brand is required' });
    if (!mainCategoryId || !mainCategoryId.trim())
      return res.status(400).json({ message: 'mainCategoryId is required' });
    if (!subCategory || !subCategory.trim())
      return res.status(400).json({ message: 'subCategory is required' });

    const mainCat = await categoryRepo.getMainCategoryById(mainCategoryId);
    if (!mainCat)
      return res.status(400).json({ message: 'Invalid mainCategoryId' });

    const [product] = await productRepository.create({
      name,
      description,
      brand,
      price: price ? parseFloat(price) : null,
      unit,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
      status: status || 'draft',
      businessCategory: mainCat.name,
      mainCategoryId,
      subCategory,
      image,
      sellerId
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('createProduct error:', err);
    // Return actual error message in development, generic message in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Server Error' 
      : err.message || 'Server Error';
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }
};

/* ===========================================================
   IMAGE UPLOAD (S3)
=========================================================== */
exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: 'No file uploaded' });

    res.status(201).json({
      url: req.file.location
    });
  } catch (err) {
    console.error('uploadProductImage:', err);
    res.status(500).json({ message: 'Image upload failed' });
  }
};

/* ===========================================================
   UPDATE PRODUCT
=========================================================== */
exports.updateProduct = async (req, res) => {
  try {
    const sellerId = req.headers['x-user-id'];
    const roleHeader = req.headers['x-user-role'];

    if (!sellerId)
      return res.status(401).json({ message: 'Missing X-User-ID header' });

    const isSeller = await isSellerUser(sellerId, roleHeader);
    if (!isSeller)
      return res.status(403).json({ message: 'Only sellers can update products' });

    const productId = req.params.productId;
    const existing = await productRepository.findProductById(productId);

    if (!existing)
      return res.status(404).json({ message: 'Product not found' });

    if (existing.seller_id !== sellerId)
      return res.status(403).json({ message: 'Not your product' });


    const {
      name,
      description,
      price,
      unit,
      stockQuantity,
      status,
      mainCategoryId,
      subCategory,
      image
    } = req.body;

    let businessCategory;
    if (mainCategoryId) {
      const mainCat = await categoryRepo.getMainCategoryById(mainCategoryId);
      if (!mainCat)
        return res.status(400).json({ message: 'Invalid mainCategoryId' });
      businessCategory = mainCat.name;
    }

    const [updated] = await productRepository.update(productId, {
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      unit,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : undefined,
      status,
      businessCategory,
      mainCategoryId,
      subCategory,
      image
    });

    res.json(updated);
  } catch (err) {
    console.error('updateProduct:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ===========================================================
   DELETE PRODUCT
=========================================================== */
exports.deleteProduct = async (req, res) => {
  try {
    const sellerId = req.headers['x-user-id'];
    const productId = req.params.productId;

    if (!sellerId)
      return res.status(401).json({ message: 'Missing X-User-ID header' });

    const product = await productRepository.findProductById(productId);
    if (!product)
      return res.status(404).json({ message: 'Product not found' });

    if (product.seller_id !== sellerId)
      return res.status(403).json({ message: 'Not your product' });

    await productRepository.remove(productId);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('deleteProduct:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ===========================================================
   STATS
=========================================================== */
exports.getProductStats = async (req, res) => {
  try {
    const [
      totalProducts,
      statusCounts,
      lowStockCount,
      byBrand,
      byCategory
    ] = await Promise.all([
      productRepository.countAllPublic(),
      productRepository.countByStatus(),
      productRepository.countLowStock(5),
      productRepository.countByBrand(6),
      productRepository.countByCategory(6)
    ]);

    res.json({
      totalProducts,
      statusCounts,
      lowStockCount,
      byBrand,
      byCategory
    });
  } catch (err) {
    console.error('getProductStats:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getSellerProductStats = async (req, res) => {
  try {
    const sellerId = req.headers['x-user-id'];
    if (!sellerId)
      return res.status(401).json({ message: 'Missing X-User-ID header' });

    const stats = await productRepository.countBySeller(sellerId);
    res.json(stats);
  } catch (err) {
    console.error('getSellerProductStats:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
