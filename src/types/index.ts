/**
 * Shared contracts between the frontend and the SAR backend.
 * Keep in sync with BACKEND_API_SPEC.md.
 */

export type Language = 'en' | 'ar';

/** Prose can be localized; numeric/visual fields never are. */
export type LocalizedText = string | { en: string; ar: string };

export type SiteKind = 'wetland' | 'forest';

/** Parameters that drive the procedural scene renderer. */
export interface SceneParams {
  /** 0–1 open-water fraction. */
  water: number;
  /** 0–1 vegetation density / emergent canopy. */
  emergent: number;
  /** 0–1 burn fraction (forest only). */
  burn: number;
  /** 0–1 cloud cover on the optical view (radar ignores it). */
  cloud: number;
}

export interface SceneState {
  date: string;
  label: LocalizedText;
  params: SceneParams;
  caption: LocalizedText;
  happened: LocalizedText;
  why: LocalizedText;
  polarization: LocalizedText;
}

export interface MeasurementPair {
  before: number;
  after: number;
}

export interface SiteMeasurements {
  vv: MeasurementPair;
  vh: MeasurementPair;
  /** VH − VV in dB. */
  crossPol: MeasurementPair;
  dateBefore: string;
  dateAfter: string;
  source: 'illustrative' | 'nisar' | 'sentinel-1';
}

export interface SeriesPoint {
  date: string;
  vv: number;
  vh: number;
  water?: number;
  burn?: number;
  change: number;
}

export interface RecoveryPoint {
  month: number;
  pct: number;
  projected: boolean;
}

export interface RecoverySeries {
  thresholdDefault: number;
  startLabel: LocalizedText;
  points: RecoveryPoint[];
  note: LocalizedText;
}

export interface ResearcherNotes {
  acquisition: LocalizedText;
  interpretation: LocalizedText[];
  limits: LocalizedText[];
  methods: LocalizedText[];
  sources: { label: string; href: string }[];
}

export interface SiteTag {
  key: 'terrain' | 'soil' | 'canopy' | 'driver';
  value: LocalizedText;
}

export interface StudyArea {
  id: string;
  kind: SiteKind;
  seed: number;
  name: LocalizedText;
  region: LocalizedText;
  coords: { lat: number; lng: number };
  wkt: string;
  eventDate: string;
  headline: LocalizedText;
  tags: SiteTag[];
  story: LocalizedText[];
  states: { before: SceneState; after: SceneState };
  measurements: SiteMeasurements;
  series: SeriesPoint[];
  pulse: number[];
  stablePulse: number[];
  recovery: RecoverySeries;
  contrast: { dominant: LocalizedText; signature: LocalizedText; timescale: LocalizedText };
  researcher: ResearcherNotes;
  updatedAt?: string | null;
}

/** Standard backend envelope (plain payloads are also tolerated). */
export interface ApiEnvelope<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface NisarStatus {
  operational: boolean;
  phase?: string;
  lastAcquisition?: string;
  nextAcquisition?: string;
  products?: string[];
}

export interface StudyAreasResponse {
  sites: StudyArea[];
  source: 'api' | 'local';
  error: string | null;
}
