import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { useTheme } from '../context/ThemeContext';
import { CHAT_SUGGESTIONS } from '../data/static';

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onGenerateReport?: (insights: string) => void;
}

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') ? <strong key={i} style={{ color: '#F8FAFC' }}>{p.slice(2, -2)}</strong> : p
  );
}

const CONFIDENCE_COLORS = { high: '#00E5A0', medium: '#FFD166', low: '#FF7A2F' };

export const ChatPanel: React.FC<Props> = ({ messages, loading, onSend, onGenerateReport }) => {
  const { colors: C } = useTheme();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleGenerateReport = () => {
    const lastAgent = [...messages].reverse().find(m => m.role === 'agent' && m.id !== '0');
    onGenerateReport?.(lastAgent?.content ?? '');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput('');
    onSend(t);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.panel, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}`, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.white }}>Sentinel Chat</div>
          <div style={{ fontSize: 10, color: C.muted }}>Powered by Claude · Evidence-grounded answers</div>
        </div>
        {messages.length > 1 && onGenerateReport && (
          <button onClick={handleGenerateReport} style={{
            background: C.accentDim, border: `1px solid ${C.accent}`,
            borderRadius: 6, padding: '5px 10px', color: C.accent,
            fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            📄 Report
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '88%',
              background: msg.role === 'user' ? C.accentDim : C.card,
              border: `1px solid ${msg.role === 'user' ? C.accent + '55' : C.border}`,
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
              padding: '10px 13px',
            }}>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.65 }}>
                {renderContent(msg.content)}
              </div>
              {msg.role === 'agent' && msg.confidence && (
                <div style={{ marginTop: 6, fontSize: 9, color: CONFIDENCE_COLORS[msg.confidence], textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  ● {msg.confidence} confidence
                </div>
              )}
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>{msg.timestamp}</div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '4px 12px 12px 12px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: C.accent,
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0 }}>
          {CHAT_SUGGESTIONS.slice(0, 4).map((s, i) => (
            <button key={i} onClick={() => onSend(s)} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '5px 10px', color: C.muted, fontSize: 10, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = C.accent; (e.target as HTMLElement).style.color = C.accent; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = C.border; (e.target as HTMLElement).style.color = C.muted; }}
            >{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about LWBS, boarding, fast-track, staffing..."
          style={{
            flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '9px 12px', color: C.white, fontSize: 12, outline: 'none',
          }}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()} style={{
          background: loading || !input.trim() ? C.card : C.accentDim,
          border: `1px solid ${loading || !input.trim() ? C.border : C.accent}`,
          borderRadius: 8, padding: '9px 16px', color: loading || !input.trim() ? C.muted : C.accent,
          fontSize: 12, fontWeight: 700, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}>Send</button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};
