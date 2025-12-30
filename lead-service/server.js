const express = require('express');
const app = express();
const port = 5005;
const leadRoutes = require('./routes/leadRoutes');

app.use(express.json());

app.use('/leads', leadRoutes);

app.listen(port, () => {
  console.log(`Lead service listening at http://localhost:${port}`);
});