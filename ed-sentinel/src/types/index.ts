export type MetricStatus = 'ok' | 'warning' | 'critical';

export interface MetricDef {
  id: string;
  label: string;
  unit: string;
  warn: number;
  crit: number;
  cacheKey: string;
}

export interface MetricSnapshot extends MetricDef {
  value: number;
  status: MetricStatus;
  delta: number | null;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  ehr: 'Epic' | 'Cerner' | 'Meditech';
  beds: number;
  ftHours: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  citations?: string[];
  confidence?: 'high' | 'medium' | 'low';
}

export interface PurgeLogEntry {
  time: string;
  type: 'save' | 'purge' | 'auto_purge';
  msg: string;
}

export type PurgeState = 'idle' | 'reminder_sent' | 'auto_purge';
