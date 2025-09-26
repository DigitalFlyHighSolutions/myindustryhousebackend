// backend/controllers/buyerController.js
const Conversation = require('../models/Conversation');
const Requirement = require('../models/Requirement');
const User = require('../models/User');

exports.getBuyerStats = async (req, res) => {
  try {
    const { buyerId } = req.params;

    if (req.user._id.toString() !== buyerId) {
      return res.status(403).json({ message: "Forbidden: You can only view your own stats." });
    }

    const totalConversations = await Conversation.countDocuments({ participants: buyerId });
    const totalRequirements = await Requirement.countDocuments({ buyerId: buyerId });

    const totalFavorites = 0;

    res.status(200).json({
      totalConversations,
      totalRequirements,
      totalFavorites,
    });
  } catch (error) {
    console.error("Error fetching buyer stats:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ NEW: Function to get a buyer's public-facing profile for sellers
exports.getPublicBuyerProfile = async (req, res) => {
    try {
        const { buyerId } = req.params;
        const buyer = await User.findById(buyerId).select('name email contactNumber createdAt addresses');
        if (!buyer || buyer.role !== 'buyer') {
            return res.status(404).json({ message: 'Buyer not found.' });
        }

        // Get requirements for "Products of Interest"
        const requirements = await Requirement.find({ buyerId: buyerId }).sort({ createdAt: -1 }).limit(10);
        
        // Get stats
        const requirementsTillDate = await Requirement.countDocuments({ buyerId: buyerId });
        const replies = await Conversation.countDocuments({ participants: buyerId });

        // Consolidate addresses (using default or first available)
        const primaryAddress = buyer.addresses.find(a => a.isDefault) || buyer.addresses[0];

        const profileData = {
            _id: buyer._id,
            name: buyer.name,
            contactNumber: buyer.contactNumber,
            email: buyer.email,
            memberSince: buyer.createdAt,
            address: primaryAddress ? primaryAddress.details : 'Not provided',
            productsOfInterest: requirements.map(r => r.productName),
            stats: {
                requirementsTillDate,
                replies
            }
        };

        res.status(200).json(profileData);
    } catch (error) {
        console.error("Error fetching public buyer profile:", error);
        res.status(500).json({ message: "Server Error" });
    }
};