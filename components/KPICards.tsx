import { TrendingUp, TrendingDown } from 'lucide-react';
import { kpis } from '@/lib/mockData';

export default function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-gray-400">{kpi.label}</p>
            <span
              className={`px-3 py-1 rounded-lg text-sm ${
                kpi.trend === 'up'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {kpi.change}
            </span>
          </div>

          <h2 className="text-3xl font-bold">{kpi.value}</h2>

          <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
            {kpi.trend === 'up' ? (
              <TrendingUp className="text-green-400" size={14} />
            ) : (
              <TrendingDown className="text-red-400" size={14} />
            )}
            vs last peri
          </p>
        </div>
      ))}
    </div>
  );
}
