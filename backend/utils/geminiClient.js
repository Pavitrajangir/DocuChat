const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-embedding-001: Google's current generally-available text embedding model
// (as opposed to a pinned/experimental version that could be deprecated without
// notice - we hit exactly that problem with a chat model in an earlier project,
// so this name was checked against current docs rather than assumed).
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

// gemini-flash-latest: an alias that auto-points to Google's current flash-tier
// model, same reasoning as the Interview Copilot project - avoids a hardcoded
// version string going stale.
const chatModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

// Generates a single embedding vector for a piece of text (a chunk during
// upload, or a user's question at query time - same model, same vector space,
// so they're directly comparable via cosine similarity).
const embedText = async (text) => {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
};

// Embeds multiple chunks sequentially. Sequential (not Promise.all in parallel)
// is deliberate - the free tier has a requests-per-minute limit, and firing 40+
// embedding calls simultaneously is the fastest way to hit a 429 rate-limit
// error on a large document upload.
const embedChunks = async (chunks) => {
  const embeddings = [];
  for (const chunk of chunks) {
    const vector = await embedText(chunk);
    embeddings.push(vector);
  }
  return embeddings;
};

const RAG_SYSTEM_PROMPT = `You are a helpful assistant answering questions about a specific document.
Answer ONLY using the provided context excerpts below. If the answer isn't contained in the
context, say so clearly instead of guessing or using outside knowledge - do not hallucinate
information that isn't in the provided context.

Keep answers concise and directly grounded in the excerpts. When useful, you may quote a short
relevant phrase from the context.`;

// Builds the grounded prompt and streams the response back chunk by chunk.
// onToken is called with each piece of text as it arrives from the model,
// so the caller (an Express route) can forward it to the client immediately
// instead of waiting for the full response.
const streamRagAnswer = async (question, retrievedChunks, conversationHistory, onToken) => {
  const contextBlock = retrievedChunks
    .map((c, i) => `[Excerpt ${i + 1}]\n${c.text}`)
    .join('\n\n');

  const historyBlock = conversationHistory
    .slice(-6) // last 6 messages only - keeps the prompt from growing unbounded across a long chat
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const userPrompt = `Context excerpts from the document:
"""
${contextBlock}
"""

${historyBlock ? `Recent conversation:\n${historyBlock}\n` : ''}
Question: ${question}`;

  const result = await chatModel.generateContentStream([RAG_SYSTEM_PROMPT, userPrompt]);

  let fullText = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullText += text;
    onToken(text);
  }

  return fullText;
};

module.exports = { embedText, embedChunks, streamRagAnswer };
