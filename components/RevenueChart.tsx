'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type RevenueData = {
  month: string;
  revenue: number;
  forecast: number;
};

const revenueData: RevenueData[] = [
  { month: 'Jan', revenue: 920000, forecast: 950000 },
  { month: 'Feb', revenue: 980000, forecast: 1000000 },
  { month: 'Mar', revenue: 940000, forecast: 970000 },
  { month: 'Apr', revenue: 1050000, forecast: 1080000 },
  { month: 'May', revenue: 1100000, forecast: 1150000 },
  { month: 'Jun', revenue: 1180000, forecast: 1220000 },
];

export default function RevenueChart() {
  return (
    <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📈 Revenue Trend & Forecast
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" stroke="#c4b5fd" />
          <YAxis stroke="#c4b5fd" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#fff',
            }}
            labelStyle={{ color: '#e9d5ff' }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#a78bfa"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#f472b6"
            strokeWidth={3}
            strokeDasharray="6 6"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-sm text-gray-400 mt-4">
        Forecast generated using historical trends and predictive analysis.
      </p>
    </div>
  );
}
