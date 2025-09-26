const Conversation = require("../models/Conversation");
const Product = require("../models/Product");

exports.getSellerStats = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Ensure logged-in user is requesting their own stats
    if (req.user._id.toString() !== sellerId) {
      return res.status(403).json({ message: "Forbidden: You can only view your own stats." });
    }

    // Count conversations where seller is a participant
    const totalConversations = await Conversation.countDocuments({ participants: sellerId });

    // ✅ FIX: Count only real products, excluding lead placeholders
    const totalProducts = await Product.countDocuments({ sellerId, isLeadPlaceholder: { $ne: true } });
    
    // ✅ NEW: Count only the accepted leads (placeholder products)
    const totalAcceptedLeads = await Product.countDocuments({ sellerId, isLeadPlaceholder: true });

    // Count total messages across all conversations of this seller
    const conversations = await Conversation.find({ participants: sellerId }).populate("messages");
    let totalMessages = 0;
    conversations.forEach(conv => {
      totalMessages += conv.messages.length;
    });

    res.status(200).json({
      totalProducts,
      totalConversations,
      totalMessages,
      totalAcceptedLeads, // ✅ NEW: Send the new count to the frontend
    });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({ message: "Server Error" });
  }
};