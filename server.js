const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require("socket.io");
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config(); // Load environment variables first

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

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// --- CORS Configuration ---
const allowedOrigins = [
  'https://myindustryhouse.com',
  // For local testing, uncomment:
  // 'http://localhost:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow mobile apps or server-to-server
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

app.use(cors(corsOptions));

// --- Middleware ---
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: corsOptions
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

// --- API Routes ---
app.get('/', (req, res) => res.send('🚀 My Industry House API is running!'));

app.use((req, res, next) => {
  req.io = io;
  req.userSockets = userSockets;
  next();
});

app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', messageRoutes);
app.use('/api', requirementRoutes);
app.use('/api', leadRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/admin', adminRoutes);

// --- Start Server ---
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`✅ Server is live and running on port ${PORT}`);
  });
};

startServer();
