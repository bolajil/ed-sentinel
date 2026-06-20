export const DARK = {
  bg:        '#080C14',
  panel:     '#0D1420',
  card:      '#111B2B',
  border:    '#1A2D45',
  borderHi:  '#1E4A7A',
  headerBg:  'linear-gradient(135deg,#0A1628 0%,#080C14 100%)',
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

export const LIGHT = {
  bg:        '#F1F5F9',
  panel:     '#FFFFFF',
  card:      '#F8FAFC',
  border:    '#E2E8F0',
  borderHi:  '#93C5FD',
  headerBg:  'linear-gradient(135deg,#EFF6FF 0%,#F1F5F9 100%)',
  accent:    '#0284C7',
  accentDim: '#0284C714',
  green:     '#059669',
  greenDim:  '#05966914',
  red:       '#DC2626',
  redDim:    '#DC262614',
  orange:    '#EA580C',
  orangeDim: '#EA580C14',
  yellow:    '#B45309',
  yellowDim: '#B4530914',
  purple:    '#7C3AED',
  purpleDim: '#7C3AED14',
  text:      '#334155',
  muted:     '#64748B',
  white:     '#0F172A',
} as const;

export type Colors = { [K in keyof typeof DARK]: string };

// backward compat — components are migrating to useTheme()
export const C = DARK;

export const STATUS_CONFIG = {
  ok:       { color: DARK.green,  bg: DARK.greenDim,  label: 'OK',       icon: '●' },
  warning:  { color: DARK.yellow, bg: DARK.yellowDim, label: 'WARN',     icon: '▲' },
  critical: { color: DARK.red,    bg: DARK.redDim,    label: 'CRITICAL', icon: '■' },
} as const;
