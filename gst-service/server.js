
const express = require('express');
const app = express();
const port = 5003;
const gstRoutes = require('./routes/gstRoutes');

app.use(express.json());

app.use('/gst', gstRoutes);

app.get('/gst/test', (req, res) => {
  res.json({ message: 'Hello from the gst-service!' });
});

app.listen(port, () => {
  console.log(`GST service listening at http://localhost:${port}`);
});
