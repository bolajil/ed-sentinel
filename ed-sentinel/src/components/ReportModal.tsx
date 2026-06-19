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
  critical: { color: '#FF3D5A', bg: '#FF3D5A22', label: 'CRITICAL', icon: '■' },
  warning:  { color: '#FFD166', bg: '#FFD16622', label: 'WARN',     icon: '▲' },
  ok:       { color: '#00E5A0', bg: '#00E5A022', label: 'OK',       icon: '●' },
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
  const timeStr = now.toLocaleTimeString('en-US');

  const criticals = metrics.filter(m => m.status === 'critical');
  const warnings  = metrics.filter(m => m.status === 'warning');
  const oks       = metrics.filter(m => m.status === 'ok');

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF       = (await import('jspdf')).default;

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#080C14',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW   = pdf.internal.pageSize.getWidth();
      const pageH   = pdf.internal.pageSize.getHeight();
      const imgH    = (canvas.height * pageW) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
      let remaining = imgH - pageH;
      let offset    = 0;
      while (remaining > 0) {
        offset -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH);
        remaining -= pageH;
      }

      pdf.save(`ED-Sentinel-${hospital.name.replace(/\s+/g, '-')}-${now.toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF error', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setSending(true);
    setSendStatus('idle');
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.trim(),
          hospitalName: hospital.name,
          hospitalCity: hospital.city,
          hospitalEhr:  hospital.ehr,
          hospitalBeds: hospital.beds,
          date: dateStr,
          time: timeStr,
          criticalCount: criticals.length,
          warningCount:  warnings.length,
          okCount:       oks.length,
          metrics: metrics.map(m => ({
            label:    m.label,
            value:    m.unit === 'bool' ? (m.value === 1 ? 'OPEN' : 'CLOSED') : `${m.value} ${m.unit}`,
            status:   m.status,
            baseline: m.unit !== 'bool' ? `${CACHE_BASELINES[m.cacheKey]} ${m.unit}` : '—',
            delta:    m.delta !== null && m.unit !== 'bool' ? `${m.delta > 0 ? '+' : ''}${m.delta}%` : '—',
          })),
          insights,
        }),
      });
      setSendStatus(res.ok ? 'sent' : 'error');
      if (res.ok) setEmail('');
    } catch {
      setSendStatus('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div style={{ flex: 1 }} onClick={onClose} />

      {/* Slide-over panel */}
      <div style={{
        width: 680, maxWidth: '95vw', height: '100vh', overflowY: 'auto',
        background: C.bg, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
      }}>

        {/* Sticky toolbar */}
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
          background: C.panel, position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>ED Sentinel Report</div>
            <div style={{ fontSize: 10, color: C.muted }}>{hospital.name} · {dateStr}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDownloadPDF} disabled={downloading} style={{
              background: C.accentDim, border: `1px solid ${C.accent}`,
              borderRadius: 6, padding: '7px 14px', color: C.accent,
              fontSize: 11, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer',
            }}>
              {downloading ? 'Generating…' : '⬇ Download PDF'}
            </button>
            <button onClick={onClose} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: '7px 12px', color: C.muted, fontSize: 13, cursor: 'pointer',
            }}>✕</button>
          </div>
        </div>

        {/* ── Printable content (html2canvas captures this div) ── */}
        <div ref={reportRef} style={{ padding: 24, background: C.bg }}>

          {/* Branding header */}
          <div style={{
            background: 'linear-gradient(135deg,#0A1628 0%,#080C14 100%)',
            border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px', marginBottom: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 9, color: '#00E5A0', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                  ● Huron Healthcare AI · ED Sentinel Agent
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 4 }}>
                  Emergency Department Report
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {hospital.name} · {hospital.city} · {hospital.ehr} EHR · {hospital.beds} beds
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: C.muted }}>Generated</div>
                <div style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>{dateStr}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{timeStr}</div>
              </div>
            </div>
          </div>

          {/* Status summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Critical', count: criticals.length, color: '#FF3D5A', bg: '#FF3D5A22' },
              { label: 'Warning',  count: warnings.length,  color: '#FFD166', bg: '#FFD16622' },
              { label: 'OK',       count: oks.length,       color: '#00E5A0', bg: '#00E5A022' },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg, border: `1px solid ${s.color}44`,
                borderRadius: 8, padding: '14px 16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 10, color: s.color, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontSize: 9, color: C.muted }}>metrics</div>
              </div>
            ))}
          </div>

          {/* Performance bar chart */}
          <div style={{
            background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '16px 20px', marginBottom: 18,
          }}>
            <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Metric Performance vs Critical Threshold
            </div>
            {metrics.filter(m => m.unit !== 'bool').map(m => {
              const s       = STATUS_CFG[m.status];
              const critVal = m.crit || 1;
              const pct     = Math.min(100, Math.round((m.value / critVal) * 100));
              const basePct = Math.min(100, Math.round(((CACHE_BASELINES[m.cacheKey] || 0) / critVal) * 100));
              return (
                <div key={m.id} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: C.text }}>{m.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>
                      {m.value} {m.unit}
                      <span style={{ fontSize: 9, color: C.muted, fontWeight: 400, marginLeft: 6 }}>
                        baseline {CACHE_BASELINES[m.cacheKey]}
                      </span>
                    </span>
                  </div>
                  <div style={{ height: 7, background: C.card, borderRadius: 4, position: 'relative' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 4 }} />
                    {/* Baseline marker */}
                    <div style={{
                      position: 'absolute', top: -2, left: `${basePct}%`,
                      width: 2, height: 11, background: C.accent, borderRadius: 1,
                    }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 10, fontSize: 9, color: C.muted }}>
              Bar = current value as % of critical threshold &nbsp;
              <span style={{ color: C.accent }}>│</span> = 4-week cache baseline
            </div>
          </div>

          {/* Metrics table */}
          <div style={{
            background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '16px 20px', marginBottom: 18,
          }}>
            <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Live Metric Snapshot
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Metric', 'Current', 'Baseline', 'Delta', 'Status'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => {
                  const s    = STATUS_CFG[m.status];
                  const base = CACHE_BASELINES[m.cacheKey];
                  return (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                      <td style={{ padding: '7px 8px', color: C.text }}>{m.label}</td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: s.color }}>
                        {m.unit === 'bool' ? (m.value === 1 ? 'OPEN' : 'CLOSED') : `${m.value} ${m.unit}`}
                      </td>
                      <td style={{ padding: '7px 8px', color: C.muted }}>
                        {m.unit !== 'bool' ? `${base} ${m.unit}` : '—'}
                      </td>
                      <td style={{ padding: '7px 8px', color: m.delta !== null && m.delta > 0 ? '#FF3D5A' : '#00E5A0' }}>
                        {m.delta !== null && m.unit !== 'bool' ? `${m.delta > 0 ? '+' : ''}${m.delta}%` : '—'}
                      </td>
                      <td style={{ padding: '7px 8px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>
                          {s.icon} {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AI Insights */}
          {insights && (
            <div style={{
              background: C.panel, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '16px 20px', marginBottom: 18,
            }}>
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                AI Insights — Sentinel Analysis
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                {insights}
              </div>
            </div>
          )}

          {/* Report footer */}
          <div style={{ textAlign: 'center', paddingTop: 12, borderTop: `1px solid ${C.border}22`, fontSize: 9, color: C.muted, lineHeight: 1.9 }}>
            Generated by ED Sentinel Agent · Huron Healthcare AI Platform<br />
            {dateStr} at {timeStr}<br />
            <strong style={{ color: C.muted }}>CONFIDENTIAL — For authorized internal use only</strong>
          </div>
        </div>
        {/* ── End printable content ── */}

        {/* Email section (not captured in PDF) */}
        <div style={{
          padding: '16px 20px', borderTop: `1px solid ${C.border}`,
          background: C.panel, flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            ✉ Email Report to Customer
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setSendStatus('idle'); }}
              onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
              placeholder="customer@hospital.com"
              style={{
                flex: 1, background: C.card,
                border: `1px solid ${sendStatus === 'error' ? '#FF3D5A' : C.border}`,
                borderRadius: 8, padding: '9px 12px', color: C.white, fontSize: 12, outline: 'none',
              }}
            />
            <button onClick={handleSendEmail} disabled={sending || !email.trim()} style={{
              background: sending || !email.trim() ? C.card : '#00E5A022',
              border: `1px solid ${sending || !email.trim() ? C.border : '#00E5A0'}`,
              borderRadius: 8, padding: '9px 16px',
              color: sending || !email.trim() ? C.muted : '#00E5A0',
              fontSize: 12, fontWeight: 700, cursor: sending || !email.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}>
              {sending ? 'Sending…' : 'Send Report'}
            </button>
          </div>
          {sendStatus === 'sent' && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#00E5A0' }}>✓ Report sent successfully</div>
          )}
          {sendStatus === 'error' && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#FF3D5A' }}>✕ Send failed — check RESEND_API_KEY in environment variables</div>
          )}
          <div style={{ marginTop: 6, fontSize: 9, color: C.muted }}>
            Requires RESEND_API_KEY · resend.com (free: 3,000 emails/month)
          </div>
        </div>
      </div>
    </div>
  );
};
