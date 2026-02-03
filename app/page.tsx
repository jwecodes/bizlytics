'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Tabs from '@/components/Tabs';
import KPICards from '@/components/KPICards';
import RevenueChart from '@/components/RevenueChart';
import Insights from '@/components/Insights';
import Forecast from '@/components/Forecast';
import Anomalies from '@/components/Anomalies';
import { TabType } from '@/lib/types';
import CategoryPie from '@/components/CategoryPie';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div>
      <Header />
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <>
            <KPICards />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <RevenueChart />
              <CategoryPie />
            </div>
          </>
        )}

        {activeTab === 'insights' && <Insights />}
        {activeTab === 'anomalies' && <Anomalies />}
        {activeTab === 'forecast' && <Forecast />}
      </main>
    </div>
  );
}
