module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const {
    to, hospitalName, hospitalCity, hospitalEhr, hospitalBeds,
    date, time, criticalCount, warningCount, okCount, metrics, insights,
  } = req.body;

  if (!to || !hospitalName) {
    return res.status(400).json({ error: 'Missing required fields: to, hospitalName' });
  }

  const STATUS_STYLE = {
    critical: { text: '#FF3D5A', badge: '#FF3D5A22', label: '■ CRITICAL' },
    warning:  { text: '#FFD166', badge: '#FFD16622', label: '▲ WARN' },
    ok:       { text: '#00E5A0', badge: '#00E5A022', label: '● OK' },
  };

  const metricsRows = (metrics || []).map(m => {
    const s = STATUS_STYLE[m.status] || STATUS_STYLE.ok;
    const deltaColor = m.delta && m.delta.startsWith('+') ? '#FF3D5A' : '#00E5A0';
    return `
      <tr style="border-bottom:1px solid #1A2D45;">
        <td style="padding:8px 12px;color:#CBD5E1;font-size:12px;">${m.label}</td>
        <td style="padding:8px 12px;font-weight:700;color:${s.text};font-size:12px;">${m.value}</td>
        <td style="padding:8px 12px;color:#475569;font-size:11px;">${m.baseline}</td>
        <td style="padding:8px 12px;color:${deltaColor};font-size:11px;">${m.delta}</td>
        <td style="padding:8px 12px;">
          <span style="background:${s.badge};color:${s.text};padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700;">${s.label}</span>
        </td>
      </tr>`;
  }).join('');

  const insightsBlock = insights ? `
    <div style="background:#111B2B;border:1px solid #1A2D45;border-radius:10px;padding:20px;margin-bottom:20px;">
      <div style="font-size:10px;color:#00D4FF;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">
        AI Insights — Sentinel Analysis
      </div>
      <div style="font-size:12px;color:#CBD5E1;line-height:1.8;white-space:pre-wrap;">${insights}</div>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D1420;font-family:Arial,sans-serif;">
<div style="max-width:680px;margin:0 auto;padding:24px 16px;">

  <div style="background:linear-gradient(135deg,#0A1628 0%,#080C14 100%);border:1px solid #1A2D45;border-radius:10px;padding:24px;margin-bottom:20px;">
    <div style="font-size:9px;color:#00E5A0;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:8px;">
      ● HURON HEALTHCARE AI · ED SENTINEL AGENT
    </div>
    <div style="font-size:22px;font-weight:700;color:#F8FAFC;margin-bottom:6px;">Emergency Department Report</div>
    <div style="font-size:12px;color:#475569;">
      ${hospitalName} · ${hospitalCity} · ${hospitalEhr} EHR · ${hospitalBeds} beds
    </div>
    <div style="font-size:11px;color:#475569;margin-top:6px;">Generated: ${date} at ${time}</div>
  </div>

  <table style="width:100%;border-collapse:separate;border-spacing:10px;margin-bottom:10px;">
    <tr>
      <td style="background:#FF3D5A22;border:1px solid #FF3D5A44;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:32px;font-weight:700;color:#FF3D5A;">${criticalCount}</div>
        <div style="font-size:10px;color:#FF3D5A;text-transform:uppercase;letter-spacing:1px;">Critical</div>
      </td>
      <td style="background:#FFD16622;border:1px solid #FFD16644;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:32px;font-weight:700;color:#FFD166;">${warningCount}</div>
        <div style="font-size:10px;color:#FFD166;text-transform:uppercase;letter-spacing:1px;">Warning</div>
      </td>
      <td style="background:#00E5A022;border:1px solid #00E5A044;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:32px;font-weight:700;color:#00E5A0;">${okCount}</div>
        <div style="font-size:10px;color:#00E5A0;text-transform:uppercase;letter-spacing:1px;">OK</div>
      </td>
    </tr>
  </table>

  <div style="background:#111B2B;border:1px solid #1A2D45;border-radius:10px;padding:20px;margin-bottom:20px;">
    <div style="font-size:10px;color:#00D4FF;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">
      Live Metric Snapshot
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #1A2D45;">
          <th style="padding:6px 12px;text-align:left;color:#475569;font-size:9px;text-transform:uppercase;">Metric</th>
          <th style="padding:6px 12px;text-align:left;color:#475569;font-size:9px;text-transform:uppercase;">Current</th>
          <th style="padding:6px 12px;text-align:left;color:#475569;font-size:9px;text-transform:uppercase;">Baseline</th>
          <th style="padding:6px 12px;text-align:left;color:#475569;font-size:9px;text-transform:uppercase;">Delta</th>
          <th style="padding:6px 12px;text-align:left;color:#475569;font-size:9px;text-transform:uppercase;">Status</th>
        </tr>
      </thead>
      <tbody>${metricsRows}</tbody>
    </table>
  </div>

  ${insightsBlock}

  <div style="text-align:center;font-size:9px;color:#475569;padding-top:16px;border-top:1px solid #1A2D4533;line-height:1.8;">
    Generated by ED Sentinel Agent · Huron Healthcare AI Platform<br>
    ${date} at ${time}<br>
    <strong>CONFIDENTIAL — For authorized internal use only</strong>
  </div>

</div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'ED Sentinel <onboarding@resend.dev>',
        to: [to],
        subject: `ED Sentinel Report — ${hospitalName} — ${date}`,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(response.status).json({ error: data.message || 'Email send failed' });
    }
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('send-report error:', err);
    return res.status(502).json({ error: 'Failed to reach email service' });
  }
};
