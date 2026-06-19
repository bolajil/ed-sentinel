// Runs inside CRA's dev server (Node.js) — keys never reach the browser
const express = require('express');

module.exports = function (app) {

  // ── Mistral chat proxy ──────────────────────────────────────────────────────
  app.use('/api/chat', express.json(), async (req, res) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'MISTRAL_API_KEY not set in .env.local' });
    try {
      const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(req.body),
      });
      return res.status(upstream.status).json(await upstream.json());
    } catch {
      return res.status(502).json({ error: 'Upstream API error' });
    }
  });

  // ── Resend email report proxy ───────────────────────────────────────────────
  app.use('/api/send-report', express.json(), async (req, res) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY not set in .env.local' });
    try {
      const upstream = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(req.body),
      });
      return res.status(upstream.status).json(await upstream.json());
    } catch {
      return res.status(502).json({ error: 'Email service error' });
    }
  });

};
