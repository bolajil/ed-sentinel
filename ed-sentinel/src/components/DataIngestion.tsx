import React, { useRef, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Hospital } from '../types';
import { useTheme } from '../context/ThemeContext';
import { METRIC_DEFS } from '../data/static';

interface Props {
  hospital: Hospital;
  onApply: (values: Record<string, number>) => void;
  hasIngested: boolean;
  onClear: () => void;
}

interface IngestionResult {
  metrics: Record<string, number | null>;
  quality: { issues: string[]; rows_processed: number; confidence: 'high' | 'medium' | 'low' };
  mappings: Record<string, string>;
}

const METRIC_LABELS: Record<string, string> = Object.fromEntries(
  METRIC_DEFS.map(d => [d.id, d.label])
);

const CONFIDENCE_COLOR: Record<string, string> = {
  high: '#00E5A0', medium: '#FFD166', low: '#FF7A2F',
};

export const DataIngestion: React.FC<Props> = ({ hospital, onApply, hasIngested, onClear }) => {
  const { colors: C } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'json' | 'unsupported' | null>(null);
  const [rows, setRows]         = useState<string[][]>([]);
  const [jsonPreview, setJsonPreview] = useState('');
  const [totalRows, setTotalRows]     = useState(0);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult]       = useState<IngestionResult | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const processFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setRows([]);
    setJsonPreview('');

    const ext = f.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      setFileType('csv');
      // Full parse to count rows, but only keep first 60
      Papa.parse<string[]>(f, {
        header: false,
        skipEmptyLines: true,
        complete: (res) => {
          setTotalRows(res.data.length);
          setRows(res.data.slice(0, 60) as string[][]);
        },
      });
    } else if (ext === 'json') {
      setFileType('json');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = e.target?.result as string;
          const parsed = JSON.parse(raw);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          setTotalRows(arr.length);
          setJsonPreview(JSON.stringify(arr.slice(0, 50), null, 2).slice(0, 6000));
        } catch {
          setFileType('unsupported');
          setError('Invalid JSON — check the file and try again.');
        }
      };
      reader.readAsText(f);
    } else {
      setFileType('unsupported');
      setError('Unsupported file type. Please upload a CSV or JSON file. Excel users: save as CSV from Excel first.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleAnalyze = async () => {
    if (!file || !fileType || fileType === 'unsupported') return;
    setAnalyzing(true);
    setError(null);

    const dataPreview = fileType === 'csv'
      ? rows.map(r => r.join(',')).join('\n')
      : jsonPreview;

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataPreview,
          fileType,
          hospitalName: hospital.name,
          rowCount: totalRows,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!result?.metrics) return;
    const values: Record<string, number> = {};
    for (const [id, val] of Object.entries(result.metrics)) {
      if (val !== null && val !== undefined && typeof val === 'number') {
        values[id] = val;
      }
    }
    onApply(values);
  };

  const extractedCount = result
    ? Object.values(result.metrics).filter(v => v !== null).length
    : 0;

  // Preview table — show first 5 data rows, max 6 columns
  const headers = rows[0] ?? [];
  const previewCols = Math.min(headers.length, 6);
  const previewRows = rows.slice(1, 6);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.white, marginBottom: 4 }}>
          Data Ingestion
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>
          Upload an export from your EHR system. We accept clean or unclean data — AI handles column mapping, cleaning, and metric extraction automatically.
        </div>
      </div>

      {/* Active ingestion banner */}
      {hasIngested && (
        <div style={{ background: '#00E5A014', border: '1px solid #00E5A044', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, color: '#00E5A0', fontWeight: 700 }}>● Live ingested data is active on the dashboard</span>
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 10 }}>Simulation is paused for overridden metrics</span>
          </div>
          <button onClick={onClear} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 12px', color: C.muted, fontSize: 11, cursor: 'pointer' }}>
            Clear & resume simulation
          </button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? C.accent : C.border}`,
          borderRadius: 12, padding: '36px 20px', textAlign: 'center',
          background: dragging ? C.accentDim : C.panel,
          cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s',
        }}
      >
        <input
          ref={inputRef} type="file" accept=".csv,.json"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />
        <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
        <div style={{ fontSize: 13, color: C.white, fontWeight: 600, marginBottom: 4 }}>
          {file ? file.name : 'Drop file here or click to browse'}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>
          {file
            ? `${fileType?.toUpperCase()} · ${totalRows.toLocaleString()} rows · ${(file.size / 1024).toFixed(0)} KB`
            : 'CSV or JSON · Epic, Cerner, Meditech exports · Clean or unclean data accepted'}
        </div>
      </div>

      {/* Unsupported / error */}
      {(fileType === 'unsupported' || error) && (
        <div style={{ background: '#FF3D5A14', border: '1px solid #FF3D5A44', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#FF3D5A' }}>
          {error || 'Unsupported file type. Upload CSV or JSON.'}
        </div>
      )}

      {/* CSV preview table */}
      {fileType === 'csv' && rows.length > 1 && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16, overflowX: 'auto' }}>
          <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Data Preview — {totalRows.toLocaleString()} rows · {headers.length} columns
            {headers.length > 6 && <span style={{ color: C.muted, fontWeight: 400 }}> (showing first 6 columns)</span>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {headers.slice(0, previewCols).map((h, i) => (
                  <th key={i} style={{ padding: '5px 10px', textAlign: 'left', color: C.accent, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  {row.slice(0, previewCols).map((cell, ci) => (
                    <td key={ci} style={{ padding: '5px 10px', color: C.muted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cell || <span style={{ color: C.border, fontStyle: 'italic' }}>empty</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON preview */}
      {fileType === 'json' && jsonPreview && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            JSON Preview — {totalRows.toLocaleString()} records
          </div>
          <pre style={{ fontSize: 10, color: C.muted, overflowX: 'auto', maxHeight: 180, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {jsonPreview.slice(0, 2000)}{jsonPreview.length > 2000 ? '\n...' : ''}
          </pre>
        </div>
      )}

      {/* Analyze button */}
      {file && fileType !== 'unsupported' && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing || rows.length < 2 && !jsonPreview}
          style={{
            width: '100%', padding: '12px', marginBottom: 20,
            background: analyzing ? C.card : C.accentDim,
            border: `1px solid ${analyzing ? C.border : C.accent}`,
            borderRadius: 10, color: analyzing ? C.muted : C.accent,
            fontSize: 13, fontWeight: 700, cursor: analyzing ? 'not-allowed' : 'pointer',
          }}
        >
          {analyzing ? '🔍 Analyzing data with AI…' : '🔍 Analyze & Map Columns with AI'}
        </button>
      )}

      {/* Analysis results */}
      {result && (
        <>
          {/* Quality summary */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>AI Analysis Complete</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: CONFIDENCE_COLOR[result.quality.confidence] }}>
                ● {result.quality.confidence.toUpperCase()} CONFIDENCE
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: result.quality.issues.length > 0 ? 12 : 0 }}>
              <div><span style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{extractedCount}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>of 12 metrics extracted</span></div>
              <div><span style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{result.quality.rows_processed.toLocaleString()}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>rows processed</span></div>
            </div>
            {result.quality.issues.length > 0 && (
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                <div style={{ fontSize: 10, color: C.yellow, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Data Quality Notes</div>
                {result.quality.issues.map((issue, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>▲ {issue}</div>
                ))}
              </div>
            )}
          </div>

          {/* Detected metrics grid */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Extracted Metric Values
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {METRIC_DEFS.map(def => {
                const val = result.metrics[def.id];
                const hasValue = val !== null && val !== undefined;
                const displayVal = hasValue
                  ? (def.unit === 'bool' ? (val === 1 ? 'OPEN' : 'CLOSED') : `${val} ${def.unit}`)
                  : null;
                return (
                  <div key={def.id} style={{
                    background: C.card, borderRadius: 8, padding: '10px 12px',
                    borderLeft: `3px solid ${hasValue ? C.accent : C.border}`,
                    opacity: hasValue ? 1 : 0.45,
                  }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{def.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: hasValue ? C.white : C.muted }}>
                      {displayVal ?? 'Not found'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column mappings */}
          {Object.keys(result.mappings).length > 0 && (
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Column Mappings Detected</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(result.mappings).map(([col, metricId]) => (
                  <div key={col} style={{ background: C.card, borderRadius: 6, padding: '4px 10px', fontSize: 10 }}>
                    <span style={{ color: C.muted }}>{col}</span>
                    <span style={{ color: C.border, margin: '0 5px' }}>→</span>
                    <span style={{ color: C.accent, fontWeight: 700 }}>{METRIC_LABELS[metricId] ?? metricId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          {extractedCount > 0 && (
            <button
              onClick={handleApply}
              style={{
                width: '100%', padding: '13px',
                background: '#00E5A014', border: '1px solid #00E5A0',
                borderRadius: 10, color: '#00E5A0',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ✓ Apply {extractedCount} Metrics to Dashboard
            </button>
          )}
        </>
      )}

      {/* Supported formats */}
      {!file && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', marginTop: 8 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Accepted Formats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              { fmt: 'CSV', icon: '📊', desc: 'Patient encounter exports, hourly aggregates, any ED report exported from your EHR' },
              { fmt: 'JSON', icon: '{ }', desc: 'FHIR bundles, REST API exports, custom JSON from Epic/Cerner/Meditech integrations' },
              { fmt: 'Unclean data OK', icon: '🧹', desc: 'Missing columns, inconsistent names, nulls, mixed types — AI cleans and maps automatically' },
              { fmt: 'Excel → CSV', icon: '📋', desc: 'Open in Excel, File → Save As → CSV (Comma delimited) — then upload here' },
            ].map(s => (
              <div key={s.fmt} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: C.card, borderRadius: 8 }}>
                <div style={{ fontSize: 18, flexShrink: 0, width: 28, textAlign: 'center' }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>{s.fmt}</div>
                  <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
