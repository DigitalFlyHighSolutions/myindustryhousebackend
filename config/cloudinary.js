// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials from the .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ NEW: Storage engine specifically for PRODUCT IMAGES
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'industry-house/products',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

// ✅ NEW: Storage engine specifically for SELLER DOCUMENTS
const sellerDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // This function runs for each file, allowing dynamic folder creation
    let folder;
    if (file.fieldname === 'companyLogo') {
      folder = 'logos';
    } else {
      // Catches gstCertificate, panCard, etc.
      folder = 'documents';
    }
    return {
      folder: `industry-house/sellers/${req.user._id}/${folder}`, // Organizes files by seller ID and type
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'] // Allows PDFs for documents
    };
  }
});

// ✅ NEW: Create separate multer instances for each storage configuration
const productUpload = multer({ storage: productStorage });
const sellerUpload = multer({ storage: sellerDocumentStorage });

// ✅ CHANGED: Export the new, specific uploaders
module.exports = {
    cloudinary,
    productUpload,
    sellerUpload
};
