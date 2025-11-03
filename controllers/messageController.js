// backend/controllers/messageController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = await Conversation.find({ participants: userId })
            .populate('participants', 'name')
            .populate('product', 'name')
            .populate({
                path: 'messages',
                options: { sort: { createdAt: -1 }, limit: 1 }
            })
            .sort({ updatedAt: -1 });
        
        res.status(200).json(conversations);
    } catch (err) {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getConversationDetail = async (req, res) => {
    try {
        const { convoId } = req.params;
        const conversation = await Conversation.findById(convoId)
            .populate({
                path: 'messages',
                populate: {
                    path: 'sender',
                    select: 'name'
                },
                options: { sort: { createdAt: 1 } }
            });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }
        
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: 'Forbidden: You are not part of this conversation.' });
        }

        res.status(200).json(conversation.messages);
    } catch (err) {
        console.error("Error fetching conversation details:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.postMessage = async (req, res) => {
    try {
        const { sender, recipient, message, product } = req.body;
        
        // ✅ MODIFIED: The query to find a conversation is now more flexible
        const query = { participants: { $all: [sender, recipient] } };
        if (product) {
            query.product = product;
        } else {
            // For seller-to-seller, find a conversation without a product
            query.product = { $exists: false };
        }
        
        let conversation = await Conversation.findOne(query);

        if (!conversation) {
            const conversationData = { participants: [sender, recipient] };
            if (product) {
                conversationData.product = product;
            }
            conversation = new Conversation(conversationData);
        }

        const newMessage = new Message({
            conversationId: conversation._id,
            sender,
            recipient,
            message
        });

        conversation.messages.push(newMessage._id);
        await Promise.all([newMessage.save(), conversation.save()]);

        await newMessage.populate('sender', 'name');

        res.status(201).json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};