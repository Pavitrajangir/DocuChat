const { chunkText, CHUNK_SIZE, CHUNK_OVERLAP } = require('../utils/chunker');
const { cosineSimilarity, topKChunks } = require('../utils/vectorSearch');

describe('chunkText', () => {
  test('returns a single chunk for text shorter than CHUNK_SIZE', () => {
    const text = 'This is a short document.';
    const chunks = chunkText(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(text);
  });

  test('splits long text into multiple chunks', () => {
    const text = 'a'.repeat(CHUNK_SIZE * 3);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
  });

  test('consecutive chunks overlap by roughly CHUNK_OVERLAP characters', () => {
    const text = 'x'.repeat(CHUNK_SIZE * 2 + 100);
    const chunks = chunkText(text);
    // the tail of chunk 1 should reappear at the head of chunk 2
    const tailOfFirst = chunks[0].slice(-CHUNK_OVERLAP);
    const headOfSecond = chunks[1].slice(0, CHUNK_OVERLAP);
    expect(headOfSecond).toBe(tailOfFirst);
  });

  test('returns an empty array for empty input', () => {
    expect(chunkText('')).toEqual([]);
  });
});

describe('cosineSimilarity', () => {
  test('returns 1 for identical vectors', () => {
    const v = [1, 2, 3];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1);
  });

  test('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  test('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });
});

describe('topKChunks', () => {
  const chunks = [
    { chunkIndex: 0, text: 'about cats', embedding: [1, 0, 0] },
    { chunkIndex: 1, text: 'about dogs', embedding: [0, 1, 0] },
    { chunkIndex: 2, text: 'nearly about cats too', embedding: [0.9, 0.1, 0] },
  ];

  test('returns the k most similar chunks, sorted by score descending', () => {
    const queryEmbedding = [1, 0, 0]; // most similar to chunk 0, then chunk 2
    const results = topKChunks(queryEmbedding, chunks, 2);

    expect(results.length).toBe(2);
    expect(results[0].chunkIndex).toBe(0);
    expect(results[1].chunkIndex).toBe(2);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});
