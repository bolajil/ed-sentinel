import { useState, useEffect } from 'react';
import { MetricSnapshot, MetricStatus } from '../types';
import { METRIC_DEFS, CACHE_BASELINES } from '../data/static';

function simulateValue(id: string, tick: number): number {
  const noise = () => (Math.random() - 0.5) * 2;
  const bases: Record<string, number> = {
    arrivals:            28 + Math.sin(tick / 8) * 10 + noise(),
    lwbs_rate:           3.1 + Math.max(0, Math.sin(tick / 6) * 5) + noise() * 0.15,
    door_to_triage:      13 + noise(),
    door_to_room:        38 + Math.max(0, Math.sin(tick / 7) * 22) + noise(),
    arrival_to_provider: 52 + Math.max(0, Math.sin(tick / 6) * 30) + noise(),
    boarding_census:     Math.max(0, 5 + Math.sin(tick / 9) * 4 + noise() * 0.5),
    waiting_room:        Math.max(0, 9 + Math.sin(tick / 6) * 12 + noise() * 0.5),
    ed_los_discharged:   3.2 + noise() * 0.15,
    ed_los_admitted:     5.8 + noise() * 0.2,
    esi_4_5_pct:         38 + noise(),
    fast_track_open:     tick % 20 < 15 ? 1 : 0,
    provider_coverage:   88 + noise() * 2,
  };
  return Math.round((bases[id] ?? 0) * 10) / 10;
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

export function useMetrics(paused: boolean): { metrics: MetricSnapshot[]; tick: number } {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setTick(v => v + 1), 5000);
    return () => clearInterval(t);
  }, [paused]);

  const metrics: MetricSnapshot[] = METRIC_DEFS.map(def => {
    const value = simulateValue(def.id, tick);
    const status = getStatus(def.id, def.unit, def.warn, def.crit, value);
    const base = CACHE_BASELINES[def.cacheKey];
    const delta = base ? Math.round(((value - base) / base) * 100) : null;
    return { ...def, value, status, delta };
  });

  return { metrics, tick };
}
