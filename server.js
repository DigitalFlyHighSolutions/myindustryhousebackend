// backend/server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require("socket.io");
const helmet = require('helmet');
const morgan = require('morgan');

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
const leadRoutes = require('./routes/leadRoutes'); // ✅ NEW: Import lead routes

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:3000',
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let userSockets = {};
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', (userId) => {
    userSockets[userId] = socket.id;
    console.log(`User ${userId} registered with socket ID ${socket.id}`);
  });

  socket.on('send_message', (data) => {
    const recipientSocketId = userSockets[data.recipient];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_message', data);
    }
  });

  socket.on('disconnect', () => {
    for (const userId in userSockets) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
        break;
      }
    }
  });
});

// DB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// --- Routes ---
app.get('/', (req, res) => res.send('Backend is running!'));

app.use('/api/admin', (req, res, next) => {
    req.io = io;
    req.userSockets = userSockets;
    next();
}, adminRoutes);

// ✅ NEW: Add io and userSockets to lead routes
app.use('/api', (req, res, next) => {
    req.io = io;
    req.userSockets = userSockets;
    next();
}, leadRoutes);


app.use('/api/sellers', sellerRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/account', accountRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', messageRoutes);
app.use('/api', requirementRoutes);


// --- Server Start ---
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();