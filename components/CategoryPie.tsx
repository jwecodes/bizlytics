'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type CategoryData = {
  name: string;
  value: number;
  color: string;
};

const data: CategoryData[] = [
  { name: 'Electronics', value: 35, color: '#a78bfa' }, // purple
  { name: 'Clothing', value: 28, color: '#60a5fa' },    // blue
  { name: 'Food', value: 22, color: '#34d399' },        // green
  { name: 'Other', value: 15, color: '#f59e0b' },       // yellow
];

export default function CategoryPie() {
  return (
    <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-6">
        Sales by Categor
      </h3>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/2 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2 space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-300">
                {item.name} ({item.value}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
