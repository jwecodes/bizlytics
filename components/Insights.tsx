'use client';

import { Sparkles } from 'lucide-react';

type Insight = {
  category: 'Opportunity' | 'Risk' | 'Trend';
  title: string;
  description: string;
  confidence: number;
};

const insights: Insight[] = [
  {
    category: 'Opportunity',
    title: 'High Efficiency at Pune Plant',
    description:
      'The Pune plant shows 18% higher production efficiency compared to other plants.',
    confidence: 91,
  },
  {
    category: 'Risk',
    title: 'Rising Maintenance Cost',
    description:
      'Maintenance costs have increased by 22% over the last month, indicating potential equipment issues.',
    confidence: 86,
  },
  {
    category: 'Trend',
    title: 'Stable Revenue Growth',
    description:
      'Revenue has shown consistent growth over the past five months with minimal fluctuations.',
    confidence: 94,
  },
];

export default function Insights() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="text-purple-400" />
        <h2 className="text-2xl font-bold text-white">
          AI-Generated Insights
        </h2>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="bg-black/30 backdrop-blur-lg border border-purple-500/20 rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  insight.category === 'Opportunity'
                    ? 'bg-green-500/20 text-green-400'
                    : insight.category === 'Risk'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {insight.category}
              </span>

              <span className="text-sm text-gray-400">
                Confidence:{' '}
                <span className="text-purple-400 font-semibold">
                  {insight.confidence}%
                </span>
              </span>
            </div>

            <h3 className="text-lg font-semibold text-white mb-1">
              {insight.title}
            </h3>
            <p className="text-gray-300">{insight.description}</p>

            <div className="flex gap-3 mt-4">
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm">
                View Details
              </button>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
                Explain Why
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
