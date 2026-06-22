// Runs inside CRA's dev server (Node.js) — keys never reach the browser
const express = require('express');

module.exports = function (app) {

  // ── Chat (RAG-enhanced) — delegates to api/chat.js so local == production ──
  const chatHandler = require('../api/chat.js');
  app.use('/api/chat', express.json(), chatHandler);

  // ── AI data ingestion — reuse the serverless function directly ─────────────
  const ingestHandler = require('../api/ingest.js');
  app.use('/api/ingest', express.json({ limit: '10mb' }), ingestHandler);

  // ── Email report — delegates to api/send-report.js so local == production ──
  const sendReportHandler = require('../api/send-report.js');
  app.use('/api/send-report', express.json(), sendReportHandler);

};
