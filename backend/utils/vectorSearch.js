// Retrieval logic: given a query embedding and a document's stored chunk
// embeddings, find the most semantically relevant chunks by cosine similarity.
//
// Why compute this in application code instead of a dedicated vector database
// (Pinecone, Weaviate, Chroma)?
// - At this scale (one document at a time, tens of chunks, not millions), a
//   linear scan computing cosine similarity against every chunk is fast enough
//   (well under a second) and needs zero extra infrastructure or accounts.
// - A dedicated vector DB earns its cost at much larger scale, where you need
//   approximate nearest neighbor search (HNSW, IVF indexes) because a linear
//   scan over millions of vectors would be too slow. That's a real, known
//   tradeoff - worth being able to explain, not a limitation to hide.

const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Returns the top K chunks most similar to the query embedding, each annotated
// with its similarity score so the caller (and the UI, for citations) can use it.
const topKChunks = (queryEmbedding, chunks, k = 4) => {
  const scored = chunks.map((chunk) => ({
    ...(chunk.toObject ? chunk.toObject() : chunk),
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
};

module.exports = { cosineSimilarity, topKChunks };
