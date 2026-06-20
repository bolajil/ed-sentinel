import { useState, useCallback, useRef } from 'react';
import { MetricSnapshot } from '../types';
import { CACHE_BASELINES } from '../data/static';

export interface MetricHistoryEntry {
  ts: string;
  tick: number;
  values: Record<string, number>;
}

export interface HospitalNamespace {
  ingestedData: Record<string, number> | null;
  baselines: Record<string, number>;        // per-hospital 4-week baseline
  history: MetricHistoryEntry[];            // rolling window, last 8 snapshots
  lastUpdated: string | null;
}

const MAX_HISTORY = 8;

function defaultNamespace(): HospitalNamespace {
  return {
    ingestedData: null,
    baselines: { ...CACHE_BASELINES },
    history: [],
    lastUpdated: null,
  };
}

// In-memory store keyed by hospital ID — namespaced, never cross-contaminating
const _store: Record<string, HospitalNamespace> = {};

function getOrCreate(hospitalId: string): HospitalNamespace {
  if (!_store[hospitalId]) _store[hospitalId] = defaultNamespace();
  return _store[hospitalId];
}

export function useHospitalStore(hospitalId: string) {
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender(n => n + 1), []);

  const ns = getOrCreate(hospitalId);

  const setIngestedData = useCallback((data: Record<string, number> | null) => {
    getOrCreate(hospitalId).ingestedData = data;
    getOrCreate(hospitalId).lastUpdated = new Date().toISOString();
    rerender();
  }, [hospitalId, rerender]);

  const clearIngestedData = useCallback(() => {
    getOrCreate(hospitalId).ingestedData = null;
    rerender();
  }, [hospitalId, rerender]);

  // Called on each metric tick — records a snapshot in this hospital's history
  const recordSnapshot = useCallback((metrics: MetricSnapshot[], tick: number) => {
    const ns = getOrCreate(hospitalId);
    const entry: MetricHistoryEntry = {
      ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      tick,
      values: Object.fromEntries(metrics.map(m => [m.id, m.value])),
    };
    ns.history = [...ns.history.slice(-(MAX_HISTORY - 1)), entry];
    ns.lastUpdated = entry.ts;
    // No rerender — callers check history directly on demand
  }, [hospitalId]);

  // Update a specific baseline for this hospital (after ingestion calibrates it)
  const calibrateBaseline = useCallback((metricId: string, value: number) => {
    getOrCreate(hospitalId).baselines[metricId] = value;
  }, [hospitalId]);

  return {
    ingestedData: ns.ingestedData,
    baselines: ns.baselines,
    history: ns.history,
    lastUpdated: ns.lastUpdated,
    setIngestedData,
    clearIngestedData,
    recordSnapshot,
    calibrateBaseline,
    hospitalId,
  };
}
