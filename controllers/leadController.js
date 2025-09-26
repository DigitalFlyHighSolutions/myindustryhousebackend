// backend/controllers/leadController.js
const Requirement = require('../models/Requirement');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Product = require('../models/Product');

exports.buyLead = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const { requirementId, message, productName } = req.body;

        const requirement = await Requirement.findById(requirementId);
        if (!requirement) {
            return res.status(404).json({ message: 'Requirement not found.' });
        }
        
        if (requirement.contactedSellers.includes(sellerId)) {
            return res.status(409).json({ message: 'You have already contacted this buyer for this requirement.' });
        }

        const buyerId = requirement.buyerId;

        let product = await Product.findOne({ name: productName, sellerId: sellerId, isLeadPlaceholder: true });
        if (!product) {
             product = new Product({
                name: `Inquiry for "${productName}"`,
                description: `This is a placeholder product for a lead regarding the requirement: ${requirement.details}`,
                category: 'Lead',
                brand: req.user.name,
                sellerId: sellerId,
                status: 'draft',
                stockQuantity: 0,
                isLeadPlaceholder: true // ✅ ADDED: Set the placeholder flag
            });
            await product.save();
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [sellerId, buyerId] },
            product: product._id
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [sellerId, buyerId],
                product: product._id,
            });
        }

        const newMessage = new Message({
            conversationId: conversation._id,
            sender: sellerId,
            recipient: buyerId,
            message: message,
        });

        conversation.messages.push(newMessage._id);
        
        requirement.contactedSellers.push(sellerId);

        await Promise.all([newMessage.save(), conversation.save(), requirement.save()]);

        const { io, userSockets } = req;
        const recipientSocketId = userSockets[buyerId.toString()];
        if (recipientSocketId) {
            const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name');
            io.to(recipientSocketId).emit('receive_message', populatedMessage);
        }

        res.status(200).json({ message: 'Lead purchased and message sent successfully!', conversationId: conversation._id });

    } catch (error) {
        console.error('Error buying lead:', error);
        res.status(500).json({ message: 'Server error while processing the lead.' });
    }
};