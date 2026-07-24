// Splits extracted document text into overlapping chunks before embedding.
//
// Why fixed-size character chunking instead of semantic chunking (splitting on
// paragraph/section boundaries using an LLM or NLP library)?
// - It's deterministic and fast - no extra API call or NLP dependency just to
//   prepare text for embedding.
// - For a fresher-scale project (single PDFs, not huge multi-document corpora),
//   the retrieval quality difference is small, and fixed-size chunking is far
//   easier to reason about and debug when something goes wrong.
// - Tradeoff, and worth knowing: fixed-size chunking can split a sentence or
//   idea awkwardly across two chunks. Semantic chunking (or at least splitting
//   on paragraph breaks first, falling back to fixed-size within long paragraphs)
//   would reduce that at the cost of complexity. That's the natural next
//   improvement if retrieval quality turns out to be a problem in practice.
//
// Why overlap between chunks? Without overlap, a sentence that gets cut at a
// chunk boundary loses context on both sides. A small overlap (150 chars here)
// means the tail of one chunk repeats as the head of the next, so an idea that
// straddles a boundary still appears intact in at least one chunk.

const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 150; // characters shared between consecutive chunks
const MAX_CHUNKS = 60; // caps embedding API calls per document upload

const chunkText = (text) => {
  const chunks = [];
  let start = 0;

  while (start < text.length && chunks.length < MAX_CHUNKS) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunkContent = text.slice(start, end).trim();

    if (chunkContent.length > 0) {
      chunks.push(chunkContent);
    }

    if (end === text.length) break;
    start = end - CHUNK_OVERLAP; // step back so the next chunk overlaps this one
  }

  return chunks;
};

module.exports = { chunkText, CHUNK_SIZE, CHUNK_OVERLAP, MAX_CHUNKS };
