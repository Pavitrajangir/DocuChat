require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB();

// In production, only allow requests from the deployed frontend. Falls back
// to allowing all origins locally, since dev doesn't need this restriction.
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'DocuChat API. See /api/health for status.' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DocuChat API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
