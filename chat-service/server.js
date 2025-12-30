
const express = require('express');
const app = express();
const port = 5008;
const chatController = require('./controllers/chatController');

app.use(express.json());

app.get('/conversations/:userId', chatController.getConversations);
app.get('/conversation/:convoId', chatController.getConversationDetail);
app.post('/messages', chatController.postMessage);

app.listen(port, () => {
  console.log(`Chat service listening at http://localhost:${port}`);
});
