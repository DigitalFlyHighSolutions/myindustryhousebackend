  // server.js
  const express = require('express');
  const productController = require('./controllers/productController');
  const upload = require('./middlewares/s3Upload');
  const db = require('./db');

  const app = express();
  const port = 5002;

  app.use(express.json());

  // ----------------------
  // Request logger
  // ----------------------
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // UUID pattern
  const UUID_PATTERN =
    '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

  // ----------------------
  // Public routes
  // ----------------------
  app.get('/categories/main', productController.getMainCategories);
  app.get('/category/main', productController.getMainCategories);

  app.get('/products', productController.getAllPublicProducts);
  app.get('/products/main-category/:mainCategoryId', productController.getPublicProductsByMainCategory);

  app.get('/products/stats', productController.getProductStats);
  app.get(`/products/:productId(${UUID_PATTERN})`, productController.getPublicProductById);

  // ----------------------
  // Seller routes
  // ----------------------
  app.get('/seller/products/stats', productController.getSellerProductStats);
  app.get('/seller/products', productController.getProductsBySeller);
  app.get('/seller/products/main-category/:mainCategoryId', productController.getSellerProductsByMainCategory);

  app.post('/products', productController.createProduct);

  // ✅ S3 IMAGE UPLOAD (THIS IS CORRECT)
  app.post(
    '/products/upload-image',
    upload.single('image'),
    productController.uploadProductImage
  );

  // Update / Delete
  app.put(`/products/:productId(${UUID_PATTERN})`, productController.updateProduct);
  app.delete(`/products/:productId(${UUID_PATTERN})`, productController.deleteProduct);

  // ----------------------
  // 🔴 REQUIRED: Global error handler (DO NOT SKIP)
  // ----------------------
  app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR]', err);

    if (err.name === 'MulterError') {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({
      message: err.message || 'Internal Server Error',
    });
  });

  // ----------------------
  // Start service
  // ----------------------
  db.migrate.latest()
    .then(() => {
      console.log('Migrations are up to date');
      app.listen(port, () => {
        console.log(`✅ Product service listening at http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error('❌ Error running migrations', err);
      process.exit(1);
    });
