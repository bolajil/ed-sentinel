import React, { useState } from 'react';
import { MetricSnapshot } from '../types';
import { C, STATUS_CONFIG } from '../data/tokens';
import { CACHE_BASELINES } from '../data/static';

interface Props {
  metrics: MetricSnapshot[];
}

export const MetricGrid: React.FC<Props> = ({ metrics }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {metrics.map(m => {
        const s = STATUS_CONFIG[m.status];
        const isExp = expanded === m.id;
        const base = CACHE_BASELINES[m.cacheKey];
        const absDelta = base ? Math.abs(m.value - base).toFixed(1) : null;
        const deltaDir = (m.delta ?? 0) > 0 ? '▲' : (m.delta ?? 0) < 0 ? '▼' : '—';
        const deltaColor = m.status === 'critical' ? C.red : m.status === 'warning' ? C.yellow : C.green;

        return (
          <div
            key={m.id}
            onClick={() => setExpanded(isExp ? null : m.id)}
            style={{
              background: isExp ? C.card : C.panel,
              border: `1px solid ${isExp ? s.color : C.border}`,
              borderLeft: `3px solid ${s.color}`,
              borderRadius: 8,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>{m.label}</span>
              <span style={{ fontSize: 9, fontWeight: 700, background: s.bg, color: s.color, padding: '1px 5px', borderRadius: 3 }}>
                {s.icon} {s.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
                {m.unit === 'bool' ? (m.value === 1 ? 'OPEN' : 'CLOSED') : m.value}
              </span>
              {m.unit !== 'bool' && <span style={{ fontSize: 10, color: C.muted }}>{m.unit}</span>}
            </div>

            {isExp && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Cache Baseline</div>
                    <div style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>{base} {m.unit !== 'bool' ? m.unit : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Delta</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: deltaColor }}>{deltaDir} {m.delta !== null ? Math.abs(m.delta) + '%' : '—'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: C.muted }}>
                  Key: <span style={{ color: C.accent, fontFamily: 'monospace' }}>{m.cacheKey}</span>
                  {absDelta && <span> · Abs Δ: <span style={{ color: deltaColor }}>{absDelta} {m.unit}</span></span>}
                </div>
                <div style={{ marginTop: 6, fontSize: 9, color: s.color, background: s.bg, padding: '3px 6px', borderRadius: 3 }}>
                  {m.status === 'critical' && '⚠ Critical — agent flagged for synthesis'}
                  {m.status === 'warning'  && '▲ Warning — monitored, included in report'}
                  {m.status === 'ok'       && '✓ Within normal range'}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
