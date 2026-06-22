# ed-sentinel

## Overview
ED Command Center — a real-time healthcare AI dashboard for monitoring Emergency Department metrics across multiple hospitals. Built for Huron Healthcare AI as a demo/prototype.

## Architecture
- Single-page React app (Create React App + TypeScript)
- No backend — all metrics are simulated client-side via sine-wave gliding
- Sentinel Chat panel powered by Claude API (via `useChat` hook)
- Theme system via React Context (`ThemeContext`)

## Tech Stack
- React 19 + TypeScript
- Create React App (react-scripts 5)
- Inline styles throughout (no CSS framework)
- Deployed on Vercel

## Directory Structure
```
ed-sentinel/          ← git repo root
  README.md
  ed-sentinel/        ← React app root (Vercel Root Directory = "ed-sentinel")
    src/
      App.tsx               ← shell, routing, purge state
      context/
        ThemeContext.tsx     ← DARK/LIGHT theme provider + useTheme hook
      components/
        MetricGrid.tsx       ← 3-col grid of 12 ED metric cards
        ChatPanel.tsx        ← Sentinel Chat sidebar (Claude-powered)
        HospitalSelector.tsx ← hospital tab switcher
        PurgeClock.tsx       ← daily data purge demo
      data/
        tokens.ts            ← DARK + LIGHT color sets, Colors type
        static.ts            ← hospital list, metric defs, cache baselines
      hooks/
        useMetrics.ts        ← sine-wave metric simulation with EMA gliding
        useChat.ts           ← Claude API chat integration
      types/index.ts
    vercel.json              ← rewrites for SPA routing
    .env                     ← DISABLE_ESLINT_PLUGIN=true
```

## Development Guidelines
- All colors come from `useTheme().colors` — never import `C` from tokens directly
- Metric simulation: targets are pure sine waves, displayed values glide 12%/sec toward target (no random noise)
- ESLint is disabled as a hard build error via `.env` (`DISABLE_ESLINT_PLUGIN=true`)
- Local branch is `master`; Vercel deploys from `main` — always push with `git push origin master:main`

## Key Decisions & Context
- `Colors` type is `{ [K in keyof typeof DARK]: string }` (widened) so both DARK and LIGHT satisfy it
- Vercel Root Directory must be set to `ed-sentinel` (the inner folder) in project settings
- Metric cards: value font 28px, label 12px, padding 14px 16px — sized for command center readability
- Theme toggle (☀️/🌙) in top-right header bar

## Active Work
- Deployed and stable at ed-sentinel.vercel.app
