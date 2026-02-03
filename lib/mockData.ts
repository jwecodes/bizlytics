import { KPI, RevenuePoint, Insight } from './types';

export const kpis: KPI[] = [
  { label: 'Total Revenue', value: '₹12.3M', change: '+12.5%', trend: 'up' },
  { label: 'Production Units', value: '48,200', change: '+6.1%', trend: 'up' },
  { label: 'Defect Rate', value: '2.4%', change: '-0.8%', trend: 'down' },
  { label: 'Utilization', value: '87%', change: '+3.2%', trend: 'up' }
];

export const revenueData: RevenuePoint[] = [
  { month: 'Jan', revenue: 920000, forecast: 950000 },
  { month: 'Feb', revenue: 980000, forecast: 1000000 },
  { month: 'Mar', revenue: 940000, forecast: 970000 },
  { month: 'Apr', revenue: 1050000, forecast: 1080000 },
  { month: 'May', revenue: 1100000, forecast: 1150000 }
];

export const insights: Insight[] = [
  {
    category: 'Opportunity',
    title: 'High Production Efficiency in Pune Plant',
    description: 'Pune plant shows 18% higher efficiency compared to other plants.',
    confidence: 91
  },
  {
    category: 'Risk',
    title: 'Maintenance Cost Increasing',
    description: 'Maintenance cost has increased by 22% over the last month.',
    confidence: 86
  }
];
