// RAG-enhanced chat handler
//
// Pipeline per request:
//   1. Embed the user's question via Mistral
//   2. Query Pinecone namespace=hospitalId for relevant historical context
//      (returns nothing and falls through if Pinecone is not configured)
//   3. Inject retrieved context into the system prompt
//   4. Call Mistral for the final answer
//   5. Async (fire-and-forget): embed the AI response and store it in Pinecone
//      so future queries for this hospital can retrieve it

const { embedOne } = require('./_lib/embed');
const { query: pineconeQuery, upsert, PINECONE_AVAILABLE } = require('./_lib/pinecone');
<<<<<<< HEAD
=======
const { logChat } = require('./_lib/langfuse');
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const mistralKey = process.env.MISTRAL_API_KEY;
  if (!mistralKey) return res.status(500).json({ error: 'MISTRAL_API_KEY not configured' });

  // Hospital namespace from header — set by useChat.ts X-Hospital-Id
<<<<<<< HEAD
  const hospitalId = req.headers['x-hospital-id'] || 'unknown';
=======
  const hospitalId   = req.headers['x-hospital-id'] || 'unknown';
  const hospitalName = req.headers['x-hospital-name'] || hospitalId;
  const dataSource   = req.headers['x-data-source'] || 'simulated';
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // The last user message is the query to embed and retrieve against
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserText = userMessages[userMessages.length - 1]?.content || '';
  const systemMessage = messages.find(m => m.role === 'system');

  // ── Step 1 & 2: Embed query + retrieve relevant context from this hospital's namespace ──
  let retrievedContext = '';
<<<<<<< HEAD
=======
  let ragHits = 0;
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
  if (PINECONE_AVAILABLE && lastUserText) {
    try {
      const queryVec = await embedOne(lastUserText, mistralKey);
      const hits = await pineconeQuery(hospitalId, queryVec, 4);

      if (hits.length > 0) {
<<<<<<< HEAD
=======
        ragHits = hits.length;
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
        const snippets = hits.map((h, i) =>
          `[${i + 1}] ${h.metadata?.type || 'context'} (${h.metadata?.ts || 'unknown time'}, score ${h.score.toFixed(2)}):\n${h.metadata?.text || ''}`
        ).join('\n\n');
        retrievedContext = `\nRETRIEVED CONTEXT — ${hospitalId} historical records (relevance >${(0.70 * 100).toFixed(0)}%):\n${snippets}\n`;
      }
    } catch (embedErr) {
      // Non-fatal — degrade gracefully; log but continue without retrieval
      console.error(`[chat] RAG retrieval failed for ${hospitalId}:`, embedErr.message);
    }
  }

  // ── Step 3: Inject retrieved context into system prompt ──
  const enrichedMessages = messages.map(m => {
    if (m.role === 'system' && retrievedContext) {
      return { ...m, content: m.content + retrievedContext };
    }
    return m;
  });

  // ── Step 4: Call Mistral ──
  try {
    const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + mistralKey,
      },
      body: JSON.stringify({ ...req.body, messages: enrichedMessages }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error(`[chat] Mistral error ${upstream.status}:`, data);
      return res.status(upstream.status).json(data);
    }

<<<<<<< HEAD
    // ── Step 5: Store AI response embedding in hospital namespace (fire-and-forget) ──
    const aiContent = data.choices?.[0]?.message?.content;
    if (PINECONE_AVAILABLE && aiContent && hospitalId !== 'unknown') {
      storeResponseAsync(aiContent, lastUserText, hospitalId, mistralKey).catch(err =>
        console.error('[chat] async embed store failed:', err.message)
      );
=======
    // ── Step 5: Async side effects — Pinecone store + Langfuse trace ──
    const aiContent = data.choices?.[0]?.message?.content;
    const model = req.body.model || 'mistral-large-latest';

    if (aiContent && hospitalId !== 'unknown') {
      if (PINECONE_AVAILABLE) {
        storeResponseAsync(aiContent, lastUserText, hospitalId, mistralKey).catch(err =>
          console.error('[chat] async embed store failed:', err.message)
        );
      }
      logChat({
        hospitalId,
        hospitalName,
        model,
        inputMessages: enrichedMessages,
        outputText: aiContent,
        usage: data.usage,
        ragUsed: ragHits > 0,
        ragHits,
        dataSource,
      }).catch(err => console.error('[chat] Langfuse log failed:', err.message));
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('[chat] upstream error:', err);
    return res.status(502).json({ error: 'Upstream API error: ' + err.message });
  }
};

async function storeResponseAsync(aiText, userQuestion, hospitalId, mistralKey) {
  const textToEmbed = `Q: ${userQuestion}\nA: ${aiText}`;
  const vec = await embedOne(textToEmbed, mistralKey);
  const id = `chat-${hospitalId}-${Date.now()}`;

  await upsert(hospitalId, [{
    id,
    values: vec,
    metadata: {
      type: 'chat_exchange',
      ts: new Date().toISOString(),
      hospitalId,
      text: textToEmbed.slice(0, 1000), // Pinecone metadata 40KB limit
      question: userQuestion.slice(0, 200),
    },
  }]);
}
