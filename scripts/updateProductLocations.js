// backend/scripts/updateProductLocations.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

// ✅ FIXED: Correct path to the .env file from the script's location
dotenv.config({ path: '../.env' });

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in .env file. Make sure the path is correct.');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for script...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const cleanProductLocations = async () => {
    await connectDB();
    try {
        console.log('Starting product cleanup...');
        
        // Use $unset to completely remove the 'location' field from all product documents.
        const result = await Product.updateMany(
            { location: { $exists: true } }, // Find all products that have the old 'location' field
            { $unset: { location: "" } }      // Remove the 'location' field
        );

        console.log(`Cleanup complete. ${result.modifiedCount} products were updated.`);
        console.log('The static location field has been removed from all products. Locations will now be sourced dynamically from the seller\'s profile.');

    } catch (error) {
        console.error('Error during product cleanup:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

cleanProductLocations();