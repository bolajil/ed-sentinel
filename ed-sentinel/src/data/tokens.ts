export const C = {
  bg:        '#080C14',
  panel:     '#0D1420',
  card:      '#111B2B',
  border:    '#1A2D45',
  borderHi:  '#1E4A7A',
  accent:    '#00D4FF',
  accentDim: '#00D4FF22',
  green:     '#00E5A0',
  greenDim:  '#00E5A022',
  red:       '#FF3D5A',
  redDim:    '#FF3D5A22',
  orange:    '#FF7A2F',
  orangeDim: '#FF7A2F22',
  yellow:    '#FFD166',
  yellowDim: '#FFD16622',
  purple:    '#A78BFA',
  purpleDim: '#A78BFA22',
  text:      '#CBD5E1',
  muted:     '#475569',
  white:     '#F8FAFC',
} as const;

export const STATUS_CONFIG = {
  ok:       { color: '#00E5A0', bg: '#00E5A022', label: 'OK',       icon: '●' },
  warning:  { color: '#FFD166', bg: '#FFD16622', label: 'WARN',     icon: '▲' },
  critical: { color: '#FF3D5A', bg: '#FF3D5A22', label: 'CRITICAL', icon: '■' },
} as const;
