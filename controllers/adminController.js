// backend/controllers/adminController.js
const SellerProfile = require('../models/SellerProfile');
const User = require('../models/User');
const Product = require('../models/Product');
const Requirement = require('../models/Requirement');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { cloudinary } = require('../config/cloudinary');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalSellers = await User.countDocuments({ role: 'seller' });
        const totalBuyers = await User.countDocuments({ role: 'buyer' });
        const totalProducts = await Product.countDocuments();
        const pendingProducts = await Product.countDocuments({ status: 'draft' });
        const pendingGst = await SellerProfile.countDocuments({ gstVerified: false });

        // Placeholders until transaction/order models are created
        const totalTransactions = 0;
        const totalRevenue = 0;

        res.status(200).json({
            totalUsers,
            totalSellers,
            totalBuyers,
            totalProducts,
            pendingProducts,
            pendingGst,
            totalTransactions,
            totalRevenue
        });
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').lean();
        const sanitizedUsers = users.map(user => ({
            _id: user._id,
            name: user.name || 'N/A',
            email: user.email || 'N/A',
            role: user.role || 'buyer',
            status: user.status || 'active',
            onboardingComplete: user.onboardingComplete === true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
        res.status(200).json(sanitizedUsers);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Server Error while fetching users.' });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('sellerId', 'name').lean();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateProductStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const { status } = req.body;
        if (!['draft', 'published'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }
        const product = await Product.findByIdAndUpdate(productId, { status }, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product status updated.', product });
    } catch (error) {
        console.error('Error updating product status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.adminDeleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        if (product.image?.public_id) {
            await cloudinary.uploader.destroy(product.image.public_id);
        }
        await Product.findByIdAndDelete(productId);
        res.status(200).json({ message: 'Product deleted successfully by admin.' });
    } catch (error) {
        console.error('Admin delete product error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getPendingGstSellers = async (req, res) => {
    try {
        const pendingSellers = await SellerProfile.find({ gstVerified: false })
            .populate('userId', 'name email')
            .lean();
        res.status(200).json(pendingSellers);
    } catch (error) {
        console.error('Error fetching pending GST sellers:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.verifyGst = async (req, res) => {
    try {
        const { sellerProfileId } = req.params;
        const { gstVerified } = req.body;
        const profile = await SellerProfile.findById(sellerProfileId);
        if (!profile) {
            return res.status(404).json({ message: 'Seller profile not found.' });
        }
        profile.gstVerified = gstVerified;
        await profile.save();
        res.status(200).json({
            message: `Seller GST status updated to ${profile.gstVerified ? 'Verified' : 'Not Verified'}.`,
            profile
        });
    } catch (error) {
        console.error('Error verifying GST:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getDuplicateGst = async (req, res) => {
    try {
        const duplicates = await SellerProfile.aggregate([
            { $group: { _id: '$gstNumber', count: { $sum: 1 }, userIds: { $push: '$userId' } } },
            { $match: { count: { $gt: 1 } } }
        ]);
        const detailedDuplicates = await Promise.all(duplicates.map(async (group) => {
            const users = await User.find({ '_id': { $in: group.userIds } }).select('email status name').lean();
            const profiles = await SellerProfile.find({ 'userId': { $in: group.userIds } }).select('companyName userId').lean();
            return { _id: group._id, count: group.count, users: users, profiles: profiles };
        }));
        res.status(200).json(detailedDuplicates);
    } catch (error) {
        console.error('Error fetching duplicate GST records:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        user.status = user.status === 'active' ? 'suspended' : 'active';
        await user.save();

        if (user.status === 'suspended') {
            const { io, userSockets } = req;
            const recipientSocketId = userSockets[userId];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('force_logout', {
                    reason: 'Your account has been suspended by an administrator.'
                });
            }
        }

        res.status(200).json({ message: `User status updated to ${user.status}.`, user });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.role === 'seller') {
            await SellerProfile.deleteOne({ userId: userId });
        }
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User and associated data deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllRequirements = async (req, res) => {
    try {
        const requirements = await Requirement.find({})
            .populate('buyerId', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(requirements);
    } catch (error) {
        console.error('Error fetching all requirements:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAcceptedRequirements = async (req, res) => {
    try {
        const requirements = await Requirement.find({ 'contactedSellers.0': { $exists: true } })
            .populate('buyerId', 'name email')
            .populate('contactedSellers', 'name email')
            .sort({ updatedAt: -1 });
        res.status(200).json(requirements);
    } catch (error) {
        console.error('Error fetching accepted requirements:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({})
            .populate('participants', 'name role') // Ensure role is populated here too
            .populate('product', 'name')
            .sort({ updatedAt: -1 });
        res.status(200).json(conversations);
    } catch (error) {
        console.error('Error fetching all conversations for admin:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getConversationDetailsForAdmin = async (req, res) => {
    try {
        const { convoId } = req.params;
        const conversation = await Conversation.findById(convoId)
            .populate({
                path: 'messages',
                populate: { 
                    path: 'sender', 
                    // MODIFICATION: Fetch the sender's role for the admin view
                    select: 'name role' 
                },
                options: { sort: { createdAt: 1 } }
            });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }
        
        res.status(200).json(conversation.messages);
    } catch (err) {
        console.error("Error fetching admin conversation details:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};
