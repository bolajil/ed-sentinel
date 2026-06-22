const { embedOne } = require('./_lib/embed');
const { upsert, PINECONE_AVAILABLE } = require('./_lib/pinecone');
<<<<<<< HEAD
=======
const { logIngest } = require('./_lib/langfuse');
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'MISTRAL_API_KEY not configured' });

  const { dataPreview, fileType, hospitalName, hospitalId, rowCount } = req.body;
  if (!dataPreview) return res.status(400).json({ error: 'No data provided' });

  const prompt = `You are an ED data analyst specializing in Emergency Department metrics.

Hospital: ${hospitalName || 'Unknown'}
File type: ${fileType?.toUpperCase() || 'unknown'}
Total rows in file: ${rowCount || 'unknown'}

Data sample (first rows of the file):
\`\`\`
${String(dataPreview).slice(0, 8000)}
\`\`\`

Analyze this data and extract current ED performance metrics. Handle messy or unclean data gracefully.

Return ONLY a valid JSON object — no markdown, no explanation, nothing outside the JSON:
{
  "metrics": {
    "arrivals": <arrivals per hour as number, or null>,
    "lwbs_rate": <left-without-being-seen as % of visits, or null>,
    "door_to_triage": <avg minutes arrival to triage, or null>,
    "door_to_room": <avg minutes arrival to room placement, or null>,
    "arrival_to_provider": <avg minutes arrival to first provider contact, or null>,
    "boarding_census": <count of admitted patients awaiting inpatient bed, or null>,
    "waiting_room": <count of patients currently in waiting room, or null>,
    "ed_los_discharged": <avg ED length of stay in hours for discharged patients, or null>,
    "ed_los_admitted": <avg ED length of stay in hours for admitted patients, or null>,
    "esi_4_5_pct": <percentage of ESI 4 or 5 patients in main ED, or null>,
    "fast_track_open": <1 if fast track is open, 0 if closed, or null>,
    "provider_coverage": <provider staffing coverage as percentage, or null>
  },
  "quality": {
    "issues": ["<specific data quality issue 1>", "<issue 2>"],
    "rows_processed": <number of rows analyzed>,
    "confidence": "<high if 8+ metrics extracted, medium if 4-7, low if fewer than 4>"
  },
  "mappings": {
    "<exact column name from data>": "<metric id it maps to>"
  }
}

Rules:
- If a metric cannot be determined, use null (do not guess)
- For time-series data, calculate averages across all rows
- For snapshot data, read current values directly
- Identify non-standard column names (e.g. "arr_time" maps to arrivals, "LWBS" maps to lwbs_rate)
- If data has timestamps, calculate arrivals/hr from the time span covered
- issues array should list specific problems found (missing columns, null values, ambiguous units, etc.)`;

  try {
    const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: 'You are a healthcare data analyst. Always respond with valid JSON only. Never include markdown code blocks or any text outside the JSON object.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error('[ingest] Mistral error:', data);
      return res.status(upstream.status).json({ error: data.message || 'AI analysis failed' });
    }

    let content = data.choices?.[0]?.message?.content ?? '';

    // Strip markdown code blocks if model added them
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('[ingest] JSON parse error, raw content:', content.slice(0, 500));
      return res.status(500).json({ error: 'AI returned malformed JSON. Try again.' });
    }

    // Coerce all metric values to numbers (guard against strings)
    if (parsed.metrics) {
      for (const key of Object.keys(parsed.metrics)) {
        const v = parsed.metrics[key];
        if (v !== null && v !== undefined) {
          parsed.metrics[key] = typeof v === 'number' ? v : Number(v) || null;
        }
      }
    }

    // Store ingestion report in Pinecone under hospital namespace (fire-and-forget)
    if (PINECONE_AVAILABLE && hospitalId) {
      const metricSummary = Object.entries(parsed.metrics || {})
        .filter(([, v]) => v !== null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      const textToEmbed = [
        `ED data ingestion report for ${hospitalName}`,
        `File: ${fileType}, ${rowCount} rows`,
        `Extracted metrics: ${metricSummary}`,
        `Data quality: ${(parsed.quality?.issues || []).join('; ') || 'no issues'}`,
        `Confidence: ${parsed.quality?.confidence || 'unknown'}`,
      ].join('\n');

      embedOne(textToEmbed, apiKey)
        .then(vec => upsert(hospitalId, [{
          id: `ingest-${hospitalId}-${Date.now()}`,
          values: vec,
          metadata: {
            type: 'data_ingestion',
            ts: new Date().toISOString(),
            hospitalId,
            hospitalName,
            text: textToEmbed,
            metrics: JSON.stringify(parsed.metrics).slice(0, 500),
            confidence: parsed.quality?.confidence || 'unknown',
          },
        }]))
        .catch(err => console.error('[ingest] Pinecone store failed:', err.message));
    }

<<<<<<< HEAD
=======
    // Langfuse: log the ingestion event (fire-and-forget)
    logIngest({
      hospitalId: hospitalId || 'unknown',
      hospitalName,
      fileType,
      rowCount,
      confidence: parsed.quality?.confidence || 'unknown',
      metricsExtracted: Object.keys(parsed.metrics || {}).filter(k => parsed.metrics[k] !== null).length,
    }).catch(err => console.error('[ingest] Langfuse log failed:', err.message));

>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[ingest] error:', err);
    return res.status(502).json({ error: 'Failed to reach AI service: ' + err.message });
  }
};
