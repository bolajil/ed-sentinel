# ed-sentinel

## Overview
ED Command Center — a real-time healthcare AI dashboard for monitoring Emergency Department metrics across multiple hospitals. Built for Huron Healthcare AI as a demo/prototype.

## Architecture
- Single-page React app (Create React App + TypeScript)
- Express server (`server.js`) serves the React build + all API routes
- Sentinel Chat panel powered by Mistral AI (`mistral-large-latest`)
- RAG: Pinecone vector store (namespace per hospital) + Mistral embeddings
- Observability: Langfuse traces per session (hospital + date)
- Theme system via React Context (`ThemeContext`)

## Tech Stack
- React 19 + TypeScript
- Create React App (react-scripts 5)
- Express 4 (local production server)
- Mistral AI (chat + embeddings)
- Pinecone (vector RAG, optional)
- Langfuse (observability, optional)
- Resend (email reports, optional)
- Inline styles throughout (no CSS framework)
- **Deployed locally only — no Vercel**

## Directory Structure
```
ed-sentinel/          ← git repo root
  CLAUDE.md
  ed-sentinel/        ← React app + server root
    server.js               ← Express server (production local deploy)
    src/
      App.tsx               ← shell, routing, hospital state, event log
      context/
        ThemeContext.tsx     ← DARK/LIGHT theme provider + useTheme hook
      components/
        MetricGrid.tsx       ← 3-col grid of 12 ED metric cards
        ChatPanel.tsx        ← Sentinel Chat sidebar (Mistral-powered)
        HospitalSelector.tsx ← hospital search, tab switcher, add modal
        PurgeClock.tsx       ← daily data purge demo
        DataIngestion.tsx    ← CSV/JSON upload + AI column mapping
        ReportModal.tsx      ← PDF + email report generator
      data/
        tokens.ts            ← DARK + LIGHT color sets, Colors type
        static.ts            ← hospital list, metric defs, cache baselines
      hooks/
        useMetrics.ts        ← sine-wave metric simulation with EMA gliding
        useChat.ts           ← Mistral chat + RAG context builder
        useHospitalStore.ts  ← per-hospital namespaced in-memory store
      types/index.ts
    api/
      chat.js               ← RAG-enhanced chat (embed → Pinecone → Mistral → Langfuse)
      ingest.js             ← AI column mapping + Pinecone store + Langfuse
      send-report.js        ← Resend email with branded HTML
      _lib/
        embed.js            ← Mistral mistral-embed (1024-dim)
        pinecone.js         ← Pinecone upsert/query, namespace per hospital
        langfuse.js         ← Langfuse trace/generation logging
    .env                    ← DISABLE_ESLINT_PLUGIN=true (committed)
    .env.local              ← secrets (gitignored)
```

## Development Commands
```bash
# Dev (hot reload, CRA proxy handles /api/* routes)
npm start

# Production local deploy
npm run build        # builds React to build/
npm run serve        # starts Express server on :3001
# or combined:
npm run build:serve
```

## Development Guidelines
- All colors come from `useTheme().colors` — never import `C` from tokens directly
- Metric simulation: targets are pure sine waves, displayed values glide 12%/sec toward target (no random noise)
- ESLint is disabled as a hard build error via `.env` (`DISABLE_ESLINT_PLUGIN=true`)
- Push: `git push origin master` (sync only) or `git push origin master:main` (if re-enabling remote)
- All /api handlers use Express-compatible `(req, res)` — same code runs in dev proxy and production server

## Environment Variables (.env.local)
```
MISTRAL_API_KEY=...         required
RESEND_API_KEY=...          optional (email reports)
RESEND_FROM_EMAIL=...       optional (defaults to onboarding@resend.dev)
PINECONE_API_KEY=...        optional (vector RAG)
PINECONE_INDEX_HOST=...     optional (vector RAG index URL)
LANGFUSE_PUBLIC_KEY=...     optional (observability)
LANGFUSE_SECRET_KEY=...     optional (observability)
PORT=3001                   optional (default 3001)
```

## Key Decisions & Context
- `Colors` type is `{ [K in keyof typeof DARK]: string }` (widened) so both DARK and LIGHT satisfy it
- Hospital isolation: Pinecone namespace = hospital.id; never cross-queries between hospitals
- Langfuse sessionId = `hospitalId-YYYY-MM-DD` so sessions group by hospital per day
- Pinecone, Langfuse, and Resend are all optional — app degrades gracefully if not configured
- Metric cards: value font 28px, label 12px, padding 14px 16px — sized for command center readability

## Active Work
- Local deployment only
