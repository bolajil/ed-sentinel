import { useState, useCallback } from 'react';
import { ChatMessage, MetricSnapshot } from '../types';
import { Hospital } from '../types';
import { MetricHistoryEntry } from './useHospitalStore';

interface ChatContext {
  metrics: MetricSnapshot[];
  history: MetricHistoryEntry[];       // rolling metric snapshots from this hospital
  baselines: Record<string, number>;   // hospital-specific baselines
  dataSource: 'simulated' | 'ingested'; // provenance of current metric values
}

function buildSystemPrompt(hospital: Hospital, ctx: ChatContext): string {
  const { metrics, history, baselines, dataSource } = ctx;

  const criticals = metrics.filter(m => m.status === 'critical').map(m => `${m.label}: ${m.value}${m.unit}`).join(', ');
  const warnings  = metrics.filter(m => m.status === 'warning').map(m => `${m.label}: ${m.value}${m.unit}`).join(', ');
  const oks       = metrics.filter(m => m.status === 'ok').map(m => `${m.label}: ${m.value}${m.unit}`).join(', ');

  // Build metric trend section from rolling history (oldest → newest)
  let trendSection = '';
  if (history.length >= 2) {
    const rows = history.slice(-6).map(h => {
      const arr  = h.values['arrivals']?.toFixed(1) ?? '?';
      const lwbs = h.values['lwbs_rate']?.toFixed(1) ?? '?';
      const dtr  = h.values['door_to_room']?.toFixed(0) ?? '?';
      const wrc  = h.values['waiting_room']?.toFixed(0) ?? '?';
      const brd  = h.values['boarding_census']?.toFixed(0) ?? '?';
      return `  ${h.ts} — Arrivals: ${arr}/hr  LWBS: ${lwbs}%  D→Room: ${dtr}min  Waiting: ${wrc}pts  Boarding: ${brd}pts`;
    }).join('\n');
    trendSection = `\nMETRIC TREND (last ${history.slice(-6).length} observations for ${hospital.name}):\n${rows}\n`;
  }

  // Baseline comparison context
  const aboveBaseline = metrics
    .filter(m => m.unit !== 'bool' && m.delta !== null && m.delta > 15)
    .map(m => `${m.label} +${m.delta}% above ${hospital.name} baseline`)
    .join('; ');

  return `You are the ED Data Sentinel Agent for Huron Healthcare AI Platform.
You are monitoring ${hospital.name} (${hospital.city}), a ${hospital.beds}-bed ED running ${hospital.ehr}.
Fast-track hours: ${hospital.ftHours}.
Hospital namespace: ${hospital.id} — data shown is isolated to this facility only.
Data source: ${dataSource === 'ingested' ? 'LIVE INGESTED DATA from customer EHR export' : 'SIMULATED (demo mode)'}.

CURRENT LIVE METRICS — ${hospital.name}:
CRITICAL: ${criticals || 'none'}
WARNING:  ${warnings  || 'none'}
OK:       ${oks}
${trendSection}
${aboveBaseline ? `ABOVE BASELINE: ${aboveBaseline}` : 'All key metrics within 15% of baseline.'}

4-WEEK CACHE BASELINES (${hospital.name}):
${metrics.filter(m => m.unit !== 'bool').map(m => `  ${m.label}: ${baselines[m.cacheKey] ?? '?'} ${m.unit}`).join('\n')}

GLOSSARY:
LWBS = Left Without Being Seen — patient registered but left before provider evaluation.
ESI = Emergency Severity Index (1=most severe, 5=least). ESI 4-5 are your LWBS risk pool.
Boarding = admitted patients occupying ED beds awaiting inpatient beds. Reduces usable ED capacity.
Fast-track = dedicated ESI 4-5 area. When closed, low-acuity patients overflow into main ED.

RULES:
1. Answer concisely in plain English — ED leaders are busy.
2. Always reference the live metric values and trend above.
3. If recommending action, name who owns it and when.
4. Structure: what is happening → why → what to do.
5. Do not invent facility-specific facts. If unknown, say so.
6. Keep responses under 200 words unless asked for a full brief.
7. End every response with: [HIGH CONFIDENCE], [MEDIUM CONFIDENCE], or [LOW CONFIDENCE — needs more data].`;
}

export function useChat(hospital: Hospital, ctx: ChatContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'agent',
      content: `Sentinel online for **${hospital.name}**. I'm monitoring all 12 ED metrics in real time and cross-checking against your 4-week cache baselines. Ask me anything about current performance, LWBS risk, or what leadership should do right now.`,
      timestamp: new Date().toLocaleTimeString(),
      confidence: 'high',
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'agent' ? 'assistant' : 'user' as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hospital-Id': hospital.id,   // namespace header for future server-side isolation
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          max_tokens: 1000,
          messages: [
            { role: 'system', content: buildSystemPrompt(hospital, ctx) },
            ...history,
            { role: 'user', content: text },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const msg = typeof data.error === 'string' ? data.error
          : data.error?.message ?? `API error ${response.status}`;
        throw new Error(msg);
      }

      const content = data.choices?.[0]?.message?.content ?? 'No response received.';
      const confidence = content.includes('[HIGH') ? 'high'
        : content.includes('[MEDIUM') ? 'medium' : 'low';

      const clean = content
        .replace(/\[HIGH CONFIDENCE\]/g, '')
        .replace(/\[MEDIUM CONFIDENCE\]/g, '')
        .replace(/\[LOW CONFIDENCE[^\]]*\]/g, '')
        .trim();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: clean,
        timestamp: new Date().toLocaleTimeString(),
        confidence,
      }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection error. Check your network and try again.';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: msg,
        timestamp: new Date().toLocaleTimeString(),
        confidence: 'low',
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, hospital, ctx]);

  const resetChat = useCallback((newHospital: Hospital) => {
    setMessages([{
      id: '0',
      role: 'agent',
      content: `Sentinel online for **${newHospital.name}**. Monitoring all 12 ED metrics in real time. Ask me anything about current performance or LWBS risk.`,
      timestamp: new Date().toLocaleTimeString(),
      confidence: 'high',
    }]);
  }, []);

  return { messages, loading, sendMessage, resetChat };
}
