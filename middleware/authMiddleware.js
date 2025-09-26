// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ✅ Import the User model

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    req.token = bearerToken;
    jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => { // ✅ Make the callback async
      if (err) {
        return res.status(403).json({ message: 'Forbidden: Invalid Token' });
      } else {
        // ✅ ADDED: Check user status in the database on every request
        try {
          const user = await User.findById(authData.user._id).select('status');
          if (!user || user.status === 'suspended') {
            return res.status(403).json({ message: 'User account is suspended.' });
          }
          req.user = authData.user;
          next();
        } catch (dbError) {
          return res.status(500).json({ message: 'Database error during token verification.' });
        }
      }
    });
  } else {
    res.status(401).json({ message: 'Unauthorized: No Token Provided' });
  }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Requires admin access.' });
    }
};

module.exports = { verifyToken, isAdmin };