import { useState, useEffect } from 'react';
import { MetricSnapshot, MetricStatus } from '../types';
import { METRIC_DEFS, CACHE_BASELINES } from '../data/static';

// Smooth sine-wave targets — no random noise
function targetValue(id: string, tick: number): number {
  const v: Record<string, number> = {
    arrivals:            28 + Math.sin(tick / 8) * 10,
    lwbs_rate:           3.1 + Math.max(0, Math.sin(tick / 6) * 5),
    door_to_triage:      13 + Math.sin(tick / 12) * 2,
    door_to_room:        38 + Math.max(0, Math.sin(tick / 7) * 22),
    arrival_to_provider: 52 + Math.max(0, Math.sin(tick / 6) * 30),
    boarding_census:     Math.max(0, 5 + Math.sin(tick / 9) * 4),
    waiting_room:        Math.max(0, 9 + Math.sin(tick / 6) * 12),
    ed_los_discharged:   3.2 + Math.sin(tick / 15) * 0.4,
    ed_los_admitted:     5.8 + Math.sin(tick / 12) * 0.8,
    esi_4_5_pct:         38 + Math.sin(tick / 10) * 4,
    fast_track_open:     tick % 20 < 15 ? 1 : 0,
    provider_coverage:   88 + Math.sin(tick / 11) * 6,
  };
  return v[id] ?? 0;
}

function getStatus(id: string, unit: string, warn: number, crit: number, value: number): MetricStatus {
  if (unit === 'bool') return value === 1 ? 'ok' : 'critical';
  if (id === 'provider_coverage') {
    if (value < crit) return 'critical';
    if (value < warn) return 'warning';
    return 'ok';
  }
  if (value >= crit) return 'critical';
  if (value >= warn) return 'warning';
  return 'ok';
}

export function useMetrics(
  paused: boolean,
  overrides: Record<string, number> | null = null,
): { metrics: MetricSnapshot[]; tick: number } {
  const [tick, setTick] = useState(0);
  const [displayed, setDisplayed] = useState<Record<string, number>>(() =>
    Object.fromEntries(METRIC_DEFS.map(d => [d.id, Math.round(targetValue(d.id, 0) * 10) / 10]))
  );

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setTick(v => v + 1), 6000);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setDisplayed(prev => {
        const next: Record<string, number> = {};
        for (const def of METRIC_DEFS) {
          const target = overrides?.[def.id] !== undefined
            ? overrides[def.id]
            : targetValue(def.id, tick);
          if (def.unit === 'bool') {
            next[def.id] = target;
          } else {
            const stepped = prev[def.id] + (target - prev[def.id]) * 0.12;
            next[def.id] = Math.round(stepped * 10) / 10;
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [paused, tick, overrides]);

  const metrics: MetricSnapshot[] = METRIC_DEFS.map(def => {
    const value = displayed[def.id] ?? targetValue(def.id, tick);
    const status = getStatus(def.id, def.unit, def.warn, def.crit, value);
    const base = CACHE_BASELINES[def.cacheKey];
    const delta = base ? Math.round(((value - base) / base) * 100) : null;
    return { ...def, value, status, delta };
  });

  return { metrics, tick };
}
