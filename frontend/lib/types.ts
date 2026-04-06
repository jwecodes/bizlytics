// ─────────────────────────────────────────────────────────────
//  ORIGINAL TYPES (unchanged)
// ─────────────────────────────────────────────────────────────

export interface KPI {
  total: number
  average: number
  max: number
  min: number
  trend: "up" | "down" | "stable"
  growth_rate_pct?: number
}

export interface NumericStats {
  mean: number
  median: number
  std: number
  min: number
  max: number
  q1: number
  q3: number
  iqr: number
  skewness: number
  kurtosis: number
  outlier_count: number
}

export interface DataQuality {
  total_rows: number
  total_columns: number
  duplicate_rows: number
  missing_values: Record<string, { count: number; pct: number }>
  correlations: Record<string, Record<string, number>>
  column_types: Record<string, string>
  numeric_stats?: Record<string, NumericStats>
}

export interface DomainInfo {
  domain: string
  confidence: number
  label: string
}

export interface ColumnProfile {
  date_cols: string[]
  numeric_cols: string[]
  categorical_cols: string[]
  id_cols: string[]
}

export interface ForecastPoint {
  ds: string
  yhat: number
  yhat_lower: number
  yhat_upper: number
}

export interface MLAnalysis {
  pca_coords: { x: number; y: number }[]
  segments: number[]
  segment_count: number
  segment_sizes: Record<string, number>
}

export interface AnomalyRootCause {
  row_index: number
  anomaly_types?: string[]
  top_reasons: {
    column: string
    value: number
    normal_avg: number
    z_score: number
    pct_diff: number
  }[]
}

export interface AnomalyResult {
  anomaly_indices: number[]
  anomaly_count: number
  anomaly_rows: Record<string, any>[]
  root_causes: AnomalyRootCause[]
  note?: string
}

export interface Insight {
  title: string
  description: string
  sentiment?: string
  impact?: string
  priority?: string
}

export interface InsightsResult {
  executive_summary: string
  trends: Insight[]
  risks: Insight[]
  opportunities: Insight[]
  recommendations: { action: string; priority: string; outcome: string }[]
  anomaly_explanations: string[]
}

export interface AnalysisResult {
  file_id: string
  domain: DomainInfo
  column_profile: ColumnProfile
  data_quality: DataQuality
  kpis: Record<string, any>
  anomalies: AnomalyResult
  ml_analysis: MLAnalysis
  forecast: {
    forecast: ForecastPoint[]
    trend_direction: string
  }
  insights: InsightsResult
}


// ─────────────────────────────────────────────────────────────
//  Multi-file comparison types
// ─────────────────────────────────────────────────────────────

/** Summary stats for one file/period in a multi-file comparison */
export interface MultiFileSummary {
  label: string
  rows: number
  columns: number
  means: Record<string, number>
  totals: Record<string, number>
  std: Record<string, number>
  missing_pct: number
}

/** Year-over-year (or period-over-period) growth entry for one column */
export interface GrowthEntry {
  from: string
  to: string
  growth_pct: number | null
  direction: "improved" | "declined" | "unchanged"
}

/** Best / worst period summary for one column */
export interface PerformanceSummary {
  best: string
  worst: string
  overall_trend: "upward" | "downward"
  /** Growth % from the first period to the last */
  total_growth_pct: number | null
}

// ─────────────────────────────────────────────────────────────
//  NEW: Column Evolution types
// ─────────────────────────────────────────────────────────────

/**
 * Per-period delta — which columns were added or removed compared to
 * the immediately preceding period.
 */
export interface PeriodSchemaDelta {
  label: string
  total_cols: number
  /** Columns that exist in this period but NOT in the previous one */
  new_vs_prev: string[]
  /** Columns that existed in the previous period but are GONE here */
  dropped_vs_prev: string[]
}

/**
 * Full schema evolution analysis across all uploaded periods.
 */
export interface ColumnEvolution {
  /**
   * Presence matrix: for every column seen across any file,
   * records whether it exists in each period.
   * Shape: { columnName: { periodLabel: boolean } }
   */
  presence_matrix: Record<string, Record<string, boolean>>
  /** Every column seen in at least one file */
  all_columns: string[]
  /** Columns present in every single file */
  common_columns: string[]
  /** Columns present in 2+ files but NOT in all files */
  partial_columns: string[]
  /** Columns present in exactly one file */
  unique_columns: string[]
  /** Columns that do NOT exist in the very first file */
  new_columns: string[]
  /** Columns that exist in the first file but are gone in the last file */
  dropped_columns: string[]
  /**
   * Schema stability score 0–100.
   * 100 = every column is identical across all files.
   * Formula: (common_columns / all_columns) × 100
   */
  schema_stability: number
  /** Period-by-period schema delta */
  per_period_stats: PeriodSchemaDelta[]
}

/**
 * Comparison stats for one partially-present column (exists in 2+ but not all files).
 */
export interface PartialColumnEntry {
  column: string
  /** Period labels where this column IS present */
  available_in: string[]
  /** Period labels where this column is MISSING */
  missing_in: string[]
  /** Percentage of periods that have this column */
  coverage_pct: number
  /** Stats for each period that contains the column */
  per_period: {
    label: string
    mean: number
    total: number
    std: number
    count: number
  }[]
  overall_trend: "upward" | "downward" | "stable"
  best_period: string
  worst_period: string
}

/** Full response shape returned by POST /compare/multi */
export interface MultiCompareResult {
  labels: string[]
  file_count: number
  /** Numeric columns present in EVERY file (used for full trend analysis) */
  common_columns: string[]
  per_file: MultiFileSummary[]
  trend_analysis: Record<string, { means: number[]; totals: number[] }>
  growth_rates: Record<string, GrowthEntry[]>
  performance: Record<string, PerformanceSummary>
  /** Full schema evolution analysis — covers ALL columns, not just common ones */
  column_evolution: ColumnEvolution
  /** Analysis for columns present in some but not all files */
  partial_analysis: PartialColumnEntry[]
  summary: {
    improved_metrics: string[]
    declined_metrics: string[]
    total_metrics_compared: number
    /** Schema stability score 0–100 */
    schema_stability: number
    /** Number of columns present in some but not all files */
    partial_columns_count: number
    /** Number of columns present in exactly one file */
    unique_columns_count: number
  }
  narrative?: string
}
