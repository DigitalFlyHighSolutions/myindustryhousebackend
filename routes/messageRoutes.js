// backend/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const {
    getConversations,
    getConversationDetail,
    postMessage
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

// All messaging routes are protected
router.use(verifyToken);

router.get('/conversations/:userId', getConversations);
router.get('/conversations/detail/:convoId', getConversationDetail);
router.post('/messages', postMessage);

module.exports = router;