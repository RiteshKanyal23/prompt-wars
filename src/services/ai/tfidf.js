import { stemTokens, tokenize } from './normalize';

/**
 * Build an IDF table from a corpus of documents.
 * @param {string[]} documents
 */
export function buildIndex(documents) {
  const df = new Map();
  for (const document of documents) {
    const unique = new Set(stemTokens(tokenize(document)));
    for (const token of unique) df.set(token, (df.get(token) || 0) + 1);
  }
  const N = Math.max(documents.length, 1);
  const idf = new Map();
  for (const [token, count] of df) {
    idf.set(token, Math.log((N + 1) / (count + 1)) + 1);
  }
  return { idf, N };
}

export function vectorize(tokens, index) {
  const stemmed = stemTokens(tokens);
  const counts = new Map();
  for (const token of stemmed) counts.set(token, (counts.get(token) || 0) + 1);
  const length = Math.max(stemmed.length, 1);
  const vector = new Map();
  for (const [token, count] of counts) {
    const idf = index.idf.get(token) ?? 1;
    vector.set(token, (count / length) * idf);
  }
  return vector;
}

export function cosine(a, b) {
  if (!a.size || !b.size) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const value of a.values()) normA += value * value;
  for (const value of b.values()) normB += value * value;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [token, value] of small) dot += value * (large.get(token) || 0);
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function textSimilarity(a, b, index) {
  return cosine(vectorize(tokenize(a), index), vectorize(tokenize(b), index));
}
