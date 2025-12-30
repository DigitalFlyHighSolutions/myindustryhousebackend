const express = require('express');
const app = express();
const port = 5004;
const adminRoutes = require('./routes/adminRoutes');

app.use(express.json());

app.use('/admin', adminRoutes);

app.listen(port, () => {
  console.log(`Admin service listening at http://localhost:${port}`);
});
