import { Hospital, MetricDef } from '../types';

export const HOSPITALS: Hospital[] = [
  { id: 'facility_a', name: 'Memorial General',      city: 'Houston, TX',      ehr: 'Epic',    beds: 48, ftHours: 'Mon–Sun 10AM–11PM' },
  { id: 'facility_b', name: 'St. Luke\'s Medical',   city: 'Chicago, IL',      ehr: 'Cerner',  beds: 36, ftHours: 'Mon–Fri 11AM–11PM' },
  { id: 'facility_c', name: 'Riverside Community',   city: 'Phoenix, AZ',      ehr: 'Meditech', beds: 28, ftHours: 'Mon–Sat 12PM–10PM' },
  { id: 'facility_d', name: 'Northeast Regional',    city: 'Boston, MA',       ehr: 'Epic',    beds: 52, ftHours: 'Mon–Sun 9AM–12AM' },
  { id: 'facility_e', name: 'Valley Health System',  city: 'Las Vegas, NV',    ehr: 'Cerner',  beds: 44, ftHours: 'Mon–Sun 11AM–11PM' },
];

export const METRIC_DEFS: MetricDef[] = [
  { id: 'arrivals',            label: 'Arrivals / hr',       unit: 'pts',  warn: 30,  crit: 40,  cacheKey: 'arrivals_4wk_avg' },
  { id: 'lwbs_rate',           label: 'LWBS Rate',           unit: '%',    warn: 4,   crit: 8,   cacheKey: 'lwbs_baseline_pct' },
  { id: 'door_to_triage',      label: 'Door → Triage',       unit: 'min',  warn: 15,  crit: 25,  cacheKey: 'dtt_4wk_avg' },
  { id: 'door_to_room',        label: 'Door → Room',         unit: 'min',  warn: 35,  crit: 55,  cacheKey: 'dtr_4wk_avg' },
  { id: 'arrival_to_provider', label: 'Arrival → Provider',  unit: 'min',  warn: 55,  crit: 80,  cacheKey: 'atp_4wk_avg' },
  { id: 'boarding_census',     label: 'Boarding Census',     unit: 'pts',  warn: 5,   crit: 8,   cacheKey: 'boarding_4wk_avg' },
  { id: 'waiting_room',        label: 'Waiting Room Census', unit: 'pts',  warn: 10,  crit: 18,  cacheKey: 'wr_census_avg' },
  { id: 'ed_los_discharged',   label: 'ED LOS (Discharged)', unit: 'hrs',  warn: 3.5, crit: 5,   cacheKey: 'los_dc_avg' },
  { id: 'ed_los_admitted',     label: 'ED LOS (Admitted)',   unit: 'hrs',  warn: 5,   crit: 8,   cacheKey: 'los_adm_avg' },
  { id: 'esi_4_5_pct',         label: 'ESI 4-5 in Main ED', unit: '%',    warn: 35,  crit: 50,  cacheKey: 'esi45_baseline' },
  { id: 'fast_track_open',     label: 'Fast-Track Open',     unit: 'bool', warn: 0,   crit: 0,   cacheKey: 'ft_schedule' },
  { id: 'provider_coverage',   label: 'Provider Coverage',   unit: '%',    warn: 85,  crit: 70,  cacheKey: 'provider_plan_pct' },
];

export const CACHE_BASELINES: Record<string, number> = {
  arrivals_4wk_avg:   24,
  lwbs_baseline_pct:  3.4,
  dtt_4wk_avg:        12,
  dtr_4wk_avg:        31,
  atp_4wk_avg:        48,
  boarding_4wk_avg:   4,
  wr_census_avg:      9,
  los_dc_avg:         3.1,
  los_adm_avg:        5.5,
  esi45_baseline:     36,
  ft_schedule:        1,
  provider_plan_pct:  92,
};

export const CHAT_SUGGESTIONS = [
  'Why is LWBS spiking right now?',
  'Is boarding the problem or a staffing gap?',
  'Compare door-to-room vs last week',
  'What happened between 4 PM and 7 PM today?',
  'Send me the huddle brief for the charge nurse',
  'Which metrics are most critical right now?',
  'Is fast-track open and staffed?',
  'What should ED leadership do in the next 4 hours?',
];
