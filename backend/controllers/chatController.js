const ChatSession = require('../models/ChatSession');
const Document = require('../models/Document');
const { embedText, streamRagAnswer } = require('../utils/geminiClient');
const { topKChunks } = require('../utils/vectorSearch');

// POST /api/chat - start a new chat session tied to a document
const createChatSession = async (req, res) => {
  try {
    const { documentId } = req.body;

    const document = await Document.findOne({ _id: documentId, user: req.user.id });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const session = await ChatSession.create({
      user: req.user.id,
      document: documentId,
      title: document.filename,
      messages: [],
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat session', error: error.message });
  }
};

// GET /api/chat - list the user's chat sessions
const listChatSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id })
      .select('title document createdAt messages')
      .sort({ createdAt: -1 });

    const summarized = sessions.map((s) => ({
      _id: s._id,
      title: s.title,
      messageCount: s.messages.length,
      createdAt: s.createdAt,
    }));

    res.json(summarized);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat sessions', error: error.message });
  }
};

// GET /api/chat/:id - full session with message history
const getChatSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat session', error: error.message });
  }
};

// POST /api/chat/:id/message - the core RAG endpoint: embed question, retrieve
// relevant chunks, stream a grounded answer back, then persist the exchange.
//
// This streams a plain chunked response (not Server-Sent Events) because SSE
// requires a GET request via EventSource, and we need to send the question in
// a POST body. A regular streamed fetch response, read via the client's
// ReadableStream, achieves the same token-by-token UX without that constraint.
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    const document = await Document.findById(session.document);
    if (!document) {
      return res.status(404).json({ message: 'The document this chat is linked to no longer exists' });
    }

    // 1. Embed the question in the same vector space as the document's chunks
    const queryEmbedding = await embedText(message);

    // 2. Retrieve the most relevant chunks by cosine similarity
    const relevantChunks = topKChunks(queryEmbedding, document.chunks, 4);

    // 3. Record the user's message immediately, before streaming starts
    session.messages.push({ role: 'user', content: message });

    // 4. Set up chunked streaming response headers
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    });

    // 5. Stream tokens to the client as they arrive from Gemini
    const fullAnswer = await streamRagAnswer(
      message,
      relevantChunks,
      session.messages,
      (token) => res.write(token)
    );

    // 6. Send a final marker with source citations, delimited so the frontend
    // can split the plain answer text from the structured source data.
    const sourcesPayload = relevantChunks.map((c) => ({
      chunkIndex: c.chunkIndex,
      text: c.text.slice(0, 200), // truncated preview, not the full chunk
      score: Number(c.score.toFixed(3)),
    }));
    res.write(`\n__SOURCES__${JSON.stringify(sourcesPayload)}`);
    res.end();

    // 7. Persist the assistant's full answer + sources after the stream finishes
    session.messages.push({ role: 'assistant', content: fullAnswer, sources: sourcesPayload });
    await session.save();
  } catch (error) {
    // If headers were already sent (streaming had started), we can't send a
    // clean JSON error anymore - write a plain error marker instead so the
    // frontend doesn't hang waiting for a response that will never complete.
    if (res.headersSent) {
      res.write(`\n__ERROR__${error.message}`);
      res.end();
    } else {
      res.status(500).json({ message: 'Failed to generate answer', error: error.message });
    }
  }
};

module.exports = { createChatSession, listChatSessions, getChatSession, sendMessage };
