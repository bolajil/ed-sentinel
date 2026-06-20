import React, { useRef, useState } from 'react';
import { MetricSnapshot, Hospital } from '../types';
import { useTheme } from '../context/ThemeContext';
import { CACHE_BASELINES } from '../data/static';

interface Props {
  hospital: Hospital;
  metrics: MetricSnapshot[];
  insights: string;
  onClose: () => void;
}

const STATUS_CFG = {
  critical: { color: '#FF3D5A', bg: '#FF3D5A14', border: '#FF3D5A44', label: 'CRITICAL' },
  warning:  { color: '#FFD166', bg: '#FFD16614', border: '#FFD16644', label: 'WARNING'  },
  ok:       { color: '#00E5A0', bg: '#00E5A014', border: '#00E5A044', label: 'OK'       },
} as const;

export const ReportModal: React.FC<Props> = ({ hospital, metrics, insights, onClose }) => {
  const { colors: C } = useTheme();
  const reportRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [downloading, setDownloading] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const criticals = metrics.filter(m => m.status === 'critical');
  const warnings  = metrics.filter(m => m.status === 'warning');
  const oks       = metrics.filter(m => m.status === 'ok');
  const flagged   = [...criticals, ...warnings];

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF       = (await import('jspdf')).default;
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#080C14' });
      const imgData = canvas.toDataURL('image/png');
      const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH  = (canvas.height * pageW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
      let remaining = imgH - pageH;
      let offset = 0;
      while (remaining > 0) { offset -= pageH; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH); remaining -= pageH; }
      pdf.save(`ED-Sentinel-${hospital.name.replace(/\s+/g, '-')}-${now.toISOString().split('T')[0]}.pdf`);
    } catch (e) { console.error('PDF error', e); }
    finally { setDownloading(false); }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setSending(true); setSendStatus('idle');
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.trim(),
          hospitalName: hospital.name, hospitalCity: hospital.city,
          hospitalEhr: hospital.ehr,  hospitalBeds: hospital.beds,
          date: dateStr, time: timeStr,
          criticalCount: criticals.length, warningCount: warnings.length, okCount: oks.length,
          metrics: metrics.map(m => ({
            label: m.label,
            value: m.unit === 'bool' ? (m.value === 1 ? 'OPEN' : 'CLOSED') : `${m.value} ${m.unit}`,
            status: m.status,
            baseline: m.unit !== 'bool' ? `${CACHE_BASELINES[m.cacheKey]} ${m.unit}` : '—',
            delta: m.delta !== null && m.unit !== 'bool' ? `${m.delta > 0 ? '+' : ''}${m.delta}%` : '—',
          })),
          insights,
        }),
      });
      setSendStatus(res.ok ? 'sent' : 'error');
      if (res.ok) setEmail('');
    } catch { setSendStatus('error'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ flex: 1 }} onClick={onClose} />

      <div style={{ width: 580, maxWidth: '95vw', height: '100vh', overflowY: 'auto', background: C.bg, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>

        {/* ── Toolbar ── */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: C.panel, position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>ED Sentinel Report</div>
            <div style={{ fontSize: 10, color: C.muted }}>{hospital.name} · {dateStr}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDownloadPDF} disabled={downloading} style={{ background: C.accentDim, border: `1px solid ${C.accent}`, borderRadius: 6, padding: '7px 14px', color: C.accent, fontSize: 11, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer' }}>
              {downloading ? 'Generating…' : '⬇ Download PDF'}
            </button>
            <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 12px', color: C.muted, fontSize: 13, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* ── Printable content ── */}
        <div ref={reportRef} style={{ padding: 24, background: C.bg, flex: 1 }}>

          {/* 1. Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: '#00E5A0', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
              ● Huron Healthcare AI · ED Sentinel Agent
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 2 }}>Emergency Department Report</div>
            <div style={{ fontSize: 11, color: C.muted }}>{hospital.name} · {hospital.city} · {hospital.ehr} · {hospital.beds} beds</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{dateStr} at {timeStr}</div>
          </div>

          {/* 2. Status summary — 3 big numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Critical', count: criticals.length, color: '#FF3D5A', bg: '#FF3D5A14' },
              { label: 'Warning',  count: warnings.length,  color: '#FFD166', bg: '#FFD16614' },
              { label: 'OK',       count: oks.length,       color: '#00E5A0', bg: '#00E5A014' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}33`, borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: 11, color: s.color, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 3. Flagged metrics — only critical + warning */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              {flagged.length === 0 ? '✓ All Metrics Within Normal Range' : `Metrics Requiring Attention (${flagged.length})`}
            </div>

            {flagged.length === 0 ? (
              <div style={{ fontSize: 12, color: C.green }}>No critical or warning conditions at time of report.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {flagged.map(m => {
                  const s    = STATUS_CFG[m.status];
                  const base = CACHE_BASELINES[m.cacheKey];
                  const displayVal = m.unit === 'bool' ? (m.value === 1 ? 'OPEN' : 'CLOSED') : `${m.value} ${m.unit}`;
                  return (
                    <div key={m.id} style={{ borderLeft: `3px solid ${s.color}`, background: s.bg, borderRadius: '0 6px 6px 0', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{m.label}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{displayVal}</span>
                      </div>
                      {m.unit !== 'bool' && (
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                          4-week baseline: {base} {m.unit}
                          {m.delta !== null && (
                            <span style={{ color: s.color, marginLeft: 8, fontWeight: 600 }}>
                              {m.delta > 0 ? '+' : ''}{m.delta}% vs baseline
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. AI Insights */}
          {insights && (
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                AI Insights — Sentinel Analysis
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{insights}</div>
            </div>
          )}

          {/* 5. All metrics — compact 2-col grid */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              All Metrics at a Glance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {metrics.map(m => {
                const s = STATUS_CFG[m.status];
                const displayVal = m.unit === 'bool' ? (m.value === 1 ? 'OPEN' : 'CLOSED') : `${m.value} ${m.unit}`;
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: C.card, borderRadius: 6, borderLeft: `2px solid ${s.color}` }}>
                    <span style={{ fontSize: 10, color: C.muted }}>{m.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{displayVal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: 9, color: C.muted, borderTop: `1px solid ${C.border}22`, paddingTop: 12, lineHeight: 1.8 }}>
            Generated by ED Sentinel Agent · Huron Healthcare AI Platform · {dateStr} {timeStr}<br />
            <strong style={{ color: C.muted }}>CONFIDENTIAL — For authorized internal use only</strong>
          </div>
        </div>

        {/* ── Email section ── */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, background: C.panel, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            ✉ Email Report to Customer
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setSendStatus('idle'); }}
              onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
              placeholder="customer@hospital.com"
              style={{ flex: 1, background: C.card, border: `1px solid ${sendStatus === 'error' ? '#FF3D5A' : C.border}`, borderRadius: 8, padding: '9px 12px', color: C.white, fontSize: 12, outline: 'none' }}
            />
            <button onClick={handleSendEmail} disabled={sending || !email.trim()} style={{ background: sending || !email.trim() ? C.card : '#00E5A014', border: `1px solid ${sending || !email.trim() ? C.border : '#00E5A0'}`, borderRadius: 8, padding: '9px 16px', color: sending || !email.trim() ? C.muted : '#00E5A0', fontSize: 12, fontWeight: 700, cursor: sending || !email.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
              {sending ? 'Sending…' : 'Send Report'}
            </button>
          </div>
          {sendStatus === 'sent' && <div style={{ marginTop: 8, fontSize: 11, color: '#00E5A0' }}>✓ Report sent successfully</div>}
          {sendStatus === 'error' && <div style={{ marginTop: 8, fontSize: 11, color: '#FF3D5A' }}>✕ Send failed — check RESEND_API_KEY in environment variables</div>}
          <div style={{ marginTop: 6, fontSize: 9, color: C.muted }}>Requires RESEND_API_KEY · resend.com (free: 3,000 emails/month)</div>
        </div>

      </div>
    </div>
  );
};
