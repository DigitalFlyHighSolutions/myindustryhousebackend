// backend/importData.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('./models/Product');
const User = require('./models/User');

// Correctly resolve the path to the products.js file
const productsData = require(path.join(__dirname, '..', 'src', 'data', 'products.js')).default;

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully!');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();
        
        console.log('Clearing old product data...');
        await Product.deleteMany();

        console.log('Fetching user data to get seller IDs...');
        const users = await User.find({ 'role': 'seller' });

        if (users.length === 0) {
            console.error('No seller users found. Please create some sellers first by registering with the "seller" role.');
            return;
        }

        const newProducts = productsData.map(product => {
            const user = users.find(u => u.name.toLowerCase().includes(product.brand.toLowerCase()));
            if (!user) {
                console.warn(`Could not find a matching user for brand: ${product.brand}. Skipping product: ${product.name}`);
                return null;
            }
            // ✅ MODIFIED: Destructure the product to remove the now-obsolete location field
            const { location, ...restOfProduct } = product;
            return {
                ...restOfProduct,
                sellerId: user._id,
            };
        }).filter(Boolean);

        if (newProducts.length > 0) {
            console.log(`Importing ${newProducts.length} products...`);
            await Product.insertMany(newProducts);
            console.log('Product data imported successfully!');
        } else {
            console.log('No new products to import.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error importing data:', error);
        mongoose.connection.close();
    }
};

importData();
