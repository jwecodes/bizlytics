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
