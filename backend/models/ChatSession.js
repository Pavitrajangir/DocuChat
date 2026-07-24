const mongoose = require('mongoose');

// Sources are stored per-message so the UI can show which document excerpts
// grounded each answer - this is what makes citations possible after the fact,
// not just during the live response.
const sourceSchema = new mongoose.Schema(
  {
    chunkIndex: Number,
    text: String,
    score: Number, // cosine similarity score at retrieval time
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: [sourceSchema], // only populated on assistant messages
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  title: { type: String, default: 'New chat' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
