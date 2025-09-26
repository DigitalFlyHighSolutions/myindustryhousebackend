// backend/controllers/productController.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const SellerProfile = require('../models/SellerProfile');
const { cloudinary } = require('../config/cloudinary');

// --- (keep the existing populateAndFormatProducts and findOrCreateCategory functions) ---
const populateAndFormatProducts = async (products) => {
    if (!Array.isArray(products)) {
        products = [products];
    }

    const formattedProducts = await Promise.all(products.map(async (p) => {
        const product = p.toObject ? p.toObject() : p;

        if (product.sellerId) {
            let sellerProfile;
            const sellerIdValue = product.sellerId._id || product.sellerId;

            if (product.sellerId.sellerProfile) {
                sellerProfile = product.sellerId.sellerProfile;
            } else {
                sellerProfile = await SellerProfile.findOne({ userId: sellerIdValue }).lean();
            }

            if (sellerProfile && sellerProfile.city) {
                product.verified = sellerProfile.gstVerified || false;
                product.location = `${sellerProfile.city}, ${sellerProfile.state}`;
            } else {
                product.location = 'Location not available';
            }
            
            product.sellerId = sellerIdValue;
        } else {
            product.location = 'Location not available';
        }
        return product;
    }));

    return formattedProducts;
};

const findOrCreateCategory = async (categoryName) => {
    if (!categoryName || typeof categoryName !== 'string') return null;
    const standardizedName = categoryName
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    try {
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${standardizedName}$`, 'i') } });
        if (existingCategory) {
            return existingCategory.name;
        } else {
            const newCategory = new Category({ name: standardizedName });
            await newCategory.save();
            return newCategory.name;
        }
    } catch (err) {
        console.error("Error finding or creating category:", err);
        return standardizedName;
    }
};


// --- (keep the existing getPublicProductById function) ---
exports.getPublicProductById = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId).populate({
            path: 'sellerId',
            select: 'sellerProfile',
            populate: { path: 'sellerProfile', select: 'gstVerified city state' }
        });
        if (!product || product.status !== 'published') {
            return res.status(404).json({ message: 'Product not found or not available.' });
        }
        const formattedProducts = await populateAndFormatProducts(product);
        res.status(200).json(formattedProducts[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};


exports.getProductsBySeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        if (!req.user || req.user._id !== sellerId) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own products.' });
        }
        const sellerProducts = await Product.find({ sellerId, isLeadPlaceholder: { $ne: true } }).populate({
            path: 'sellerId',
            populate: { path: 'sellerProfile', select: 'city state gstVerified' }
        });
        res.status(200).json(await populateAndFormatProducts(sellerProducts));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ✅ NEW: Function to get only the placeholder products (accepted leads) for a seller
exports.getAcceptedLeads = async (req, res) => {
    try {
        const { sellerId } = req.params;
        if (!req.user || req.user._id !== sellerId) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own leads.' });
        }
        const acceptedLeads = await Product.find({ sellerId, isLeadPlaceholder: true })
            .sort({ createdAt: -1 });
        res.status(200).json(acceptedLeads);
    } catch (err) {
        console.error('Error fetching accepted leads:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// --- (keep the rest of the file: getPublicProductsBySeller, getAllPublicProducts, createProduct, updateProduct, deleteProduct, getCategories) ---
exports.getPublicProductsBySeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const sellerProducts = await Product.find({ sellerId, status: 'published', isLeadPlaceholder: { $ne: true } }).populate({
            path: 'sellerId',
            populate: { path: 'sellerProfile', select: 'city state gstVerified' }
        });
        res.status(200).json(await populateAndFormatProducts(sellerProducts));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllPublicProducts = async (req, res) => {
    try {
        const allProducts = await Product.find({ status: 'published', isLeadPlaceholder: { $ne: true } }).populate({
            path: 'sellerId',
            model: 'User',
            populate: { path: 'sellerProfile', model: 'SellerProfile', select: 'gstVerified city state' }
        });
        res.status(200).json(await populateAndFormatProducts(allProducts));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Product image is required.' });
        const sellerProfile = await SellerProfile.findOne({ userId: req.user._id });
        if (!sellerProfile) return res.status(404).json({ message: 'Seller profile not found. Cannot add product.' });
        
        const standardizedCategory = await findOrCreateCategory(req.body.category);

        const newProduct = new Product({ 
            ...req.body, 
            category: standardizedCategory,
            brand: sellerProfile.companyName, 
            sellerId: req.user._id, 
            image: { url: req.file.path, public_id: req.file.filename } 
        });

        await newProduct.save();

        const populatedProduct = await Product.findById(newProduct._id).populate({
            path: 'sellerId',
            populate: { path: 'sellerProfile', select: 'city state gstVerified' }
        });

        const formattedProducts = await populateAndFormatProducts(populatedProduct);
        
        res.status(201).json(formattedProducts[0]);

    } catch (err) {
        console.error('Error creating product:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.sellerId.toString() !== req.user._id) return res.status(403).json({ message: 'Forbidden: You can only edit your own products.' });

        const updatedData = { ...req.body };
        
        if (req.body.category) {
            updatedData.category = await findOrCreateCategory(req.body.category);
        }

        if (req.file) {
            if (product.image && product.image.public_id) {
                await cloudinary.uploader.destroy(product.image.public_id);
            }
            updatedData.image = { url: req.file.path, public_id: req.file.filename };
        } else {
            delete updatedData.image;
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });
        res.status(200).json(updatedProduct);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.sellerId.toString() !== req.user._id) return res.status(403).json({ message: 'Forbidden: You can only delete your own products.' });
        if (product.image?.public_id) await cloudinary.uploader.destroy(product.image.public_id);
        await Product.findByIdAndDelete(productId);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json(categories.map(c => c.name));
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};