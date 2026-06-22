<<<<<<< HEAD
import React from 'react';
import { Hospital } from '../types';
import { HOSPITALS } from '../data/static';
=======
import React, { useState, useMemo } from 'react';
import { Hospital } from '../types';
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
import { useTheme } from '../context/ThemeContext';

const EHR_COLORS: Record<string, string> = {
  Epic:    '#00D4FF',
  Cerner:  '#A78BFA',
  Meditech:'#FFD166',
};
<<<<<<< HEAD

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
=======
const EHR_DEFAULT = '#94A3B8';

const EHR_OPTIONS = ['Epic', 'Cerner', 'Meditech', 'Allscripts', 'athenahealth', 'Other'];

interface Props {
  hospitals: Hospital[];
  selected: Hospital;
  onChange: (h: Hospital) => void;
  onAddHospital: (h: Hospital) => void;
}

const EMPTY_FORM = { name: '', city: '', ehr: 'Epic', beds: '', ftHours: 'Mon–Sun 8AM–10PM' };

export const HospitalSelector: React.FC<Props> = ({ hospitals, selected, onChange, onAddHospital }) => {
  const { colors: C } = useTheme();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return hospitals;
    return hospitals.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.ehr.toLowerCase().includes(q)
    );
  }, [hospitals, search]);

  function handleAdd() {
    if (!form.name.trim()) { setFormError('Hospital name is required.'); return; }
    if (!form.city.trim()) { setFormError('City is required.'); return; }
    const beds = parseInt(form.beds as string, 10);
    if (!beds || beds < 1) { setFormError('Enter a valid bed count.'); return; }

    const newHospital: Hospital = {
      id: 'custom_' + Date.now(),
      name: form.name.trim(),
      city: form.city.trim(),
      ehr: form.ehr,
      beds,
      ftHours: form.ftHours.trim() || 'Mon–Sun 8AM–10PM',
    };
    onAddHospital(newHospital);
    onChange(newHospital);
    setShowAdd(false);
    setForm(EMPTY_FORM);
    setFormError('');
    setSearch('');
  }

  const inputStyle = {
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
    padding: '7px 10px', color: C.text, fontSize: 12, width: '100%', boxSizing: 'border-box' as const,
    outline: 'none',
  };

  return (
    <div>
      {/* Search bar + add button */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '0 0 220px' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 12, pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${hospitals.length} hospitals…`}
            style={{ ...inputStyle, paddingLeft: 28 }}
          />
        </div>
        <button
          onClick={() => { setShowAdd(true); setFormError(''); }}
          title="Add hospital"
          style={{
            background: C.accentDim, border: `1px solid ${C.accent}`, borderRadius: 6,
            padding: '6px 12px', color: C.accent, fontSize: 12, cursor: 'pointer', fontWeight: 700,
          }}
        >+ Add Hospital</button>
        {search && (
          <span style={{ fontSize: 10, color: C.muted }}>
            {filtered.length} of {hospitals.length}
          </span>
        )}
      </div>

      {/* Hospital tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filtered.length === 0 && (
          <span style={{ fontSize: 11, color: C.muted, alignSelf: 'center' }}>No hospitals match "{search}"</span>
        )}
        {filtered.map(h => {
          const active = h.id === selected.id;
          const color = EHR_COLORS[h.ehr] || EHR_DEFAULT;
          return (
            <button key={h.id} onClick={() => onChange(h)} style={{
              background: active ? `${color}18` : C.card,
              border: `1px solid ${active ? color : C.border}`,
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
              transition: 'all 0.2s', textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: active ? color : C.text }}>{h.name}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{h.city} · {h.ehr} · {h.beds} beds</div>
            </button>
          );
        })}
      </div>

      {/* Add Hospital modal */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{
            background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px #00000066',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 18 }}>Add Hospital</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hospital Name *</div>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. City Medical Center" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>City, State *</div>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Austin, TX" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>EHR System</div>
                  <select value={form.ehr} onChange={e => setForm(f => ({ ...f, ehr: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {EHR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>ED Beds *</div>
                  <input value={form.beds} onChange={e => setForm(f => ({ ...f, beds: e.target.value }))}
                    placeholder="e.g. 40" type="number" min={1} style={inputStyle} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fast Track Hours</div>
                <input value={form.ftHours} onChange={e => setForm(f => ({ ...f, ftHours: e.target.value }))}
                  placeholder="e.g. Mon–Fri 10AM–10PM" style={inputStyle} />
              </div>
            </div>

            {formError && (
              <div style={{ marginTop: 10, fontSize: 11, color: C.red }}>{formError}</div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); setFormError(''); }}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 16px', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleAdd}
                style={{ background: C.accent, border: 'none', borderRadius: 6, padding: '7px 18px', color: '#000', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                Add to Board
              </button>
            </div>
          </div>
        </div>
      )}
>>>>>>> 60ac6ab9c6c51646cba0422b87ad53503a772452
    </div>
  );
};
