// backend/models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  // ✅ This array is crucial for linking messages to the conversation
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: []
  }]
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;