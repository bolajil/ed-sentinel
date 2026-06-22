import React, { useState, useEffect, useCallback } from 'react';
<<<<<<< HEAD
import { Hospital, PurgeLogEntry, PurgeState } from './types';
=======
import { Hospital, PurgeLogEntry, PurgeState, EventLogEntry } from './types';
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
import { HOSPITALS } from './data/static';
import { useMetrics } from './hooks/useMetrics';
import { useChat } from './hooks/useChat';
import { useHospitalStore } from './hooks/useHospitalStore';
import { useTheme } from './context/ThemeContext';
import { MetricGrid } from './components/MetricGrid';
import { ChatPanel } from './components/ChatPanel';
import { HospitalSelector } from './components/HospitalSelector';
import { PurgeClock } from './components/PurgeClock';
import { ReportModal } from './components/ReportModal';
import { DataIngestion } from './components/DataIngestion';

function getPurgeState(nowMin: number): PurgeState {
  if (nowMin < 22 * 60) return 'idle';
  if (nowMin < 23 * 60 + 50) return 'reminder_sent';
  return 'auto_purge';
}

export default function App() {
  const { colors: C, isDark, toggle } = useTheme();

<<<<<<< HEAD
=======
  const [hospitals, setHospitals] = useState<Hospital[]>(HOSPITALS);
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
  const [hospital, setHospital] = useState<Hospital>(HOSPITALS[0]);
  const [paused, setPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingest' | 'purge' | 'log'>('dashboard');
  const [demoMinutes, setDemoMinutes] = useState(840);
  const [actionTaken, setActionTaken] = useState(false);
  const [purgeLog, setPurgeLog] = useState<PurgeLogEntry[]>([]);
<<<<<<< HEAD
  const [eventLog, setEventLog] = useState<string[]>([]);
=======
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
  const [reportOpen, setReportOpen] = useState(false);
  const [reportInsights, setReportInsights] = useState('');

  // Per-hospital namespaced store — each hospital ID is fully isolated
  const store = useHospitalStore(hospital.id);
  const { metrics, tick } = useMetrics(paused, store.ingestedData);

  const chatCtx = {
    metrics,
    history: store.history,
    baselines: store.baselines,
    dataSource: store.ingestedData ? 'ingested' as const : 'simulated' as const,
  };
  const { messages, loading, sendMessage, resetChat } = useChat(hospital, chatCtx);

  const purgeState = getPurgeState(demoMinutes);
  const critCount = metrics.filter(m => m.status === 'critical').length;
  const warnCount = metrics.filter(m => m.status === 'warning').length;

  // Record metric snapshot into this hospital's namespace on each tick
  useEffect(() => {
    store.recordSnapshot(metrics, tick);
<<<<<<< HEAD
    const crit = metrics.filter(m => m.status === 'critical').map(m => m.label).join(', ');
    const entry = `[${new Date().toLocaleTimeString()}] Tick #${tick} · ${hospital.name} · Crit: ${crit || 'none'}`;
    setEventLog(prev => [entry, ...prev].slice(0, 40));
=======
    const critMetrics = metrics.filter(m => m.status === 'critical').map(m => m.label);
    const warnMetrics = metrics.filter(m => m.status === 'warning').map(m => m.label);
    const entry: EventLogEntry = {
      id: `${tick}-${hospital.id}`,
      timestamp: new Date().toLocaleTimeString(),
      tick,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      summary: `Tick #${tick} · ${critMetrics.length ? `CRIT: ${critMetrics.join(', ')}` : 'No critical alerts'}`,
      critMetrics,
      warnMetrics,
      snapshot: metrics,
    };
    setEventLog(prev => [entry, ...prev].slice(0, 60));
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, hospital.name, metrics]);

  useEffect(() => {
    if (purgeState === 'auto_purge' && !actionTaken) {
      setActionTaken(true);
      setPurgeLog(l => [...l, {
        time: '11:50 PM CST',
        type: 'auto_purge',
        msg: `Auto-purged ${hospital.name} daily ED data. No human action received.`,
      }]);
    }
  }, [purgeState, actionTaken, hospital.name]);

  const handleHospitalChange = useCallback((h: Hospital) => {
    setHospital(h);
    resetChat(h);
    setActionTaken(false);
    setPurgeLog([]);
  }, [resetChat]);

  const handleAction = useCallback((type: 'save' | 'purge') => {
    setActionTaken(true);
    setPurgeLog(l => [...l, {
      time: new Date().toLocaleTimeString(),
      type,
      msg: type === 'save'
        ? `${hospital.name} daily data preserved to long-term store.`
        : `${hospital.name} daily data purged by human action.`,
    }]);
  }, [hospital.name]);

  const handleGenerateReport = useCallback((insights: string) => {
    setReportInsights(insights);
    setReportOpen(true);
  }, []);

  const handleMinutesChange = (m: number) => {
    setDemoMinutes(m);
    setActionTaken(false);
    setPurgeLog([]);
  };

  const tabs = [
    { id: 'dashboard', label: '⚡ Dashboard' },
    { id: 'ingest',    label: store.ingestedData ? '📥 Ingest  ●' : '📥 Ingest' },
    { id: 'purge',     label: '🕐 Purge Clock' },
    { id: 'log',       label: '📋 Event Log' },
  ] as const;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", color: C.text, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: '16px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
              <span style={{ fontSize: 9, color: C.green, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>Huron Healthcare AI · ED Sentinel Agent</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.white, letterSpacing: -0.5 }}>ED Command Center</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {[
              { val: critCount, label: 'Critical', color: C.red },
              { val: warnCount, label: 'Warning',  color: C.yellow },
              { val: 12 - critCount - warnCount, label: 'OK', color: C.green },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', minWidth: 52 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
            {store.ingestedData && (
              <div style={{ background: '#00E5A014', border: '1px solid #00E5A044', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A0' }} />
                <span style={{ fontSize: 10, color: '#00E5A0', fontWeight: 700 }}>Live Data — {hospital.name}</span>
                <button onClick={store.clearIngestedData} style={{ background: 'none', border: 'none', color: '#00E5A088', cursor: 'pointer', fontSize: 12, padding: 0, marginLeft: 2 }}>✕</button>
              </div>
            )}
            <button
              onClick={toggle}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '6px 10px',
                color: C.muted,
                fontSize: 16,
                cursor: 'pointer',
                lineHeight: 1,
                transition: 'all 0.2s',
              }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setPaused(v => !v)} style={{
              background: paused ? C.accentDim : C.card, border: `1px solid ${paused ? C.accent : C.border}`,
              borderRadius: 8, padding: '6px 12px', color: paused ? C.accent : C.muted,
              fontSize: 11, cursor: 'pointer', fontWeight: 600,
            }}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
          </div>
        </div>
<<<<<<< HEAD
        <HospitalSelector selected={hospital} onChange={handleHospitalChange} />
=======
        <HospitalSelector
          hospitals={hospitals}
          selected={hospital}
          onChange={handleHospitalChange}
          onAddHospital={h => setHospitals(prev => [...prev, h])}
        />
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.panel, padding: '0 24px', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
            padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            color: activeTab === t.id ? C.accent : C.muted,
            borderBottom: activeTab === t.id ? `2px solid ${C.accent}` : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.2s',
          }}>{t.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 4 }}>
          <span style={{ fontSize: 9, color: C.muted }}>Tick #{tick} · {hospital.ehr}</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, minHeight: 600 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                Live Metrics — {hospital.name} <span style={{ color: C.accent, marginLeft: 6 }}>Click any metric to expand</span>
              </div>
              <MetricGrid metrics={metrics} />
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Cache Cross-Check</span>
                  {[
                    { label: 'Validated', val: 12, color: C.white },
                    { label: 'Cache hits', val: 12, color: C.green },
                    { label: 'Above baseline', val: metrics.filter(m => (m.delta ?? 0) > 10).length, color: C.yellow },
                    { label: 'Anomalies', val: critCount, color: C.red },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</span>
                      <span style={{ fontSize: 10, color: C.muted }}>{s.label}</span>
                    </div>
                  ))}
                  <div style={{ marginLeft: 'auto', fontSize: 10, color: C.muted }}>
                    Fast-track: <span style={{ color: metrics.find(m => m.id === 'fast_track_open')?.value === 1 ? C.green : C.red, fontWeight: 600 }}>
                      {metrics.find(m => m.id === 'fast_track_open')?.value === 1 ? 'OPEN' : 'CLOSED'}
                    </span>
                    <span style={{ marginLeft: 10 }}>Hours: <span style={{ color: C.accent }}>{hospital.ftHours}</span></span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ minHeight: 560 }}>
              <ChatPanel messages={messages} loading={loading} onSend={sendMessage} onGenerateReport={handleGenerateReport} />
            </div>
          </div>
        )}

        {activeTab === 'ingest' && (
          <DataIngestion
            hospital={hospital}
            hasIngested={!!store.ingestedData}
            onApply={values => {
              store.setIngestedData(values);
              setActiveTab('dashboard');
            }}
            onClear={store.clearIngestedData}
          />
        )}

        {activeTab === 'purge' && (
          <div style={{ maxWidth: 700 }}>
            <PurgeClock
              demoMinutes={demoMinutes}
              onMinutesChange={handleMinutesChange}
              purgeState={purgeState}
              actionTaken={actionTaken}
              purgeLog={purgeLog}
              onAction={handleAction}
            />
          </div>
        )}

        {activeTab === 'log' && (
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
<<<<<<< HEAD
            <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Live Agent Event Stream</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.9 }}>
              {eventLog.map((e, i) => (
                <div key={i} style={{ color: i === 0 ? C.green : C.muted, borderBottom: `1px solid ${C.border}22`, paddingBottom: 2 }}>{e}</div>
              ))}
