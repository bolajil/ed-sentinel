// Langfuse observability — LLM tracing, session tracking, cost estimation
//
// Setup (one-time):
//   1. cloud.langfuse.com → create project → copy Public Key + Secret Key
//   2. Add to env: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY
//      Optional: LANGFUSE_HOST (default: https://cloud.langfuse.com)
//
// What gets captured per chat request:
//   - Trace:      sessionId=hospitalId-date, userId=hospitalId, name=ed-sentinel-chat
//   - Generation: model, full input messages, output text, token usage, estimated cost
//   - Metadata:   hospitalId, dataSource, ragHits, retrievedContext flag

const LANGFUSE_HOST = (process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com').replace(/\/$/, '');
const LANGFUSE_AVAILABLE = !!(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);

// Mistral Large Latest pricing (per token)
const COST_PER_INPUT_TOKEN  = 0.000002; // $2 / 1M tokens
const COST_PER_OUTPUT_TOKEN = 0.000006; // $6 / 1M tokens

function authHeader() {
  const creds = Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`).toString('base64');
  return `Basic ${creds}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Log a completed chat generation to Langfuse.
 * Fire-and-forget — call without await in the response path.
 *
 * @param {object} opts
 * @param {string}   opts.hospitalId       e.g. 'facility_a'
 * @param {string}   opts.hospitalName     e.g. 'Memorial General'
 * @param {string}   opts.model            e.g. 'mistral-large-latest'
 * @param {object[]} opts.inputMessages    messages array sent to Mistral
 * @param {string}   opts.outputText       AI response content
 * @param {object}   opts.usage            { prompt_tokens, completion_tokens }
 * @param {boolean}  opts.ragUsed          whether Pinecone context was injected
 * @param {number}   opts.ragHits          number of retrieved context chunks
 * @param {string}   opts.dataSource       'simulated' | 'ingested'
 */
async function logChat({ hospitalId, hospitalName, model, inputMessages, outputText, usage, ragUsed, ragHits, dataSource }) {
  if (!LANGFUSE_AVAILABLE) return;

  const now = new Date().toISOString();
  const today = now.slice(0, 10); // YYYY-MM-DD
  const traceId = `${hospitalId}-${today}-${uid()}`;
  const sessionId = `${hospitalId}-${today}`;

  const inputTokens  = usage?.prompt_tokens || 0;
  const outputTokens = usage?.completion_tokens || 0;
  const estimatedCost = (inputTokens * COST_PER_INPUT_TOKEN) + (outputTokens * COST_PER_OUTPUT_TOKEN);

  const batch = [
    {
      id: uid(),
      type: 'trace-create',
      timestamp: now,
      body: {
        id: traceId,
        name: 'ed-sentinel-chat',
        userId: hospitalId,
        sessionId,
        metadata: {
          hospitalId,
          hospitalName,
          dataSource,
          ragUsed,
          ragHits,
        },
        tags: ['ed-sentinel', hospitalId, dataSource],
      },
    },
    {
      id: uid(),
      type: 'generation-create',
      timestamp: now,
      body: {
        traceId,
        name: 'sentinel-response',
        model,
        modelParameters: { temperature: 0.4 },
        input: inputMessages,
        output: outputText,
        usage: {
          input:      inputTokens,
          output:     outputTokens,
          unit:       'TOKENS',
          totalCost:  estimatedCost,
          inputCost:  inputTokens * COST_PER_INPUT_TOKEN,
          outputCost: outputTokens * COST_PER_OUTPUT_TOKEN,
        },
        metadata: {
          hospitalId,
          hospitalName,
          ragUsed,
          ragHits,
          dataSource,
          estimatedCostUSD: estimatedCost.toFixed(6),
        },
      },
    },
  ];

  const res = await fetch(`${LANGFUSE_HOST}/api/public/ingestion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader(),
    },
    body: JSON.stringify({ batch }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Langfuse ingestion error ${res.status}: ${JSON.stringify(err)}`);
  }
}

/**
 * Log a data ingestion event as a Langfuse span.
 */
async function logIngest({ hospitalId, hospitalName, fileType, rowCount, confidence, metricsExtracted }) {
  if (!LANGFUSE_AVAILABLE) return;

  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const traceId = `ingest-${hospitalId}-${Date.now().toString(36)}`;
  const sessionId = `${hospitalId}-${today}`;

  const batch = [
    {
      id: uid(),
      type: 'trace-create',
      timestamp: now,
      body: {
        id: traceId,
        name: 'ed-sentinel-ingest',
        userId: hospitalId,
        sessionId,
        metadata: { hospitalId, hospitalName, fileType, rowCount, confidence, metricsExtracted },
        tags: ['ed-sentinel', hospitalId, 'data-ingest'],
      },
    },
    {
      id: uid(),
      type: 'span-create',
      timestamp: now,
      body: {
        traceId,
        name: 'mistral-column-mapping',
        metadata: { hospitalId, fileType, rowCount, confidence, metricsExtracted },
      },
    },
  ];

  const res = await fetch(`${LANGFUSE_HOST}/api/public/ingestion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': authHeader() },
    body: JSON.stringify({ batch }),
  });

  if (!res.ok) throw new Error(`Langfuse ingest log error ${res.status}`);
}

module.exports = { logChat, logIngest, LANGFUSE_AVAILABLE };
