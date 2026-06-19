import React from 'react';
import { Hospital } from '../types';
import { HOSPITALS } from '../data/static';
import { useTheme } from '../context/ThemeContext';

const EHR_COLORS: Record<string, string> = {
  Epic:    '#00D4FF',
  Cerner:  '#A78BFA',
  Meditech:'#FFD166',
};

interface Props {
  selected: Hospital;
  onChange: (h: Hospital) => void;
}

export const HospitalSelector: React.FC<Props> = ({ selected, onChange }) => {
  const { colors: C } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {HOSPITALS.map(h => {
        const active = h.id === selected.id;
        return (
          <button key={h.id} onClick={() => onChange(h)} style={{
            background: active ? `${EHR_COLORS[h.ehr]}18` : C.card,
            border: `1px solid ${active ? EHR_COLORS[h.ehr] : C.border}`,
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            transition: 'all 0.2s', textAlign: 'left',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: active ? EHR_COLORS[h.ehr] : C.text }}>{h.name}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{h.city} · {h.ehr} · {h.beds} beds</div>
          </button>
        );
      })}
    </div>
  );
};
