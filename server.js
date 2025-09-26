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
const leadRoutes = require('./routes/leadRoutes');

const app = express();
const server = http.createServer(app);
const PORT = 5001;

// --- Hardcoded CORS Setup ---
const allowedOrigins = [
  'https://myindustryhouse.com', // production frontend
  'https://myindustryhouse.com'         // optional for local dev
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow mobile apps or curl
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('Not allowed by CORS'), false);
    }
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.options('*', cors());

// --- Middleware ---
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
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

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect('your_mongo_connection_string_here'); // hardcoded Mongo URI
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// --- Routes ---
app.get('/', (req, res) => res.send('Backend is running!'));

// Admin routes with Socket.IO access
app.use('/api/admin', (req, res, next) => {
  req.io = io;
  req.userSockets = userSockets;
  next();
}, adminRoutes);

// Lead routes with Socket.IO access
app.use('/api', (req, res, next) => {
  req.io = io;
  req.userSockets = userSockets;
  next();
}, leadRoutes);

// Other routes
app.use('/api/sellers', sellerRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/account', accountRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', messageRoutes);
app.use('/api', requirementRoutes);

// --- Start Server ---
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
