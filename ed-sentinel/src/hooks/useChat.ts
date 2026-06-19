import { useState, useCallback } from 'react';
import { ChatMessage, MetricSnapshot } from '../types';
import { Hospital } from '../types';

function buildSystemPrompt(hospital: Hospital, metrics: MetricSnapshot[]): string {
  const criticals = metrics.filter(m => m.status === 'critical').map(m => `${m.label}: ${m.value}${m.unit}`).join(', ');
  const warnings  = metrics.filter(m => m.status === 'warning').map(m => `${m.label}: ${m.value}${m.unit}`).join(', ');
  const oks       = metrics.filter(m => m.status === 'ok').map(m => `${m.label}: ${m.value}${m.unit}`).join(', ');

  return `You are the ED Data Sentinel Agent for Huron Healthcare AI Platform.
You are monitoring ${hospital.name} (${hospital.city}), a ${hospital.beds}-bed ED running ${hospital.ehr}.
Fast-track hours: ${hospital.ftHours}.

CURRENT LIVE METRICS (as of this moment):
CRITICAL: ${criticals || 'none'}
WARNING:  ${warnings  || 'none'}
OK:       ${oks}

LWBS = Left Without Being Seen. A patient who registered but left before a provider evaluated them.
ESI = Emergency Severity Index (1=most severe, 5=least severe). ESI 4-5 patients are your LWBS risk pool.
Boarding = admitted patients occupying ED beds waiting for inpatient beds. This reduces usable ED capacity.
Fast-track = dedicated area for ESI 4-5 patients. When closed, those patients flood the main ED waiting room.

RULES:
1. Answer concisely and in plain English — ED leaders are busy.
2. Always tie your answer to the live metric values above.
3. If you recommend an action, say who owns it and when.
4. Separate what is happening from why it is happening from what to do.
5. Do not invent facts. If you don't know something facility-specific, say so.
6. Keep responses under 200 words unless asked for a full brief.
7. End every response with a confidence level: [HIGH CONFIDENCE], [MEDIUM CONFIDENCE], or [LOW CONFIDENCE — needs more data].`;
}

export function useChat(hospital: Hospital, metrics: MetricSnapshot[]) {
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

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: buildSystemPrompt(hospital, metrics),
          messages: [...history, { role: 'user', content: text }],
        }),
      });

      const data = await response.json();
      const content = data.content?.[0]?.text ?? 'No response received.';

      const confidence = content.includes('[HIGH') ? 'high'
        : content.includes('[MEDIUM') ? 'medium' : 'low';

      const clean = content
        .replace(/\[HIGH CONFIDENCE\]/g, '')
        .replace(/\[MEDIUM CONFIDENCE\]/g, '')
        .replace(/\[LOW CONFIDENCE[^\]]*\]/g, '')
        .trim();

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: clean,
        timestamp: new Date().toLocaleTimeString(),
        confidence,
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'Connection error. Check your network and try again.',
        timestamp: new Date().toLocaleTimeString(),
        confidence: 'low',
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, hospital, metrics]);

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
