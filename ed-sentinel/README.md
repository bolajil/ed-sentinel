# ED Sentinel Agent — Huron Healthcare AI Platform

> Real-time ED metric validation · AI-powered chat · Data ingestion · RAG · Observability · Daily auto-purge

---

## What It Does

The ED Sentinel Agent monitors every incoming ED data event across multiple hospitals and:

1. **Validates** all 12 ED metrics are present and plausible on every tick
2. **Cross-checks** each value against a 4-week cache baseline
3. **Classifies** metrics as OK / WARNING / CRITICAL
4. **Answers questions** via a live AI chat interface powered by Mistral
5. **Ingests** CSV/JSON exports from any EHR and maps columns automatically via AI
6. **Retrieves** relevant historical context per hospital using vector search (Pinecone RAG)
7. **Tracks** every LLM call, token usage, cost, and session in Langfuse
8. **Reminds** ED leadership at 10:00 PM CST to review today's data
9. **Auto-purges** today's raw ED data at 11:50 PM CST if no human action is taken

---

## Quick Start (Development)

```bash
git clone https://github.com/bolajil/ed-sentinel.git
cd ed-sentinel/ed-sentinel
npm install
```

Create `.env.local` with your keys:

```env
MISTRAL_API_KEY=your_key_here
RESEND_API_KEY=your_key_here            # optional — email reports
PINECONE_API_KEY=your_key_here          # optional — vector RAG
PINECONE_INDEX_HOST=https://...         # optional — from Pinecone dashboard
LANGFUSE_PUBLIC_KEY=pk-lf-...           # optional — observability
LANGFUSE_SECRET_KEY=sk-lf-...           # optional — observability
```

Then start the dev server:

```bash
npm start
```

Open http://localhost:3000

---

## Local Production Deploy

```bash
npm run build:serve
```

Builds the React app and starts an Express server on **http://localhost:3001**.

Or separately:

```bash
npm run build    # build once
npm run serve    # start server
```

The server loads `.env.local` automatically on startup and warns if required keys are missing.

---

## Project Structure

```
ed-sentinel/
├── server.js                   Express server (production local deploy)
├── api/
│   ├── chat.js                 RAG-enhanced chat endpoint
│   ├── ingest.js               AI column mapping + Pinecone store
│   ├── send-report.js          Email report via Resend
│   └── _lib/
│       ├── embed.js            Mistral embedding (1024-dim)
│       ├── pinecone.js         Pinecone upsert/query per hospital namespace
│       └── langfuse.js         Langfuse trace + generation logging
└── src/
    ├── types/                  TypeScript interfaces
    ├── data/
    │   ├── tokens.ts           Design tokens (DARK / LIGHT)
    │   └── static.ts           Hospitals, metrics, cache baselines
    ├── hooks/
    │   ├── useMetrics.ts       Live metrics + EMA gliding
    │   ├── useChat.ts          Mistral chat integration + RAG context
    │   └── useHospitalStore.ts Per-hospital namespaced in-memory store
    ├── components/
    │   ├── MetricGrid.tsx
    │   ├── ChatPanel.tsx
    │   ├── HospitalSelector.tsx  Search + add hospital modal
    │   ├── DataIngestion.tsx
    │   ├── ReportModal.tsx
    │   └── PurgeClock.tsx
    └── App.tsx
```

---

## Observability with Langfuse

All LLM activity is traced in [Langfuse](https://cloud.langfuse.com) — sessions, token usage, cost, RAG hits, and data source per hospital.

### Setup

1. Go to [cloud.langfuse.com](https://cloud.langfuse.com) and create a project
2. Copy your **Public Key** and **Secret Key**
3. Add to `.env.local`:

```env
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com    # optional, this is the default
```

### What Gets Captured

| Event | Trace Name | Details |
|---|---|---|
| Chat message | `ed-sentinel-chat` | Model, input/output tokens, estimated USD cost, RAG hit count, data source |
| Data ingestion | `ed-sentinel-ingest` | File type, row count, metrics extracted, confidence score |

### Session Structure

- **Session ID**: `{hospitalId}-{YYYY-MM-DD}` — all messages for a hospital on the same day are grouped
- **User ID**: `hospitalId` (e.g. `facility_a`) — filter Langfuse by hospital
- **Tags**: `ed-sentinel`, `{hospitalId}`, `{dataSource}`

### Cost Tracking

Langfuse automatically computes estimated cost using Mistral Large pricing:
- Input: $2.00 / 1M tokens
- Output: $6.00 / 1M tokens

> Langfuse is fully optional. The app degrades gracefully if keys are not set.

---

## Vector RAG with Pinecone

Each hospital's data is stored in an isolated Pinecone namespace. A query for `facility_a` can never retrieve vectors from `facility_b`.

### Setup

1. Create a free account at [pinecone.io](https://pinecone.io)
2. Create an index: **name** = `ed-sentinel`, **dimensions** = `1024`, **metric** = `cosine`
3. Copy the index host URL from the dashboard
4. Add to `.env.local`:

```env
PINECONE_API_KEY=...
PINECONE_INDEX_HOST=https://ed-sentinel-xxxx.svc.us-east1-gcp.pinecone.io
```

### What Gets Stored

- **Chat exchanges** — every Q&A pair embedded and stored for future retrieval
- **Ingestion reports** — extracted metrics + quality notes embedded on ingest

> Pinecone is fully optional. The app degrades gracefully if keys are not set.

---

## Data Ingestion

Upload any CSV or JSON export from Epic, Cerner, Meditech, or any EHR:

1. Click the **Ingest** tab
2. Drag and drop or browse for a `.csv` or `.json` file
3. Mistral AI maps your columns to ED metrics automatically
4. Review the extracted values and confidence score
5. Click **Apply to Dashboard** — live metrics update to use your data

---

## Connecting Real EHR Data

Replace `simulateValue()` in `src/hooks/useMetrics.ts` with your FHIR R4 API calls.
Update `CACHE_BASELINES` in `src/data/static.ts` with your 4-week averages.
Update `HOSPITALS` in `src/data/static.ts` with your real facility list, or use the **Add Hospital** button in the UI.

---

Built by Lanre Bolaji · Huron Healthcare AI Platform · MIT License
