const express = require('express');
const app = express();
const port = 5001;
const db = require('./db');
const authController = require('./controllers/authController');

app.use(express.json());

app.post('/auth/register', authController.registerUser);
app.post('/auth/login', authController.loginUser);
app.post('/auth/forgot-password', authController.forgotPassword);
app.post('/auth/reset-password/:token', authController.resetPassword);

db.migrate.latest()
  .then(() => {
    console.log('Migrations are up to date');
    app.listen(port, () => {
      console.log(`Auth service listening at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error running migrations', err);
    process.exit(1);
  });