// Mistral Embed — 1024-dimension dense vectors
// Files under api/_lib are shared utilities; Vercel does NOT expose them as endpoints.

const MISTRAL_EMBED_URL = 'https://api.mistral.ai/v1/embeddings';
const MODEL = 'mistral-embed';

/**
 * Embed one or more strings via Mistral's embedding API.
 * @param {string|string[]} input
 * @param {string} apiKey
 * @returns {Promise<number[][]>} array of 1024-dim float vectors
 */
async function embed(input, apiKey) {
  const texts = Array.isArray(input) ? input : [input];

  const res = await fetch(MISTRAL_EMBED_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Mistral embed error ${res.status}: ${err.message || res.statusText}`);
  }

  const data = await res.json();
  // data.data is sorted by index — return in same order as input
  return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
}

/**
 * Embed a single string and return its vector.
 */
async function embedOne(text, apiKey) {
  const [vec] = await embed(text, apiKey);
  return vec;
}

module.exports = { embed, embedOne };
