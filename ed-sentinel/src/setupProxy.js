// Runs inside CRA's dev server (Node.js) — keys never reach the browser
const express = require('express');

module.exports = function (app) {

  // ── Chat (RAG-enhanced) — delegates to api/chat.js so local == production ──
  const chatHandler = require('../api/chat.js');
  app.use('/api/chat', express.json(), chatHandler);

  // ── AI data ingestion — reuse the serverless function directly ─────────────
  const ingestHandler = require('../api/ingest.js');
  app.use('/api/ingest', express.json({ limit: '10mb' }), ingestHandler);

  // ── Resend email report proxy ───────────────────────────────────────────────
  app.use('/api/send-report', express.json(), async (req, res) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[proxy] RESEND_API_KEY not found — add it to .env.local');
      return res.status(500).json({ error: 'RESEND_API_KEY not set in .env.local' });
    }
    try {
      const upstream = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify(req.body),
      });
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    } catch (err) {
      console.error('[proxy] Resend error:', err);
      return res.status(502).json({ error: 'Email service error: ' + err.message });
    }
  });

};
