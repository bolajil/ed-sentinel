import React, { useState } from 'react';
import { PurgeLogEntry, PurgeState } from '../types';
import { useTheme } from '../context/ThemeContext';

interface Props {
  demoMinutes: number;
  onMinutesChange: (m: number) => void;
  purgeState: PurgeState;
  actionTaken: boolean;
  purgeLog: PurgeLogEntry[];
  onAction: (type: 'save' | 'purge') => void;
}

const fmtMin = (m: number) => {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${ampm} CST`;
};

const Countdown: React.FC<{ toMin: number; nowMin: number; label: string; color: string; mutedColor: string }> = ({ toMin, nowMin, label, color, mutedColor }) => {
  const diff = Math.max(0, toMin - nowMin);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {h > 0 ? `${h}h ${m}m` : `${m}m`}
      </div>
      <div style={{ fontSize: 9, color: mutedColor, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  );
};

export const PurgeClock: React.FC<Props> = ({ demoMinutes, onMinutesChange, purgeState, actionTaken, purgeLog, onAction }) => {
  const { colors: C } = useTheme();
  const quickJumps = [
    { label: '2 PM', min: 840 }, { label: '9 PM', min: 1260 },
    { label: '10 PM', min: 1320 }, { label: '11 PM', min: 1380 }, { label: '11:50 PM', min: 1430 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Time slider */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Demo Time Control</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
          <input type="range" min={0} max={1439} value={demoMinutes}
            onChange={e => onMinutesChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: C.accent }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.white, minWidth: 110, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtMin(demoMinutes)}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {quickJumps.map(p => (
            <button key={p.min} onClick={() => onMinutesChange(p.min)} style={{
              background: demoMinutes === p.min ? C.accentDim : C.card,
              border: `1px solid ${demoMinutes === p.min ? C.accent : C.border}`,
              borderRadius: 6, padding: '4px 10px', color: demoMinutes === p.min ? C.accent : C.muted,
              fontSize: 10, cursor: 'pointer', fontWeight: 600,
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Countdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: C.card, border: `1px solid ${C.orange}44`, borderRadius: 8, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.orange, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>🔔 Reminder fires</div>
          <Countdown toMin={22 * 60} nowMin={demoMinutes} label="until 10:00 PM" color={C.orange} mutedColor={C.muted} />
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.red}44`, borderRadius: 8, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.red, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>🗑 Auto-purge</div>
          <Countdown toMin={23 * 60 + 50} nowMin={demoMinutes} label="until 11:50 PM" color={C.red} mutedColor={C.muted} />
        </div>
      </div>

      {/* Human action */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Human Action</div>

        {purgeState === 'idle' && (
          <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.7 }}>
            Monitoring. At <span style={{ color: C.orange }}>10:00 PM CST</span> a reminder will be pushed. You'll have until <span style={{ color: C.red }}>11:50 PM CST</span> to save or purge today's data.
          </div>
        )}

        {(purgeState === 'reminder_sent' || purgeState === 'auto_purge') && !actionTaken && (
          <div>
            <div style={{ background: `${C.orange}18`, border: `1px solid ${C.orange}55`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.orange, marginBottom: 4 }}>🔔 Daily ED Data Review</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                Today's report is ready. Confirm data disposition before <span style={{ color: C.red }}>11:50 PM CST</span> or data auto-purges.
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => onAction('save')} style={{ background: C.greenDim, border: `1px solid ${C.green}`, borderRadius: 8, padding: '10px', color: C.green, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ✓ Save & Archive
              </button>
              <button onClick={() => onAction('purge')} style={{ background: C.redDim, border: `1px solid ${C.red}`, borderRadius: 8, padding: '10px', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                🗑 Purge Now
              </button>
            </div>
          </div>
        )}

        {actionTaken && purgeLog.map((e, i) => (
          <div key={i} style={{ background: e.type === 'save' ? C.greenDim : C.redDim, border: `1px solid ${e.type === 'save' ? C.green : C.red}55`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: e.type === 'save' ? C.green : C.red, marginBottom: 3 }}>
              {e.type === 'save' ? '✓ Archived' : '🗑 Purged'}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{e.time} — {e.msg}</div>
          </div>
        ))}
      </div>

      {/* Audit log */}
      {purgeLog.length > 0 && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Purge Audit Log</div>
          {purgeLog.map((e, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 10, color: e.type === 'save' ? C.green : C.red, marginBottom: 4 }}>
              [{e.time}] {e.type.toUpperCase()} — {e.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
