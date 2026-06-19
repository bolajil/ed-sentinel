// Runs inside CRA's dev server (Node.js) — key never reaches the browser
const express = require('express');

module.exports = function (app) {
  app.use('/api/chat', express.json(), async (req, res) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'MISTRAL_API_KEY not set in .env.local' });
    }
    try {
      const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(req.body),
      });
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    } catch (err) {
      return res.status(502).json({ error: 'Upstream API error' });
    }
  });
};
