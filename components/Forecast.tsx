import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const forecastData = [
  { month: 'Jun', value: 1100000 },
  { month: 'Jul', value: 1150000 },
  { month: 'Aug', value: 1200000 },
  { month: 'Sep', value: 1260000 }
];

export default function Forecast() {
  return (
    <div className="bg-black/30 border border-purple-500/20 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Revenue Forecast</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={forecastData}>
          <XAxis dataKey="month" stroke="#aaa" />
          <YAxis stroke="#aaa" />
          <Tooltip />
          <Line dataKey="value" stroke="#ec4899" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-gray-400 mt-4 text-sm">
        Forecast generated using historical trend analys
      </p>
    </div>
  );
}
