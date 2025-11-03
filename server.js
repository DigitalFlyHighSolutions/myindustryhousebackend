// backend/server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');

// --- Route Imports ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const accountRoutes = require('./routes/accountRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const requirementRoutes = require('./routes/requirementRoutes');
const leadRoutes = require('./routes/leadRoutes');
const verificationRoutes = require('./routes/verificationRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
<<<<<<< Updated upstream
  'https://myindustryhouse.com', "https://www.myindustryhouse.com"
  // For local testing, uncomment:
  // 'http://localhost:3000'
=======
  'https://myindustryhouse.com',
  "https://www.myindustryhouse.com",
  'http://localhost:3000', // for local testing
>>>>>>> Stashed changes
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      const msg = 'The CORS policy does not allow access from this Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// --- Middleware ---
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- Socket.IO Setup ---
const io = new Server(server, { cors: corsOptions });

let userSockets = {};
let conversationHistory = {};

// --- Predefined FAQ Answers ---
const faqAnswers = {
  "How to contact support?": `
Here's how you can contact MyIndustryHouse support:

• Email: digitalflyhighsolutions@gmail.com
• Contact Form: https://myindustryhouse.com/contact
• Phone: +91-9977264510
`,

  "How do I contact seller?": `
To contact a seller:
1. Go to the seller’s profile.
2. Click “Contact Seller” or send a message directly.
`,

  "How to post a product?": `
To post a product:
1. Login to your account.
2. Navigate to “Add Product”.
3. Fill in the product details and submit.
`,

  "How to register?": `
To register:
1. Click on 'Register' on the homepage.
2. Fill in the required information.
3. Verify your email to complete registration.
`
  // Add more FAQs as needed
};

// --- Socket.IO Events ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', (userId) => {
    userSockets[userId] = socket.id;
    console.log(`User ${userId} registered with socket ID ${socket.id}`);
  });

  socket.on('send_message', (data) => {
    const recipientSocketId = userSockets[data.recipient];
    if (recipientSocketId) io.to(recipientSocketId).emit('receive_message', data);
  });

  socket.on('bot_message', async (userMessage) => {
    console.log('🤖 Chatbot received:', userMessage);
    if (!conversationHistory[socket.id]) conversationHistory[socket.id] = [];

    // --- Check for predefined FAQ first ---
    if (faqAnswers[userMessage]) {
      const reply = faqAnswers[userMessage];
      conversationHistory[socket.id].push({ role: 'assistant', text: reply });
      return socket.emit('bot_reply', reply);
    }

    // --- Fallback to Gemini AI ---
    try {
      conversationHistory[socket.id].push({ role: 'user', text: userMessage });

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
            { role: 'model', parts: [{ text: 'You are an intelligent and friendly assistant for MyIndustryHouse. Respond clearly, professionally, and helpfully.' }] },
          ],
        }
      );

      const reply =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm not sure how to answer that right now.";

      conversationHistory[socket.id].push({ role: 'assistant', text: reply });
      socket.emit('bot_reply', reply);
    } catch (err) {
      console.error('❌ Chatbot Error:', err.message);
      socket.emit(
        'bot_reply',
        'Sorry, something went wrong while fetching your answer. Please try again later.'
      );
    }
  });

  socket.on('disconnect', () => {
    for (const userId in userSockets) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
        break;
      }
    }
    delete conversationHistory[socket.id];
    console.log('A user disconnected:', socket.id);
  });
});

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// --- Routes ---
app.get('/', (req, res) => res.send('🚀 Backend is running!'));

const attachSocketIO = (req, res, next) => {
  req.io = io;
  req.userSockets = userSockets;
  next();
};

app.use('/api/admin', attachSocketIO, adminRoutes);
app.use('/api', attachSocketIO, leadRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/account', accountRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', messageRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api', verificationRoutes);

// --- Start Server ---
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`✅ Server is live and running on port ${PORT}`);
  });
};

startServer();
