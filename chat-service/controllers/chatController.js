const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper: get user id from KrakenD
 */
const getUserId = (req) =>
  req.headers['x-user-id'] || req.headers['X-User-ID'];

/* =====================================================
   GET ALL CONVERSATIONS FOR LOGGED-IN USER
   ===================================================== */
exports.getConversations = async (req, res) => {
  try {
    const headerUserId = getUserId(req);
    const { userId: paramUserId } = req.params;

    if (!headerUserId) {
      return res.status(401).json({ message: 'Unauthorized: missing header' });
    }

    if (!paramUserId) {
      return res.status(400).json({ message: 'userId param is required' });
    }

    // 🔒 SECURITY: header and param must match
    if (headerUserId !== paramUserId) {
      return res.status(403).json({ message: 'Forbidden: user mismatch' });
    }

  const conversations = await db('conversations')
  .where((qb) => {
    qb.where('buyer_id', headerUserId)
      .orWhere('seller_id', headerUserId);
  })
  .select(
    'id',
    'requirement_id',
    db.raw('requirement_id as lead_id'), // ✅ ADD THIS LINE
    'requirement_name',
    'buyer_id',
    'seller_id',
    'seller_name',
    'created_at',
    'updated_at'
  )
  .orderBy('updated_at', 'desc');


    return res.status(200).json(conversations);
  } catch (err) {
    console.error('[GET CONVERSATIONS ERROR]', err);
    return res.status(500).json({
      message: 'Failed to fetch conversations',
      detail: err.message,
    });
  }
};

/* =====================================================
   GET MESSAGES FOR A CONVERSATION
   ===================================================== */
exports.getConversationDetail = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { convoId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!convoId) {
      return res.status(400).json({ message: 'convoId is required' });
    }

    // 🔒 Ensure user is part of conversation
    const convo = await db('conversations')
      .where({ id: convoId })
      .andWhere((qb) => {
        qb.where('buyer_id', userId)
          .orWhere('seller_id', userId);
      })
      .first();

    if (!convo) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const messages = await db('messages')
      .where({ conversation_id: convoId })
      .orderBy('created_at', 'asc');

    return res.status(200).json(messages);
  } catch (err) {
    console.error('[GET CONVERSATION DETAIL ERROR]', err);
    return res.status(500).json({
      message: 'Server Error fetching conversation details',
      detail: err.message,
    });
  }
};

/* =====================================================
   POST MESSAGE (CREATE / REUSE CONVERSATION)
   ===================================================== */
exports.postMessage = async (req, res) => {
  try {
    const {
      conversationId,
      sender,
      recipient,
      message,
      requirementId,
      requirementName,
      sellerName,
    } = req.body;

    if (!sender || !recipient || !message?.trim()) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    let conversation;

    // ✅ CASE 1: Existing conversation (MOST IMPORTANT)
    if (conversationId) {
      conversation = await db('conversations')
        .where({ id: conversationId })
        .first();

      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
    }

    // ✅ CASE 2: First message (seller → buyer)
    if (!conversation) {
      if (!requirementId || !requirementName) {
        return res.status(400).json({
          message: 'requirementId & requirementName required for new chat',
        });
      }

      conversation = await db('conversations')
        .where({
          requirement_id: requirementId,
          seller_id: sender,
          buyer_id: recipient,
        })
        .first();

      if (!conversation) {
        const id = uuidv4();

        await db('conversations').insert({
          id,
          requirement_id: requirementId,
          requirement_name: requirementName,
          seller_id: sender,
          buyer_id: recipient,
          seller_name: sellerName || 'Seller',
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        });

        conversation = { id };
      }
    }

    const [newMessage] = await db('messages')
      .insert({
        id: uuidv4(),
        conversation_id: conversation.id,
        sender_id: sender,
        recipient_id: recipient,
        message,
        created_at: db.fn.now(),
      })
      .returning('*');

    await db('conversations')
      .where({ id: conversation.id })
      .update({ updated_at: db.fn.now() });

    return res.status(201).json({
      conversationId: conversation.id,
      message: newMessage,
    });
  } catch (err) {
    console.error('[POST MESSAGE ERROR]', err);
    return res.status(500).json({
      message: 'Chat service failed',
      detail: err.message,
    });
  }
};