=======
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Live Agent Event Stream</div>
              <span style={{ fontSize: 9, color: C.muted }}>{eventLog.length} events · click any row to expand</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
              {eventLog.map((entry, i) => {
                const isExpanded = expandedLogId === entry.id;
                const isLatest = i === 0;
                return (
                  <div key={entry.id}>
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '5px 8px', borderRadius: 4, cursor: 'pointer',
                        background: isExpanded ? `${C.accent}11` : 'transparent',
                        borderBottom: `1px solid ${C.border}22`,
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <span style={{ color: C.muted, flexShrink: 0 }}>{entry.timestamp}</span>
                        <span style={{ color: C.accent, flexShrink: 0 }}>{entry.hospitalName}</span>
                        <span style={{ color: isLatest ? C.green : (entry.critMetrics.length > 0 ? C.red : C.muted), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.summary}
                        </span>
                        {entry.critMetrics.length > 0 && (
                          <span style={{ background: `${C.red}22`, color: C.red, borderRadius: 3, padding: '1px 5px', fontSize: 9, flexShrink: 0 }}>
                            {entry.critMetrics.length} CRIT
                          </span>
                        )}
                        {entry.warnMetrics.length > 0 && (
                          <span style={{ background: `${C.yellow}22`, color: C.yellow, borderRadius: 3, padding: '1px 5px', fontSize: 9, flexShrink: 0 }}>
                            {entry.warnMetrics.length} WARN
                          </span>
                        )}
                      </div>
                      <span style={{ color: C.muted, fontSize: 10, marginLeft: 8, flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {isExpanded && (
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, margin: '4px 0 8px', padding: 12 }}>
                        <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                          Metric Snapshot — Tick #{entry.tick} — {entry.hospitalName}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                          {entry.snapshot.map(m => (
                            <div key={m.id} style={{
                              background: C.panel, borderRadius: 4, padding: '6px 10px',
                              borderLeft: `3px solid ${m.status === 'critical' ? C.red : m.status === 'warning' ? C.yellow : C.green}`,
                            }}>
                              <div style={{ fontSize: 9, color: C.muted }}>{m.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: m.status === 'critical' ? C.red : m.status === 'warning' ? C.yellow : C.text }}>
                                {m.unit === 'bool' ? (m.value === 1 ? 'OPEN' : 'CLOSED') : `${m.value.toFixed(m.unit === '%' ? 1 : 0)} ${m.unit !== 'bool' ? m.unit : ''}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
            </div>
          </div>
        )}
      </div>

      {reportOpen && (
        <ReportModal
          hospital={hospital}
          metrics={metrics}
          insights={reportInsights}
          onClose={() => setReportOpen(false)}
        />
      )}

      <div style={{ padding: '10px 24px', borderTop: `1px solid ${C.border}`, background: C.panel, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: C.muted }}>ED Sentinel Agent · Huron Healthcare AI Platform · {hospital.name} · Tick #{tick}</span>
        <div style={{ display: 'flex', gap: 12 }}>
          {['Stream live', 'Cache connected', 'Audit logging', 'Purge clock armed'].map((s, i) => (
            <span key={i} style={{ fontSize: 9, color: [C.green, C.accent, C.purple, C.orange][i] }}>● {s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
