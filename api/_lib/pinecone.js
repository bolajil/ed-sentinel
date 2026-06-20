// Pinecone REST client — no npm package needed.
//
// Setup (one-time):
//   1. pinecone.io → Create index: name=ed-sentinel, dimensions=1024, metric=cosine
//   2. Add to env: PINECONE_API_KEY, PINECONE_INDEX_HOST (e.g. https://ed-sentinel-xxxx.svc.us-east1-gcp.pinecone.io)
//
// Hospital isolation:
//   Every upsert and query is scoped to namespace=hospitalId.
//   A query for facility_a CANNOT return vectors from facility_b — enforced by Pinecone at the index level.

const PINECONE_AVAILABLE = !!(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_HOST);

function headers() {
  return {
    'Content-Type': 'application/json',
    'Api-Key': process.env.PINECONE_API_KEY,
  };
}

function host() {
  return process.env.PINECONE_INDEX_HOST.replace(/\/$/, '');
}

/**
 * Upsert vectors into a hospital-namespaced partition.
 *
 * @param {string} hospitalId     namespace (e.g. 'facility_a')
 * @param {{ id: string, values: number[], metadata: object }[]} vectors
 */
async function upsert(hospitalId, vectors) {
  if (!PINECONE_AVAILABLE) return { skipped: true, reason: 'Pinecone not configured' };

  const res = await fetch(`${host()}/vectors/upsert`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ namespace: hospitalId, vectors }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Pinecone upsert error ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

/**
 * Semantic search within a single hospital namespace.
 * Never crosses namespace boundaries.
 *
 * @param {string}   hospitalId   namespace to search
 * @param {number[]} queryVector  1024-dim query embedding
 * @param {number}   topK         number of results (default 4)
 * @param {object}   filter       optional Pinecone metadata filter
 * @returns {Array<{ id, score, metadata }>}
 */
async function query(hospitalId, queryVector, topK = 4, filter = undefined) {
  if (!PINECONE_AVAILABLE) return [];

  const body = {
    namespace: hospitalId,
    vector: queryVector,
    topK,
    includeMetadata: true,
  };
  if (filter) body.filter = filter;

  const res = await fetch(`${host()}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Pinecone query error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return (data.matches || []).filter(m => m.score > 0.70); // relevance threshold
}

/**
 * Delete all vectors for a hospital namespace (e.g. on data purge).
 */
async function deleteNamespace(hospitalId) {
  if (!PINECONE_AVAILABLE) return;

  const res = await fetch(`${host()}/vectors/delete`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ namespace: hospitalId, deleteAll: true }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Pinecone delete error ${res.status}: ${JSON.stringify(err)}`);
  }
}

module.exports = { upsert, query, deleteNamespace, PINECONE_AVAILABLE };
