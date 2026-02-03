import { TabType } from '@/lib/types';

type TabsProps = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
};

const tabs: TabType[] = [
  'overview',
  'insights',
  'anomalies',
  'forecast',
  'segments',
];

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 mt-6">
      <div className="flex gap-2 bg-black/30 p-2 rounded-2xl backdrop-blur-md">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-xl capitalize font-medium transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
