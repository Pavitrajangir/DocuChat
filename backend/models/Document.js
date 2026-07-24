const mongoose = require('mongoose');

// Chunks are embedded inside their parent Document for the same reason questions
// were embedded inside Session in the Interview Copilot project: they're always
// read together (retrieval scans every chunk of one document), never queried
// independently of their document.
const chunkSchema = new mongoose.Schema(
  {
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true }, // vector from gemini-embedding-001
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  chunks: [chunkSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Document', documentSchema);
