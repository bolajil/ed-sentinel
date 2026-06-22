// Local production server
// Serves the React build + all /api/* routes under one process.
//
// Dev:        npm start          (CRA dev server + setupProxy.js)
// Production: npm run build && npm run serve

require('dotenv').config({ path: '.env.local' }); // secrets (gitignored)
require('dotenv').config();                         // DISABLE_ESLINT_PLUGIN etc.

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

// Security headers (mirrors what vercel.json provided)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Parse JSON bodies (10 MB limit for data ingestion payloads)
app.use(express.json({ limit: '10mb' }));

// API routes — handlers are Express-compatible (req, res) functions
app.post('/api/chat',        require('./api/chat'));
app.post('/api/ingest',      require('./api/ingest'));
app.post('/api/send-report', require('./api/send-report'));

// Static assets with long-lived cache
app.use('/static', express.static(path.join(__dirname, 'build', 'static'), {
  maxAge: '1y',
  immutable: true,
}));

// Serve React build
app.use(express.static(path.join(__dirname, 'build')));

// SPA fallback — all non-API routes return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\nED Sentinel running → http://localhost:${PORT}\n`);
  if (!process.env.MISTRAL_API_KEY) console.warn('  WARNING: MISTRAL_API_KEY not set in .env.local');
  if (!process.env.RESEND_API_KEY)  console.warn('  WARNING: RESEND_API_KEY not set in .env.local (email will fail)');
});
