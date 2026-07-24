const Document = require('../models/Document');
const { extractTextFromPDF } = require('../utils/pdfParser');
const { chunkText } = require('../utils/chunker');
const { embedChunks } = require('../utils/geminiClient');

// POST /api/documents - upload a PDF, chunk it, embed each chunk, store it
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'A PDF file is required' });
    }

    const rawText = await extractTextFromPDF(req.file.buffer);

    if (!rawText || rawText.length < 50) {
      return res.status(422).json({
        message: 'Could not extract readable text from this PDF. Try a different file (avoid scanned/image-based PDFs).',
      });
    }

    const textChunks = chunkText(rawText);

    if (textChunks.length === 0) {
      return res.status(422).json({ message: 'No usable text chunks could be created from this document' });
    }

    // Sequential embedding (inside embedChunks) means this can take a while for
    // a long document - the frontend upload button shows a loading state for
    // exactly this reason, same pattern as the Interview Copilot's question generation.
    const vectors = await embedChunks(textChunks);

    const chunks = textChunks.map((text, i) => ({
      chunkIndex: i,
      text,
      embedding: vectors[i],
    }));

    const document = await Document.create({
      user: req.user.id,
      filename: req.file.originalname,
      chunks,
    });

    // Don't send embeddings back to the client - they're large (thousands of
    // floats per chunk) and the frontend never needs the raw vectors, only text.
    res.status(201).json({
      _id: document._id,
      filename: document.filename,
      chunkCount: document.chunks.length,
      createdAt: document.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process document', error: error.message });
  }
};

// GET /api/documents - list the user's uploaded documents (summary only)
const listDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id })
      .select('filename createdAt chunks')
      .sort({ createdAt: -1 });

    const summarized = documents.map((d) => ({
      _id: d._id,
      filename: d.filename,
      chunkCount: d.chunks.length,
      createdAt: d.createdAt,
    }));

    res.json(summarized);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};

module.exports = { uploadDocument, listDocuments };
