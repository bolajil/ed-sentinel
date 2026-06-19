# ED Sentinel Agent — Huron Healthcare AI Platform

> Real-time ED metric validation · Cache cross-check · Claude-powered chat · 10 PM reminder · 11:50 PM auto-purge

---

## What It Does

The ED Sentinel Agent monitors every incoming ED data event across multiple hospitals and:

1. **Validates** all 12 ED metrics are present and plausible on every tick
2. **Cross-checks** each value against a 4-week cache baseline
3. **Classifies** metrics as OK / WARNING / CRITICAL
4. **Answers questions** via a live chat interface powered by Claude
5. **Reminds** ED leadership at 10:00 PM CST to review today's data
6. **Auto-purges** today's raw ED data at 11:50 PM CST if no human action is taken

---

## Quick Start (Local)

```bash
git clone https://github.com/bolajil/ed-sentinel.git
cd ed-sentinel
npm install
npm start
```

Open http://localhost:3000

---

## Deploy to Your Own URL (Vercel)

### Option 1 — One-click

Click: https://vercel.com/new/clone?repository-url=https://github.com/bolajil/ed-sentinel

### Option 2 — CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 3 — Auto CI/CD via GitHub Actions

1. Import repo to Vercel at vercel.com
2. Add 3 secrets to GitHub repo Settings → Secrets → Actions:
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID
3. Every push to main auto-deploys

---

## Sharing With Colleagues

Share the Vercel URL — no login required.
To password-protect: Vercel Dashboard → Project Settings → Deployment Protection

---

## Project Structure

```
ed-sentinel/
├── src/
│   ├── types/              TypeScript interfaces
│   ├── data/
│   │   ├── tokens.ts       Design tokens
│   │   └── static.ts       Hospitals, metrics, cache baselines
│   ├── hooks/
│   │   ├── useMetrics.ts   Live metrics + classification
│   │   └── useChat.ts      Claude API integration
│   ├── components/
│   │   ├── MetricGrid.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── HospitalSelector.tsx
│   │   └── PurgeClock.tsx
│   └── App.tsx
├── .github/workflows/deploy.yml
└── vercel.json
```

---

## Connecting Real EHR Data

Replace simulateValue() in src/hooks/useMetrics.ts with your FHIR R4 API calls.
Update CACHE_BASELINES in src/data/static.ts with your Redis 4-week averages.
Update HOSPITALS in src/data/static.ts with your real facility list.

---

Built by Lanre Bolaji · Huron Healthcare AI Platform · MIT License
