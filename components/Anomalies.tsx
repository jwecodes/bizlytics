import { AlertTriangle } from 'lucide-react';

const anomalies = [
  {
    id: 1,
    type: 'High Downtime',
    date: '2024-03-14',
    severity: 'High',
    description: 'Machine downtime exceeded normal threshold by 40%.'
  },
  {
    id: 2,
    type: 'Cost Spike',
    date: '2024-03-19',
    severity: 'Medium',
    description: 'Maintenance cost increased abnormally for Chennai plant.'
  }
];

export default function Anomalies() {
  return (
    <div>
      <h2 className="text-xl font-bold flex gap-2 mb-4">
        <AlertTriangle className="text-orange-400" /> Detected Anomalies
      </h2>

      {anomalies.map((a) => (
        <div
          key={a.id}
          className="bg-black/30 border border-purple-500/20 rounded-xl p-6 mb-4"
        >
          <div className="flex justify-between">
            <div>
              <h3 className="font-semibold">{a.type}</h3>
              <p className="text-gray-300">{a.description}</p>
              <p className="text-sm text-gray-400 mt-1">Date: {a.date}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                a.severity === 'High'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {a.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
