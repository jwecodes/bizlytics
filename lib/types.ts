export type KPI = {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
};

export type RevenuePoint = {
  month: string;
  revenue: number;
  forecast: number;
};

export type Insight = {
  category: 'Opportunity' | 'Risk' | 'Trend';
  title: string;
  description: string;
  confidence: number;
};

export type TabType =
  | 'overview'
  | 'insights'
  | 'anomalies'
  | 'forecast'
  | 'segments';
